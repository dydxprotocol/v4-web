import BigNumber from 'bignumber.js';
import { mapValues, orderBy } from 'lodash';

import { NUM_PARENT_SUBACCOUNTS } from '@/constants/account';
import {
  IndexerAssetPositionResponseObject,
  IndexerPerpetualMarketResponseObject,
  IndexerPerpetualPositionResponseObject,
  IndexerPerpetualPositionStatus,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';

import { getAssetFromMarketId } from '@/lib/assetUtils';
import { calc } from '@/lib/do';
import { BIG_NUMBERS, MaybeBigNumber, MustBigNumber, ToBigNumber } from '@/lib/numbers';
import { isPresent } from '@/lib/typeUtils';

import { SubaccountBatchedOperations, SubaccountOperations } from '../types/operationTypes';
import { ChildSubaccountData, MarketsData, ParentSubaccountData } from '../types/rawTypes';
import {
  GroupedSubaccountSummary,
  SubaccountPosition,
  SubaccountPositionBase,
  SubaccountPositionDerivedCore,
  SubaccountPositionDerivedExtra,
  SubaccountSummary,
  SubaccountSummaryCore,
  SubaccountSummaryDerived,
} from '../types/summaryTypes';
import { getMarketEffectiveInitialMarginForMarket } from './markets';

export function calculateParentSubaccountPositions(
  parent: Omit<ParentSubaccountData, 'live'>,
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
  parent: Omit<ParentSubaccountData, 'live'>,
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
      .reduce((a, b) => a.plus(b), BIG_NUMBERS.ZERO),
  };
}

export function calculateMarketsNeededForSubaccount(parent: Omit<ParentSubaccountData, 'live'>) {
  return Object.values(parent.childSubaccounts).flatMap((o) =>
    Object.values(o?.openPerpetualPositions ?? {}).map((p) => p.market)
  );
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
  const equity = valueTotal.plus(quoteBalance);

  const freeCollateral = equity.minus(initialRiskTotal);

  let leverage = null;
  let marginUsage = null;

  if (equity.gt(0)) {
    leverage = notionalTotal.div(equity);
    marginUsage = BIG_NUMBERS.ONE.minus(freeCollateral.div(equity));
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
    market != null
      ? getMarketEffectiveInitialMarginForMarket(market) ?? BIG_NUMBERS.ZERO
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
    uniqueId: `${position.market}-${position.subaccountNumber}`,
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
  const { signedSize, notional, value, marginMode, adjustedMmf, adjustedImf, maintenanceRisk } =
    position;

  const leverage = equity.gt(0) ? notional.div(equity) : null;

  const marginValueMaintenance = marginMode === 'ISOLATED' ? equity : notional.times(adjustedMmf);
  const marginValueInitial = marginMode === 'ISOLATED' ? equity : notional.times(adjustedImf);

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

    const scaledLeverage = leverage
      ? BigNumber.max(leverage.abs(), BIG_NUMBERS.ONE)
      : BIG_NUMBERS.ONE;

    const unrealizedPnlPercentInner = !entryValue.isZero()
      ? unrealizedPnlInner.dividedBy(entryValue.abs()).multipliedBy(scaledLeverage)
      : null;
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

export function createUsdcDepositOperations({
  subaccountNumber,
  depositAmount,
}: {
  subaccountNumber: number;
  depositAmount: string;
}): SubaccountBatchedOperations {
  return {
    operations: [
      SubaccountOperations.ModifyUsdcAssetPosition({
        subaccountNumber,
        changes: {
          size: depositAmount,
        },
      }),
    ],
  };
}

export function createUsdcWithdrawalOperations({
  subaccountNumber,
  withdrawAmount,
}: {
  subaccountNumber: number;
  withdrawAmount: string;
}): SubaccountBatchedOperations {
  return {
    operations: [
      SubaccountOperations.ModifyUsdcAssetPosition({
        subaccountNumber,
        changes: {
          size: MustBigNumber(withdrawAmount).negated().toString(),
        },
      }),
    ],
  };
}

function modifyUsdcAssetPosition(
  parentSubaccountData: ParentSubaccountData,
  payload: {
    subaccountNumber: number;
    changes: Partial<Pick<IndexerAssetPositionResponseObject, 'size'>>;
  }
): void {
  const { subaccountNumber, changes } = payload;

  if (!changes.size) return;
  const sizeBN = MustBigNumber(changes.size);

  let childSubaccount: ChildSubaccountData | undefined =
    parentSubaccountData.childSubaccounts[subaccountNumber];

  if (childSubaccount != null) {
    // Modify childSubaccount
    if (childSubaccount.assetPositions.USDC != null) {
      const size = MustBigNumber(childSubaccount.assetPositions.USDC.size).plus(sizeBN).toString();
      const assetPositions = {
        ...childSubaccount.assetPositions,
        USDC: {
          ...childSubaccount.assetPositions.USDC,
          size,
        },
      };

      childSubaccount = {
        ...childSubaccount,
        assetPositions,
      };
    } else {
      if (sizeBN.gt(0)) {
        childSubaccount.assetPositions.USDC = {
          assetId: '0',
          symbol: 'USDC',
          size: sizeBN.toString(),
          side: IndexerPositionSide.LONG,
          subaccountNumber,
        };
      }
    }
  } else {
    // Upsert ChildSubaccountData into parentSubaccountData.childSubaccounts
    childSubaccount = {
      address: parentSubaccountData.address,
      subaccountNumber,
      openPerpetualPositions: {},
      assetPositions: {
        USDC: {
          assetId: '0',
          symbol: 'USDC',
          size: sizeBN.toString(),
          side: IndexerPositionSide.LONG,
          subaccountNumber,
        },
      },
    };
  }

  parentSubaccountData.childSubaccounts = {
    ...parentSubaccountData.childSubaccounts,
    [subaccountNumber]: childSubaccount,
  };
}

export function applyOperationsToSubaccount(
  parentSubaccount: ParentSubaccountData,
  batchedOperations: SubaccountBatchedOperations
): ParentSubaccountData {
  const parentSubaccountData: ParentSubaccountData = { ...parentSubaccount };

  batchedOperations.operations.forEach((op) => {
    const { payload, operation } = op;

    switch (operation) {
      case 'AddPerpetualPosition': {
        // TODO: Implement addPerpetualPosition
        break;
      }
      case 'ModifyPerpetualPosition': {
        // TODO: Implement modifyPerpetualPosition
        break;
      }
      case 'ModifyUsdcAssetPosition': {
        modifyUsdcAssetPosition(parentSubaccountData, payload);
        break;
      }
      default:
        throw new Error(`Error processing invalid operation type`);
    }
  });

  return parentSubaccountData;
}
