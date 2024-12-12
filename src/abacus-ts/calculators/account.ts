import {
  IndexerPerpetualMarketResponseObject,
  IndexerPerpetualPositionResponseObject,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';
import BigNumber from 'bignumber.js';

import { calc } from '@/lib/do';
import { MaybeBigNumber, MustBigNumber } from '@/lib/numbers';

import { ChildSubaccountData, MarketsData } from '../rawTypes';
import {
  SubaccountPositionDerivedCore,
  SubaccountPositionDerivedExtra,
  SubaccountSummary,
  SubaccountSummaryCore,
  SubaccountSummaryDerived,
} from '../summaryTypes';

const NUM_PARENT_SUBACCOUNTS = 128;
const BN_0 = MustBigNumber(0);
const BN_1 = MustBigNumber(1);

export function calculateSubaccountSummaryCore(
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
      } = calculateDerivedPositionCore(position, market);
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

function calculateDerivedPositionCore(
  position: IndexerPerpetualPositionResponseObject,
  market: IndexerPerpetualMarketResponseObject
): SubaccountPositionDerivedCore {
  const marginMode = position.subaccountNumber < NUM_PARENT_SUBACCOUNTS ? 'CROSS' : 'ISOLATED';
  const effectiveImf = getMarketEffectiveInitialMarginForMarket(market) ?? BN_0;
  const effectiveMmf = MaybeBigNumber(market.maintenanceMarginFraction) ?? BN_0;

  // indexer position size is already signed I think but we will be extra sure
  const unsignedSize = MustBigNumber(position.size).abs();
  const oracle = MustBigNumber(market.oraclePrice);
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
  };
}

export function calculatePositionDerivedExtra(
  basePosition: IndexerPerpetualPositionResponseObject,
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
    const entryValue = signedSize.multipliedBy(MustBigNumber(basePosition.entryPrice));
    const unrealizedPnlInner = value.minus(entryValue).plus(MustBigNumber(basePosition.netFunding));

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
