import {
  IndexerPerpetualMarketResponseObject,
  IndexerPerpetualPositionResponseObject,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';
import BigNumber from 'bignumber.js';

import { calc } from '@/lib/do';
import { MaybeBigNumber, MustBigNumber } from '@/lib/numbers';

import { ChildSubaccountData, MarketsData } from '../rawTypes';
import { SubaccountPositionDerivedCore, SubaccountSummaryCore } from '../summaryTypes';

export function calculateSubaccountSummaryCore(
  subaccountData: ChildSubaccountData,
  markets: MarketsData
): SubaccountSummaryCore {
  const quoteBalance = calc(() => {
    const usdcPosition = subaccountData.assetPositions.USDC;
    if (!usdcPosition?.size) return MustBigNumber(0);

    const size = MustBigNumber(usdcPosition.size);
    return usdcPosition.side === IndexerPositionSide.LONG ? size : size.negated();
  });

  // Calculate totals from perpetual positions
  const { valueTotal, initialRiskTotal } = Object.values(
    subaccountData.openPerpetualPositions
  ).reduce(
    (acc, position) => {
      const market = markets[position.market];
      if (market == null) {
        return acc;
      }
      const { notionalTotal: positionValue, initialRiskTotal: positionRisk } =
        getDerivedPositionInfo(position, market);
      return {
        valueTotal: acc.valueTotal.plus(positionValue),
        initialRiskTotal: acc.initialRiskTotal.plus(positionRisk),
      };
    },
    {
      valueTotal: MustBigNumber(0),
      initialRiskTotal: MustBigNumber(0),
    }
  );

  return {
    quoteBalance,
    valueTotal,
    initialRiskTotal,
  };
}

const NUM_PARENT_SUBACCOUNTS = 128;

function getDerivedPositionInfo(
  position: IndexerPerpetualPositionResponseObject,
  market: IndexerPerpetualMarketResponseObject
): SubaccountPositionDerivedCore {
  const marginMode = position.subaccountNumber < NUM_PARENT_SUBACCOUNTS ? 'CROSS' : 'ISOLATED';
  const effectiveImf = getMarketEffectiveInitialMargin(market) ?? MustBigNumber(0);

  const size = MustBigNumber(position.size);
  const oracle = MustBigNumber(market.oraclePrice);
  const signedSize = position.side === IndexerPositionSide.SHORT ? size.negated() : size;
  const notional = size.times(oracle);
  const value = signedSize.times(oracle);

  return {
    marginMode,
    valueTotal: value,
    notionalTotal: notional,
    initialRiskTotal: notional.times(effectiveImf),
    adjustedImf: effectiveImf,
    adjustedMmf: MaybeBigNumber(market.maintenanceMarginFraction) ?? MustBigNumber(0),
  };
}

function getMarketEffectiveInitialMargin(config: IndexerPerpetualMarketResponseObject) {
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
  if (openInterestUpperCap === openInterestLowerCap) {
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
