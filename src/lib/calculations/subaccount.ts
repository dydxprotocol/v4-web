import {
  IndexerPerpetualPositionStatus,
  IndexerPositionSide,
  type IndexerAssetPositionResponseObject,
  type IndexerPerpetualMarketResponseObject,
  type IndexerPerpetualPositionResponseObject,
} from '@/types/indexer/indexerApiGen';

import { BIG_NUMBERS, MustBigNumber } from '../numbers';
import { orEmptyObj } from '../typeUtils';

/**
 *
 * @param openPerpetualPositions subaccount's open perpetual positions
 * @param perpetualMarkets market data used as reference for calculating position details
 * @returns record of derived position details for each of the subaccount's open perpetual positions
 */
export const calculateSubaccountPositionDetails = ({
  openPerpetualPositions = {},
  perpetualMarkets = {},
}: {
  openPerpetualPositions?: { [market: string]: IndexerPerpetualPositionResponseObject };
  perpetualMarkets?: { [market: string]: IndexerPerpetualMarketResponseObject };
}): Record<
  string,
  {
    realizedPnlPercent?: string;
    unrealizedPnlPercent?: string;
    valueTotal?: string;
    notionalTotal?: string;
    initialRiskTotal?: string;
    maxLeverage?: string;
  }
> => {
  const positionDetailsByMarket: Array<
    [
      string,
      {
        realizedPnlPercent?: string;
        unrealizedPnlPercent?: string;
        valueTotal?: string;
        notionalTotal?: string;
        initialRiskTotal?: string;
        maxLeverage?: string;
      },
    ]
  > = Object.entries(openPerpetualPositions).map(([market, position]) => {
    const { entryPrice, realizedPnl, size, status } = position;

    let realizedPnlPercentBN;
    let unrealizedPnlPercentBN;
    let valueTotalBN;
    let notionalTotalBN;
    let initialRiskTotalBN;
    let maxLeverageBN;

    if (size && status === IndexerPerpetualPositionStatus.OPEN) {
      if (entryPrice) {
        const positionEntryValueBN = MustBigNumber(entryPrice).times(size).abs();

        if (positionEntryValueBN.gt(0) && realizedPnl) {
          realizedPnlPercentBN = MustBigNumber(realizedPnl).div(positionEntryValueBN);
        }

        const { oraclePrice, initialMarginFraction } = orEmptyObj(perpetualMarkets[market]);

        if (oraclePrice) {
          valueTotalBN = MustBigNumber(oraclePrice).times(size);
          notionalTotalBN = valueTotalBN.abs();

          const entryValueBN = MustBigNumber(entryPrice).times(size);
          const unrealizedPnlBN = valueTotalBN.minus(entryValueBN);

          if (!entryValueBN.isZero()) {
            unrealizedPnlPercentBN = unrealizedPnlBN.div(entryValueBN);
          }

          if (initialMarginFraction) {
            maxLeverageBN = MustBigNumber(1).div(initialMarginFraction);
            initialRiskTotalBN = MustBigNumber(initialMarginFraction).times(notionalTotalBN);
          }
        }
      }
    }

    return [
      market,
      {
        realizedPnlPercent: realizedPnlPercentBN?.toString(),
        unrealizedPnlPercent: unrealizedPnlPercentBN?.toString(),
        valueTotal: valueTotalBN?.toString(),
        notionalTotal: notionalTotalBN?.toString(),
        initialRiskTotal: initialRiskTotalBN?.toString(),
        maxLeverage: maxLeverageBN?.toString(),
      },
    ];
  });

  return Object.fromEntries(positionDetailsByMarket);
};

/**
 *
 * @param openPerpetualPositions subaccount's open perpetual positions
 * @param perpetualMarkets market data used as reference for calculating position details
 * @returns cumulative position details for all of the subaccount's open perpetual positions
 */
export const calculateCumulativeSubaccountPositionDetails = ({
  openPerpetualPositions = {},
  perpetualMarkets = {},
}: {
  openPerpetualPositions?: { [market: string]: IndexerPerpetualPositionResponseObject };
  perpetualMarkets?: { [market: string]: IndexerPerpetualMarketResponseObject };
}): {
  valueTotal: string;
  notionalTotal: string;
  initialRiskTotal: string;
} => {
  const subaccountPositionDetails = calculateSubaccountPositionDetails({
    openPerpetualPositions,
    perpetualMarkets,
  });

  let valueTotalBN = BIG_NUMBERS.ZERO;
  let notionalTotalBN = BIG_NUMBERS.ZERO;
  let initialRiskTotalBN = BIG_NUMBERS.ZERO;

  Object.values(subaccountPositionDetails).forEach((position) => {
    if (position.valueTotal) {
      valueTotalBN = valueTotalBN.plus(position.valueTotal);
    }

    if (position.notionalTotal) {
      notionalTotalBN = notionalTotalBN.plus(position.notionalTotal);
    }

    if (position.initialRiskTotal) {
      initialRiskTotalBN = initialRiskTotalBN.plus(position.initialRiskTotal);
    }
  });

  return {
    valueTotal: valueTotalBN.toString(),
    notionalTotal: notionalTotalBN.toString(),
    initialRiskTotal: initialRiskTotalBN.toString(),
  };
};

/**
 *
 * @param assetPositions subaccount's asset positions
 * @returns subaccount's quote balance derived from USDC asset position
 */
export const calculateSubaccountQuoteBalance = ({
  assetPositions,
}: {
  assetPositions?: { [symbol: string]: IndexerAssetPositionResponseObject };
}): string | undefined => {
  if (assetPositions) {
    if (assetPositions.USDC) {
      const { size, side } = assetPositions.USDC;
      return MustBigNumber(size)
        .times(side === IndexerPositionSide.LONG ? 1 : -1)
        .toString();
    }
  }

  return undefined;
};
