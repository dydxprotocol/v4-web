import BigNumber from 'bignumber.js';
import { groupBy, map, mapValues, orderBy, pickBy } from 'lodash';
import { weakMapMemoize } from 'reselect';

import {
  IndexerPerpetualPositionResponseObject,
  IndexerPerpetualPositionStatus,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';
import { IndexerWsBaseMarketObject } from '@/types/indexer/indexerManual';

import {
  getAssetFromMarketId,
  getDisplayableAssetFromBaseAsset,
  getDisplayableTickerFromMarket,
} from '@/lib/assetUtils';
import { calc } from '@/lib/do';
import { isTruthy } from '@/lib/isTruthy';
import { BIG_NUMBERS, MaybeBigNumber, MustBigNumber, ToBigNumber } from '@/lib/numbers';
import { isPresent } from '@/lib/typeUtils';

import { isParentSubaccount } from '../lib/subaccountUtils';
import { ChildSubaccountData, MarketsData, ParentSubaccountDataBase } from '../types/rawTypes';
import {
  ChildSubaccountSummaries,
  GroupedSubaccountSummary,
  PendingIsolatedPosition,
  SubaccountOrder,
  SubaccountPosition,
  SubaccountPositionBase,
  SubaccountPositionDerivedCore,
  SubaccountPositionDerivedExtra,
  SubaccountSummary,
  SubaccountSummaryCore,
  SubaccountSummaryDerived,
} from '../types/summaryTypes';
import { getPositionUniqueId } from './helpers';
import { getMarketEffectiveInitialMarginForMarket } from './markets';

export function calculateParentSubaccountPositions(
  parent: ParentSubaccountDataBase,
  markets: MarketsData
): SubaccountPosition[] {
  return Object.values(parent.childSubaccounts)
    .filter(isPresent)
    .flatMap((child) => {
      const subaccount = calculateSubaccountSummary(child, markets);
      return orderBy(
        Object.values(child.openPerpetualPositions)
          .filter(isPresent)
          .filter((p) => p.status === IndexerPerpetualPositionStatus.OPEN)
          .map((perp) => calculateSubaccountPosition(subaccount, perp, markets[perp.market])),
        [(f) => f.createdAt],
        ['desc']
      );
    });
}

export function calculateParentSubaccountSummary(
  parent: ParentSubaccountDataBase,
  markets: MarketsData
): GroupedSubaccountSummary {
  const summaries = mapValues(parent.childSubaccounts, (subaccount) =>
    subaccount != null ? calculateSubaccountSummary(subaccount, markets) : subaccount
  );
  const parentSummary = summaries[parent.parentSubaccount];
  if (parentSummary == null) {
    throw new Error('Parent subaccount not found in ParentSubaccountData');
  }
  return {
    marginUsage: parentSummary.marginUsage,
    leverage: parentSummary.leverage,
    freeCollateral: parentSummary.freeCollateral,
    rawFreeCollateral: parentSummary.rawFreeCollateral,
    parentSubaccountEquity: parentSummary.equity,
    equity: Object.values(summaries)
      .filter(isPresent)
      .map((s) => s.equity)
      .reduce((a, b) => a.plus(b), BIG_NUMBERS.ZERO),
  };
}

export function calculateMarketsNeededForSubaccount(parent: ParentSubaccountDataBase) {
  return Object.values(parent.childSubaccounts).flatMap((o) =>
    Object.values(o?.openPerpetualPositions ?? {}).map((p) => p.market)
  );
}

export const calculateSubaccountSummary = weakMapMemoize(
  (subaccountData: ChildSubaccountData, markets: MarketsData): SubaccountSummary => {
    const core = calculateSubaccountSummaryCore(subaccountData, markets);
    return {
      ...core,
      ...calculateSubaccountSummaryDerived(core),
      subaccountNumber: subaccountData.subaccountNumber,
    };
  }
);

function calculateSubaccountSummaryCore(
  subaccountData: ChildSubaccountData,
  markets: MarketsData
): SubaccountSummaryCore {
  const quoteBalance = calc(() => {
    const usdcPosition = subaccountData.assetPositions.USDC;
    if (!usdcPosition?.size) return BIG_NUMBERS.ZERO;

    const size = MustBigNumber(usdcPosition.size);
    return usdcPosition.side === IndexerPositionSide.LONG ? size : size.negated();
  });

  // Calculate totals from perpetual positions
  const { valueTotal, notionalTotal, initialRiskTotal, maintenanceRiskTotal } = Object.values(
    subaccountData.openPerpetualPositions
  ).reduce(
    (acc, position) => {
      const market = markets[position.market];
      if (market == null) {
        return acc;
      }
      const {
        value: positionValue,
        notional: positionNotional,
        initialRisk: positionInitialRisk,
        maintenanceRisk: positionMaintenanceRisk,
      } = calculateDerivedPositionCore(getBnPosition(position), market);
      return {
        valueTotal: acc.valueTotal.plus(positionValue),
        notionalTotal: acc.notionalTotal.plus(positionNotional),
        initialRiskTotal: acc.initialRiskTotal.plus(positionInitialRisk),
        maintenanceRiskTotal: acc.maintenanceRiskTotal.plus(positionMaintenanceRisk),
      };
    },
    {
      valueTotal: BIG_NUMBERS.ZERO,
      notionalTotal: BIG_NUMBERS.ZERO,
      initialRiskTotal: BIG_NUMBERS.ZERO,
      maintenanceRiskTotal: BIG_NUMBERS.ZERO,
    }
  );

  return {
    quoteBalance,
    valueTotal,
    notionalTotal,
    initialRiskTotal,
    maintenanceRiskTotal,
  };
}

function calculateSubaccountSummaryDerived(core: SubaccountSummaryCore): SubaccountSummaryDerived {
  const { initialRiskTotal, notionalTotal, quoteBalance, valueTotal } = core;
  const equity = BigNumber.max(valueTotal.plus(quoteBalance), BIG_NUMBERS.ZERO);

  const rawFreeCollateral = equity.minus(initialRiskTotal);
  const freeCollateral = BigNumber.max(rawFreeCollateral, BIG_NUMBERS.ZERO);

  let leverage = null;
  let marginUsage = null;

  if (equity.gt(0)) {
    leverage = notionalTotal.div(equity);
    marginUsage = BIG_NUMBERS.ONE.minus(freeCollateral.div(equity));
  }

  return {
    freeCollateral,
    rawFreeCollateral,
    equity,
    leverage,
    marginUsage,
  };
}

function calculateSubaccountPosition(
  subaccountSummary: SubaccountSummary,
  position: IndexerPerpetualPositionResponseObject,
  market: IndexerWsBaseMarketObject | undefined
): SubaccountPosition {
  const bnPosition = getBnPosition(position);
  const core = calculateDerivedPositionCore(bnPosition, market);
  return {
    ...bnPosition,
    ...core,
    ...calculatePositionDerivedExtra(core, subaccountSummary),
  };
}

function getBnPosition(position: IndexerPerpetualPositionResponseObject): SubaccountPositionBase {
  return {
    ...position,
    size: ToBigNumber(position.size),
    maxSize: ToBigNumber(position.maxSize),
    entryPrice: ToBigNumber(position.entryPrice),
    realizedPnl: ToBigNumber(position.realizedPnl),
    createdAtHeight: ToBigNumber(position.createdAtHeight),
    sumOpen: ToBigNumber(position.sumOpen),
    sumClose: ToBigNumber(position.sumClose),
    netFunding: ToBigNumber(position.netFunding),
    unrealizedPnl: ToBigNumber(position.unrealizedPnl),
    exitPrice: position.exitPrice != null ? ToBigNumber(position.exitPrice) : position.exitPrice,
  };
}

function calculateDerivedPositionCore(
  position: SubaccountPositionBase,
  market: IndexerWsBaseMarketObject | undefined
): SubaccountPositionDerivedCore {
  const marginMode = isParentSubaccount(position.subaccountNumber) ? 'CROSS' : 'ISOLATED';
  const effectiveImf =
    market != null
      ? (getMarketEffectiveInitialMarginForMarket(market) ?? BIG_NUMBERS.ZERO)
      : BIG_NUMBERS.ZERO;
  const effectiveMmf = MaybeBigNumber(market?.maintenanceMarginFraction) ?? BIG_NUMBERS.ZERO;

  // indexer position size is already signed I think but we will be extra sure
  const unsignedSize = position.size.abs();
  const oracle = MaybeBigNumber(market?.oraclePrice) ?? BIG_NUMBERS.ZERO;
  const signedSize =
    position.side === IndexerPositionSide.SHORT ? unsignedSize.negated() : unsignedSize;

  const notional = unsignedSize.times(oracle);
  const value = signedSize.times(oracle);

  return {
    uniqueId: getPositionUniqueId(position.market, position.subaccountNumber),
    assetId: getAssetFromMarketId(position.market),
    marginMode,
    unsignedSize,
    signedSize,
    value,
    notional,
    initialRisk: notional.times(effectiveImf),
    maintenanceRisk: notional.times(effectiveMmf),
    adjustedImf: effectiveImf,
    adjustedMmf: effectiveMmf,
    maxLeverage: calc(() => {
      if (effectiveImf.isZero()) {
        return null;
      }
      return BIG_NUMBERS.ONE.div(effectiveImf);
    }),
    baseEntryPrice: position.entryPrice,
    baseNetFunding: position.netFunding,
  };
}

function calculatePositionDerivedExtra(
  position: SubaccountPositionDerivedCore,
  subaccountSummary: SubaccountSummary
): SubaccountPositionDerivedExtra {
  const { equity, maintenanceRiskTotal } = subaccountSummary;
  const { signedSize, notional, value, marginMode, adjustedMmf, maintenanceRisk, initialRisk } =
    position;

  const leverage = equity.gt(0) ? notional.div(equity) : null;

  const marginValueMaintenance = marginMode === 'ISOLATED' ? equity : maintenanceRisk;
  const marginValueInitial = marginMode === 'ISOLATED' ? equity : initialRisk;

  const liquidationPrice = calc(() => {
    const otherPositionsRisk = maintenanceRiskTotal.minus(maintenanceRisk);

    // Calculate denominator based on position size
    const denominator = signedSize.gt(0)
      ? signedSize.minus(signedSize.times(adjustedMmf))
      : signedSize.plus(signedSize.times(adjustedMmf));

    if (denominator.isZero()) {
      return null;
    }

    const liquidationPriceInner = otherPositionsRisk.plus(value).minus(equity).div(denominator);

    // Return null if liquidation price would be negative
    return liquidationPriceInner.lt(0) ? null : liquidationPriceInner;
  });

  const {
    unrealizedPnlInner: updatedUnrealizedPnl,
    unrealizedPnlPercentInner: updatedUnrealizedPnlPercent,
  } = calc(() => {
    const entryValue = signedSize.multipliedBy(MustBigNumber(position.baseEntryPrice));
    const unrealizedPnlInner = value.minus(entryValue);

    const baseEquity = getPositionBaseEquity({ ...position, leverage });

    const unrealizedPnlPercentInner = baseEquity.isZero()
      ? null
      : unrealizedPnlInner.dividedBy(baseEquity);

    return { unrealizedPnlInner, unrealizedPnlPercentInner };
  });

  return {
    leverage,
    marginValueMaintenance,
    marginValueInitial,
    liquidationPrice,
    updatedUnrealizedPnl,
    updatedUnrealizedPnlPercent,
  };
}

export function calculateChildSubaccountSummaries(
  parent: ParentSubaccountDataBase,
  markets: MarketsData
): ChildSubaccountSummaries {
  return pickBy(
    mapValues(
      parent.childSubaccounts,
      (subaccount) => subaccount && calculateSubaccountSummary(subaccount, markets)
    ),
    isTruthy
  );
}

/**
 * @returns a list of pending isolated positions
 * PendingIsolatedPosition is exists if there are any orders that meet the following criteria:
 * - marginMode is ISOLATED
 * - no existing position exists
 * - childSubaccount has equity
 */
export function calculateUnopenedIsolatedPositions(
  childSubaccounts: ChildSubaccountSummaries,
  orders: SubaccountOrder[],
  positions: SubaccountPosition[]
): PendingIsolatedPosition[] {
  const setOfOpenPositionMarkets = new Set(positions.map(({ market }) => market));

  const filteredOrders = orders.filter(
    (o) => !setOfOpenPositionMarkets.has(o.marketId) && o.marginMode === 'ISOLATED'
  );

  const filteredOrdersMap = groupBy(filteredOrders, 'marketId');
  const marketIdToSubaccountNumber = mapValues(
    filteredOrdersMap,
    (filteredOrder) => filteredOrder[0]?.subaccountNumber
  );

  return map(filteredOrdersMap, (orderList, marketId) => {
    const subaccountNumber = marketIdToSubaccountNumber[marketId];
    if (subaccountNumber == null) return undefined;
    const assetId = getAssetFromMarketId(marketId);

    return {
      assetId,
      displayableAsset: getDisplayableAssetFromBaseAsset(assetId),
      marketId,
      displayId: getDisplayableTickerFromMarket(marketId),
      equity: childSubaccounts[subaccountNumber]?.equity ?? BIG_NUMBERS.ZERO,
      orders: orderList,
    };
  }).filter(isTruthy);
}

export function getPositionBaseEquity(
  position: Pick<SubaccountPosition, 'signedSize' | 'baseEntryPrice' | 'leverage'>
) {
  const entryValue = position.signedSize.times(position.baseEntryPrice);

  const scaledLeverage = position.leverage
    ? BigNumber.max(position.leverage.abs(), BIG_NUMBERS.ONE)
    : BIG_NUMBERS.ONE;

  return entryValue.abs().div(scaledLeverage);
}
