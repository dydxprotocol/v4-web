import {
  IndexerPerpetualPositionStatus,
  IndexerPositionSide,
  type IndexerAssetPositionResponseObject,
  type IndexerPerpetualMarketResponseObject,
  type IndexerPerpetualPositionResponseObject,
} from '@/types/indexer/indexerApiGen';

import { DEFAULT_INITIAL_MARGIN_FRACTION } from '@/constants/trade';

import { isTruthy } from '../isTruthy';
import { BIG_NUMBERS, BigNumberish, MustBigNumber } from '../numbers';
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
  openPerpetualPositionsValueTotal: string;
  openPerpetualPositionsNotionalTotal: string;
  openPerpetualPositionsInitialRiskTotal: string;
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
    openPerpetualPositionsValueTotal: valueTotalBN.toString(),
    openPerpetualPositionsNotionalTotal: notionalTotalBN.toString(),
    openPerpetualPositionsInitialRiskTotal: initialRiskTotalBN.toString(),
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

/**
 *
 * @param openPerpetualPositionsValueTotal cumulative value of all open perpetual positions
 * @param quoteBalance subaccount's quote balance
 * @returns subaccount equity
 */
export const calculateSubaccountEquity = ({
  openPerpetualPositionsValueTotal,
  quoteBalance,
}: {
  openPerpetualPositionsValueTotal?: BigNumberish;
  quoteBalance?: BigNumberish;
}): string | undefined => {
  if (openPerpetualPositionsValueTotal && quoteBalance) {
    return MustBigNumber(openPerpetualPositionsValueTotal).plus(quoteBalance).toString();
  }

  return undefined;
};

/**
 *
 * @param equity subaccount equity
 * @param openPerpetualPositionsInitialRiskTotal cumulative initial risk of all open perpetual positions
 * @returns subaccount free collateral
 */
export const calculateSubaccountFreeCollateral = ({
  equity,
  openPerpetualPositionsInitialRiskTotal,
}: {
  equity?: BigNumberish;
  openPerpetualPositionsInitialRiskTotal?: BigNumberish;
}): string | undefined => {
  if (openPerpetualPositionsInitialRiskTotal && equity) {
    return MustBigNumber(equity).minus(openPerpetualPositionsInitialRiskTotal).toString();
  }

  return undefined;
};

/**
 *
 * @param equity subaccount equity
 * @param openPerpetualPositionsNotionalTotal cumulative notional value of all open perpetual positions
 * @returns subaccount leverage
 */
export const calculateSubaccountLeverage = ({
  equity,
  openPerpetualPositionsNotionalTotal,
}: {
  equity?: BigNumberish;
  openPerpetualPositionsNotionalTotal?: BigNumberish;
}): string | undefined => {
  if (equity && openPerpetualPositionsNotionalTotal) {
    return MustBigNumber(openPerpetualPositionsNotionalTotal).div(equity).toString();
  }

  return undefined;
};

/**
 *
 * @param equity subaccount equity
 * @param freeCollateral subaccount free collateral
 * @returns subaccount margin usage
 */
export const calculateSubaccountMarginUsage = ({
  equity,
  freeCollateral,
}: {
  equity?: BigNumberish;
  freeCollateral?: BigNumberish;
}): string | undefined => {
  if (equity && freeCollateral) {
    const freeCollateralBN = MustBigNumber(freeCollateral);
    return BIG_NUMBERS.ONE.minus(freeCollateralBN.div(equity)).toString();
  }

  return undefined;
};

/**
 *
 * @description Calculate Subaccount or Position Buying Power
 * @param equity subaccount equity
 * @param openPerpetualPositionsInitialRiskTotal cumulative initial risk of all open perpetual positions
 * @param initialMarginFraction initial margin fraction of the perpetual market
 * @returns buying power
 */
export const calculateBuyingPower = ({
  equity,
  openPerpetualPositionsInitialRiskTotal,
  initialMarginFraction,
}: {
  equity?: BigNumberish;
  openPerpetualPositionsInitialRiskTotal?: BigNumberish;
  initialMarginFraction?: number;
}): string | undefined => {
  const buyingPowerFreeCollateralBN = MustBigNumber(equity).minus(
    openPerpetualPositionsInitialRiskTotal ?? 0
  );

  const divisor =
    initialMarginFraction && initialMarginFraction > 0
      ? initialMarginFraction
      : DEFAULT_INITIAL_MARGIN_FRACTION;

  return buyingPowerFreeCollateralBN.div(divisor).toString();
};

/**
 *
 * @param equity subaccount equity
 * @param notionalValue position notional value
 * @returns leverage for a position
 */
export const calculatePositionLeverage = ({
  equity,
  notionalValue,
}: {
  equity?: BigNumberish;
  notionalValue?: BigNumberish;
}): string | undefined => {
  if (isTruthy(equity) && notionalValue) {
    return MustBigNumber(notionalValue).div(equity).toString();
  }

  return undefined;
};
