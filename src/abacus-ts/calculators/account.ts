import {
  IndexerPerpetualMarketResponseObject,
  IndexerPerpetualPositionResponseObject,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';
import BigNumber from 'bignumber.js';
import { mapValues } from 'lodash';

import { NUM_PARENT_SUBACCOUNTS } from '@/constants/account';

import { calc } from '@/lib/do';
import { MaybeBigNumber, MustBigNumber, ToBigNumber } from '@/lib/numbers';
import { isPresent } from '@/lib/typeUtils';

import { ChildSubaccountData, MarketsData, ParentSubaccountData } from '../rawTypes';
import {
  GroupedSubaccountSummary,
  SubaccountPosition,
  SubaccountPositionBase,
  SubaccountPositionDerivedCore,
  SubaccountPositionDerivedExtra,
  SubaccountSummary,
  SubaccountSummaryCore,
  SubaccountSummaryDerived,
} from '../summaryTypes';

const BN_0 = MustBigNumber(0);
const BN_1 = MustBigNumber(1);

export function calculateParentSubaccountPositions(
  parent: Omit<ParentSubaccountData, 'ephemeral'>,
  markets: MarketsData
): SubaccountPosition[] {
  return Object.values(parent.childSubaccounts)
    .filter(isPresent)
    .flatMap((child) => {
      const subaccount = calculateSubaccountSummary(child, markets);
      return Object.values(child.openPerpetualPositions)
        .filter(isPresent)
        .map((perp) => calculateSubaccountPosition(subaccount, perp, markets[perp.market]));
    });
}

export function calculateParentSubaccountSummary(
  parent: Omit<ParentSubaccountData, 'ephemeral'>,
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
    equity: Object.values(summaries)
      .filter(isPresent)
      .map((s) => s.equity)
      .reduce((a, b) => a.plus(b), BN_0),
  };
}

function calculateSubaccountSummary(
  subaccountData: ChildSubaccountData,
  markets: MarketsData
): SubaccountSummary {
  const core = calculateSubaccountSummaryCore(subaccountData, markets);
  return {
    ...core,
    ...calculateSubaccountSummaryDerived(core),
  };
}

function calculateSubaccountSummaryCore(
  subaccountData: ChildSubaccountData,
  markets: MarketsData
): SubaccountSummaryCore {
  const quoteBalance = calc(() => {
    const usdcPosition = subaccountData.assetPositions.USDC;
    if (!usdcPosition?.size) return BN_0;

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
      valueTotal: BN_0,
      notionalTotal: BN_0,
      initialRiskTotal: BN_0,
      maintenanceRiskTotal: BN_0,
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
  const equity = valueTotal.plus(quoteBalance);

  const freeCollateral = equity.minus(initialRiskTotal);

  let leverage = null;
  let marginUsage = null;

  if (equity.gt(0)) {
    leverage = notionalTotal.div(equity);
    marginUsage = BN_1.minus(freeCollateral.div(equity));
  }

  return {
    freeCollateral,
    equity,
    leverage,
    marginUsage,
  };
}

function calculateSubaccountPosition(
  subaccountSummary: SubaccountSummary,
  position: IndexerPerpetualPositionResponseObject,
  market: IndexerPerpetualMarketResponseObject | undefined
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
  market: IndexerPerpetualMarketResponseObject | undefined
): SubaccountPositionDerivedCore {
  const marginMode = position.subaccountNumber < NUM_PARENT_SUBACCOUNTS ? 'CROSS' : 'ISOLATED';
  const effectiveImf =
    market != null ? getMarketEffectiveInitialMarginForMarket(market) ?? BN_0 : BN_0;
  const effectiveMmf = MaybeBigNumber(market?.maintenanceMarginFraction) ?? BN_0;

  // indexer position size is already signed I think but we will be extra sure
  const unsignedSize = position.size.abs();
  const oracle = MaybeBigNumber(market?.oraclePrice) ?? BN_0;
  const signedSize =
    position.side === IndexerPositionSide.SHORT ? unsignedSize.negated() : unsignedSize;

  const notional = unsignedSize.times(oracle);
  const value = signedSize.times(oracle);

  return {
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
      return BN_1.div(effectiveImf);
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
  const { signedSize, notional, value, marginMode, adjustedMmf, maintenanceRisk } = position;

  const leverage = equity.gt(0) ? notional.div(equity) : null;

  const marginValue = marginMode === 'ISOLATED' ? equity : notional.times(adjustedMmf);

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
    const unrealizedPnlInner = value.minus(entryValue).plus(MustBigNumber(position.baseNetFunding));

    const scaledLeverage = leverage ? BigNumber.max(leverage.abs(), BN_1) : BN_1;

    const unrealizedPnlPercentInner = !entryValue.isZero()
      ? unrealizedPnlInner.dividedBy(entryValue.abs()).multipliedBy(scaledLeverage)
      : null;
    return { unrealizedPnlInner, unrealizedPnlPercentInner };
  });

  return {
    leverage,
    marginValue,
    liquidationPrice,
    updatedUnrealizedPnl,
    updatedUnrealizedPnlPercent,
  };
}

function getMarketEffectiveInitialMarginForMarket(config: IndexerPerpetualMarketResponseObject) {
  const initialMarginFraction = MaybeBigNumber(config.initialMarginFraction);
  const openInterest = MaybeBigNumber(config.openInterest);
  const openInterestLowerCap = MaybeBigNumber(config.openInterestLowerCap);
  const openInterestUpperCap = MaybeBigNumber(config.openInterestUpperCap);
  const oraclePrice = MaybeBigNumber(config.oraclePrice);

  if (initialMarginFraction == null) return null;
  if (
    oraclePrice == null ||
    openInterest == null ||
    openInterestLowerCap == null ||
    openInterestUpperCap == null
  ) {
    return initialMarginFraction;
  }

  // if these are equal we can throw an error from dividing by zero
  if (openInterestUpperCap.eq(openInterestLowerCap)) {
    return initialMarginFraction;
  }

  const openNotional = openInterest.times(oraclePrice);
  const scalingFactor = openNotional
    .minus(openInterestLowerCap)
    .div(openInterestUpperCap.minus(openInterestLowerCap));
  const imfIncrease = scalingFactor.times(MustBigNumber(1).minus(initialMarginFraction));

  const effectiveIMF = BigNumber.minimum(
    initialMarginFraction.plus(BigNumber.maximum(imfIncrease, 0.0)),
    1.0
  );
  return effectiveIMF;
}
