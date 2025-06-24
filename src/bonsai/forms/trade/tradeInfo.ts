import { CanvasOrderbookLine } from '@/bonsai/types/orderbookTypes';
import { ParentSubaccountDataBase } from '@/bonsai/types/rawTypes';
import {
  FeeTierSummary,
  PerpetualMarketSummary,
  RewardParamsSummary,
  SubaccountOrder,
  SubaccountPosition,
} from '@/bonsai/types/summaryTypes';
import BigNumber from 'bignumber.js';

import { MAX_SUBACCOUNT_NUMBER, NUM_PARENT_SUBACCOUNTS } from '@/constants/account';
import { MAJOR_MARKETS } from '@/constants/markets';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { assertNever } from '@/lib/assertNever';
import { calc, mapIfPresent } from '@/lib/do';
import {
  AttemptBigNumber,
  AttemptNumber,
  BIG_NUMBERS,
  clampBn,
  MustBigNumber,
  MustNumber,
  toStepSize,
} from '@/lib/numbers';

import {
  ExecutionType,
  MarginMode,
  OrderSide,
  OrderSizeInput,
  OrderSizeInputs,
  TimeInForce,
  TradeAccountDetails,
  TradeForm,
  TradeFormInputData,
  TradeFormType,
  TradeInputSummary,
  TradeSummary,
} from './types';

const MARKET_ORDER_MAX_SLIPPAGE = 0.05;
const STOP_MARKET_ORDER_SLIPPAGE_BUFFER_MAJOR_MARKET = 0.05;
const STOP_MARKET_ORDER_SLIPPAGE_BUFFER = 0.1;
const MAX_TARGET_LEVERAGE_BUFFER_PERCENT = 0.98;
const MAX_LEVERAGE_BUFFER_PERCENT = 0.98;
const DEFAULT_TARGET_LEVERAGE = 2.0;

export function calculateTradeInfo(
  trade: TradeForm,
  baseAccount: TradeAccountDetails | undefined,
  accountData: TradeFormInputData
): TradeSummary {
  const subaccountToUse = calculateSubaccountToUseForTrade(
    trade.marginMode,
    baseAccount?.position?.subaccountNumber,
    accountData.currentTradeMarketOpenOrders[0]?.subaccountNumber,
    accountData.allOpenOrders,
    accountData.rawParentSubaccountData
  );
  const leverageLimits = getSignedLeverageLimits(
    baseAccount?.position,
    accountData.currentTradeMarketSummary?.effectiveInitialMarginFraction ?? undefined,
    trade.side,
    trade.reduceOnly ?? false
  );

  return calc((): TradeSummary => {
    switch (trade.type) {
      case TradeFormType.MARKET:
        return calc((): TradeSummary => {
          const calculated = calculateMarketOrder(trade, baseAccount, accountData, subaccountToUse);
          const orderbookBase = accountData.currentTradeMarketOrderbook;
          const calculatedMaxLeverage = getMaxCrossMarketOrderSizeSummary(
            trade,
            baseAccount,
            accountData,
            subaccountToUse
          )?.leverageSigned;

          return {
            inputSummary: calculated.summary ?? {
              size: undefined,
              averageFillPrice: undefined,
              worstFillPrice: undefined,
            },
            subaccountNumber: subaccountToUse,
            payloadPrice: mapIfPresent(calculated.marketOrder?.averagePrice, (price) => {
              if (trade.side == null || trade.side === OrderSide.BUY) {
                return price * (1 + MARKET_ORDER_MAX_SLIPPAGE);
              }
              return price * (1 - MARKET_ORDER_MAX_SLIPPAGE);
            }),
            minimumSignedLeverage: leverageLimits.minLeverage.toNumber(),
            maximumSignedLeverage: getSignedLeverageLimitsForMarketOrder(
              leverageLimits,
              calculatedMaxLeverage
            ).toNumber(),
            slippage: calculateMarketOrderSlippage(
              calculated.marketOrder?.worstPrice,
              orderbookBase?.midPrice
            ),
            fee: calculated.marketOrder?.totalFees,
            total: calculateOrderTotal(
              calculated.marketOrder?.usdcSize,
              calculated.marketOrder?.totalFees,
              trade.side
            ),
            filled: calculated.marketOrder?.filled ?? false,
            isPositionClosed:
              mapIfPresent(
                calculated.marketOrder?.size,
                baseAccount?.position?.unsignedSize.toNumber(),
                baseAccount?.position?.side,
                trade.side,
                AttemptNumber(accountData.currentTradeMarketSummary?.stepSize),
                (filled, size, positionSide, orderSide, stepSize) =>
                  ((positionSide === IndexerPositionSide.LONG && orderSide === OrderSide.SELL) ||
                    (positionSide === IndexerPositionSide.SHORT && orderSide === OrderSide.BUY)) &&
                  Math.abs(filled - size) < stepSize / 2
              ) ?? false,
            indexSlippage: mapIfPresent(
              calculated.marketOrder?.worstPrice,
              AttemptNumber(accountData.currentTradeMarketSummary?.oraclePrice),
              trade.side,
              (worstPrice, oraclePrice, side) => {
                return (
                  (side === OrderSide.BUY ? worstPrice - oraclePrice : oraclePrice - worstPrice) /
                  oraclePrice
                );
              }
            ),
            feeRate: accountData.userFeeStats.takerFeeRate ?? 0,
            transferToSubaccountAmount: calculateIsolatedTransferAmount(
              trade,
              calculated.summary?.size?.size ?? 0,
              calculated.summary?.averageFillPrice ?? 0,
              subaccountToUse,
              accountData.rawParentSubaccountData?.parentSubaccount,
              baseAccount?.position,
              accountData.currentTradeMarketSummary
            ),
            reward: calculateTakerReward(
              calculated.marketOrder?.usdcSize,
              calculated.marketOrder?.totalFees,
              accountData.rewardParams,
              accountData.feeTiers
            ),
          };
        });
      case TradeFormType.TRIGGER_MARKET:
        return calc((): TradeSummary => {
          const calculated = calculateMarketOrder(trade, baseAccount, accountData, subaccountToUse);
          const orderbookBase = accountData.currentTradeMarketOrderbook;

          const slippageFromMidPrice = calculateMarketOrderSlippage(
            calculated.marketOrder?.worstPrice,
            orderbookBase?.midPrice
          );
          const slippageFromMarket = calculateMarketOrderSlippage(
            calculated.marketOrder?.averagePrice,
            orderbookBase?.midPrice
          );
          const adjustedSlippagePercentage = mapIfPresent(
            trade.marketId,
            slippageFromMarket,
            (marketId, slippage) => {
              const isMajorMarket = MAJOR_MARKETS.has(marketId);
              const additionalBuffer = calc(() => {
                if (isMajorMarket) {
                  return STOP_MARKET_ORDER_SLIPPAGE_BUFFER_MAJOR_MARKET;
                }
                return STOP_MARKET_ORDER_SLIPPAGE_BUFFER;
              });

              return slippage + additionalBuffer;
            }
          );
          const price = mapIfPresent(
            AttemptNumber(trade.triggerPrice),
            slippageFromMidPrice,
            (trigger, slippage) => {
              return trade.side === OrderSide.BUY
                ? trigger * (1 + slippage)
                : trigger * (1 - slippage);
            }
          );
          const payloadPrice = mapIfPresent(
            AttemptNumber(trade.triggerPrice),
            adjustedSlippagePercentage,
            (trigger, adjustedSlippage) => {
              return trade.side === OrderSide.BUY
                ? trigger * (1 + adjustedSlippage)
                : trigger * (1 - adjustedSlippage);
            }
          );

          const size = calculated.marketOrder?.size;
          const usdcSize = mapIfPresent(price, size, (p, s) => p * s);
          const feeRate = accountData.userFeeStats.takerFeeRate ?? 0;
          const totalFees = mapIfPresent(usdcSize, (u) => u * feeRate);

          const isPositionClosed =
            mapIfPresent(
              size,
              baseAccount?.position?.unsignedSize.toNumber(),
              AttemptNumber(accountData.currentTradeMarketSummary?.stepSize),
              (orderSize, positionSize, stepSize) =>
                Math.abs(orderSize - positionSize) < stepSize / 2
            ) ?? false;

          const inputSummary = {
            size: {
              size,
              usdcSize,
              // not supported
              leverageSigned: undefined,
              // not supported
              balancePercent: undefined,
            },
            averageFillPrice: price,
            worstFillPrice: price,
          };

          const total = calculateOrderTotal(usdcSize, totalFees, trade.side);

          return {
            indexSlippage: 0,
            minimumSignedLeverage: leverageLimits.minLeverage.toNumber(),
            maximumSignedLeverage: leverageLimits.maxLeverage.toNumber(),
            subaccountNumber: subaccountToUse,
            feeRate,
            filled: calculated.marketOrder?.filled ?? false,
            inputSummary,
            fee: totalFees,
            isPositionClosed,
            slippage: slippageFromMidPrice,
            total,
            transferToSubaccountAmount: calculateIsolatedTransferAmount(
              trade,
              inputSummary.size.size ?? 0,
              price ?? 0,
              subaccountToUse,
              accountData.rawParentSubaccountData?.parentSubaccount,
              baseAccount?.position,
              accountData.currentTradeMarketSummary
            ),
            payloadPrice,
            reward: calculateTakerReward(
              usdcSize,
              totalFees,
              accountData.rewardParams,
              accountData.feeTiers
            ),
          };
        });
      case TradeFormType.LIMIT:
      case TradeFormType.TRIGGER_LIMIT:
        return calc((): TradeSummary => {
          const timeInForce = trade.timeInForce;
          const execution = trade.execution;
          const isMaker =
            (trade.type === TradeFormType.LIMIT && timeInForce === TimeInForce.GTT) ||
            execution === ExecutionType.POST_ONLY;

          const feeRate = isMaker
            ? accountData.userFeeStats.makerFeeRate
            : accountData.userFeeStats.takerFeeRate;
          const price = AttemptNumber(trade.limitPrice);
          const inputSummary = calculateLimitOrderInputSummary(
            trade.size,
            trade.limitPrice,
            trade.reduceOnly,
            AttemptNumber(accountData.currentTradeMarketSummary?.stepSize),
            baseAccount
          );

          const totalFees = mapIfPresent(
            feeRate,
            inputSummary.size?.usdcSize,
            (fee, usdc) => fee * usdc
          );

          return {
            subaccountNumber: subaccountToUse,
            minimumSignedLeverage: leverageLimits.minLeverage.toNumber(),
            maximumSignedLeverage: leverageLimits.maxLeverage.toNumber(),
            slippage: 0,
            indexSlippage: 0,
            filled: true,
            feeRate,
            inputSummary,
            fee: totalFees,
            payloadPrice: price,
            isPositionClosed:
              mapIfPresent(
                inputSummary.size?.size,
                baseAccount?.position?.unsignedSize.toNumber(),
                baseAccount?.position?.side,
                trade.side,
                AttemptNumber(accountData.currentTradeMarketSummary?.stepSize),
                (filled, size, positionSide, orderSide, stepSize) =>
                  ((positionSide === IndexerPositionSide.LONG && orderSide === OrderSide.SELL) ||
                    (positionSide === IndexerPositionSide.SHORT && orderSide === OrderSide.BUY)) &&
                  Math.abs(filled - size) < stepSize / 2
              ) ?? false,
            total: calculateOrderTotal(inputSummary.size?.usdcSize, totalFees, trade.side),
            transferToSubaccountAmount: calculateIsolatedTransferAmount(
              trade,
              inputSummary.size?.size ?? 0,
              price ?? 0,
              subaccountToUse,
              accountData.rawParentSubaccountData?.parentSubaccount,
              baseAccount?.position,
              accountData.currentTradeMarketSummary
            ),
            reward: isMaker
              ? calculateMakerReward(totalFees, accountData.rewardParams)
              : calculateTakerReward(
                  inputSummary.size?.usdcSize,
                  totalFees,
                  accountData.rewardParams,
                  accountData.feeTiers
                ),
          };
        });
      default:
        assertNever(trade.type);
        throw new Error('invalid trade type');
    }
  });
}

interface TradeInputMarketOrder {
  orderbook: OrderbookUsage[];
  averagePrice?: number;
  totalFees?: number;

  size?: number;
  usdcSize?: number;
  leverageSigned?: number;

  worstPrice?: number;
  filled: boolean;
}

interface OrderbookUsage {
  price: number;
  size: number;
}

function calculateMarketOrder(
  trade: TradeForm,
  baseAccount: TradeAccountDetails | undefined,
  accountData: TradeFormInputData,
  subaccountNumber: number
): {
  marketOrder: TradeInputMarketOrder | undefined;
  summary: TradeInputSummary | undefined;
} {
  const marketOrder = createMarketOrder(trade, baseAccount, accountData, subaccountNumber);

  return {
    marketOrder,
    summary: {
      averageFillPrice: marketOrder?.averagePrice,
      worstFillPrice: marketOrder?.worstPrice,
      size: {
        leverageSigned: marketOrder?.leverageSigned,
        size: marketOrder?.size,
        usdcSize: marketOrder?.usdcSize,
      },
    },
  };
}

type SizeTarget = {
  target: BigNumber;
  type: 'size' | 'usdc' | 'leverage' | 'maximum';
};

function getMaxCrossMarketOrderSizeSummary(
  trade: TradeForm,
  baseAccount: TradeAccountDetails | undefined,
  accountData: TradeFormInputData,
  subaccountNumber: number
) {
  const result = createMarketOrder(trade, baseAccount, accountData, subaccountNumber, true);
  return result;
}

function createMarketOrder(
  trade: TradeForm,
  baseAccount: TradeAccountDetails | undefined,
  accountData: TradeFormInputData,
  subaccountNumber: number,
  overrideToMaximumSize?: boolean
): TradeInputMarketOrder | undefined {
  const orderbookBase = accountData.currentTradeMarketOrderbook;
  const orderbook =
    trade.side == null
      ? undefined
      : trade.side === OrderSide.BUY
        ? orderbookBase?.asks
        : orderbookBase?.bids;

  if (orderbook == null) {
    return undefined;
  }

  const effectiveSizeTarget = overrideToMaximumSize
    ? { target: BIG_NUMBERS.ZERO, type: 'maximum' as const }
    : trade.size != null
      ? calculateEffectiveSizeTarget(trade.size, trade, baseAccount, accountData)
      : undefined;

  if (effectiveSizeTarget == null) {
    return undefined;
  }

  return mapIfPresent(
    AttemptNumber(accountData.currentTradeMarketSummary?.oraclePrice),
    mapIfPresent(
      baseAccount?.subaccountSummaries,
      (summaries) => summaries[subaccountNumber]?.equity.toNumber() ?? 0
    ),
    mapIfPresent(
      baseAccount?.subaccountSummaries,
      (summaries) => summaries[subaccountNumber]?.freeCollateral.toNumber() ?? 0
    ),
    AttemptNumber(accountData.currentTradeMarketSummary?.stepSize),
    AttemptNumber(accountData.currentTradeMarketSummary?.effectiveInitialMarginFraction),
    trade.side,
    (oraclePrice, equity, freeCollateral, stepSize, marketEffectiveImf, orderSide) =>
      simulateMarketOrder(
        effectiveSizeTarget,
        orderbook,
        accountData.userFeeStats.takerFeeRate ?? 0,
        oraclePrice,
        equity,
        freeCollateral,
        stepSize,
        marketEffectiveImf,
        orderSide,
        trade.reduceOnly ?? false,
        baseAccount?.position
      )
  );
}

function simulateMarketOrder(
  effectiveSizeTargetBase: SizeTarget,
  orderbook: CanvasOrderbookLine[],
  feeRate: number,
  oraclePrice: number,
  subaccountEquity: number,
  subaccountFreeCollateral: number,
  marketStepSize: number,
  marketEffectiveImf: number,
  side: OrderSide,
  // currently only used for the 'maximum' size
  reduceOnly: boolean,
  existingPosition: SubaccountPosition | undefined
): TradeInputMarketOrder | undefined {
  const operationMultipler = side === OrderSide.BUY ? 1 : -1;

  let totalSize = 0;
  let totalCostWithoutFees = 0;
  let totalCost = 0;
  let thisPositionValue = existingPosition == null ? 0 : existingPosition.value.toNumber();
  let equity = subaccountEquity;
  const initialRiskWithoutPosition =
    subaccountEquity - subaccountFreeCollateral - (existingPosition?.initialRisk.toNumber() ?? 0);
  const orderbookRows: OrderbookUsage[] = [];
  let filled = false;

  if (orderbook.length === 0) {
    return {
      orderbook: [],
      filled: false,
      size: 0,
      usdcSize: 0,
      totalFees: 0,
      leverageSigned:
        existingPosition != null
          ? (existingPosition.leverage ?? BIG_NUMBERS.ZERO)
              .times(existingPosition.value.div(existingPosition.value.abs()))
              .toNumber()
          : 0,
      averagePrice: undefined,
      worstPrice: undefined,
    };
  }
  const effectiveSizeTarget = {
    ...effectiveSizeTargetBase,
    target: effectiveSizeTargetBase.target.toNumber(),
  };

  for (let i = 0; i < orderbook.length; i += 1) {
    const currentRow = orderbook[i]!;
    const rowPrice = currentRow.price;
    const rowSize = currentRow.size;

    let sizeToTake = 0;
    const sizeEquityImpact =
      oraclePrice * operationMultipler - rowPrice * feeRate - rowPrice * operationMultipler;

    if (effectiveSizeTarget.type === 'size') {
      sizeToTake = effectiveSizeTarget.target - totalSize;
    } else if (effectiveSizeTarget.type === 'usdc') {
      const maxSizeForRemainingUsdc =
        (effectiveSizeTarget.target - totalCost) / (rowPrice * (1 + feeRate));
      sizeToTake = maxSizeForRemainingUsdc;
    } else if (effectiveSizeTarget.type === 'leverage') {
      const targetLeverage = effectiveSizeTarget.target;

      // numerator is the target quantity, which in this case is targetPositionValue - currentPositionValue,
      // which is a positionValueDelta
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      const numerator = calc(() => {
        const base = targetLeverage * equity - thisPositionValue;
        // if we're heading in the wrong direciton, go nowhere
        if (base * operationMultipler < 0) {
          return 0;
        }
        return base;
      });

      // denominator is the impact of each unit size on the target quantity (positionValue)
      // for each unit size we add, how is position value affected
      // and as above, position value is changing proportional to targetLeverage * equity - thisPositionValue
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      const denominator = calc(() => {
        const base = -(targetLeverage * sizeEquityImpact - operationMultipler * oraclePrice);

        if (base * operationMultipler < 0) {
          // somehow adding size is taking position value in the opposite diretion
          // which means leverage is going down as size goes up
          // so let's force take the whole row I guess, by making numerator/denominator very large
          return numerator / Number.MAX_SAFE_INTEGER;
        }

        return base;
      });

      const maxSizeAtThisPrice = denominator === 0 ? 0 : numerator / denominator;
      sizeToTake = maxSizeAtThisPrice;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (effectiveSizeTarget.type === 'maximum') {
      const increasing =
        (thisPositionValue <= 0 && side === OrderSide.SELL) ||
        (thisPositionValue >= 0 && side === OrderSide.BUY);

      if (increasing) {
        const currentFreeCollateral =
          equity - initialRiskWithoutPosition - marketEffectiveImf * Math.abs(thisPositionValue);
        const numerator = Math.max(currentFreeCollateral, 0);
        const denominator = Math.max(-(sizeEquityImpact - marketEffectiveImf * oraclePrice), 0);
        // if denominator is 0 that means each unit size is increasing free collateral
        const maxSizeAtThisPrice = denominator === 0 ? rowSize : numerator / denominator;
        sizeToTake = maxSizeAtThisPrice;
      } else if (existingPosition != null) {
        // we want to decrease as much as possible then start increasing
        const remainingPosition = existingPosition.unsignedSize.toNumber() - totalSize;
        if (rowSize > remainingPosition) {
          // we can sell everything here
          sizeToTake = remainingPosition;

          if (!reduceOnly) {
            const newPositionValue = 0; // we sold everything

            const newEquity = equity + sizeToTake * sizeEquityImpact;
            const newFreeCollateral =
              newEquity -
              initialRiskWithoutPosition -
              marketEffectiveImf * Math.abs(newPositionValue);

            // then we sell everything we can with the remaining usdc, back to the increasing case
            const numerator = Math.max(newFreeCollateral, 0);
            const denominator = Math.max(-(sizeEquityImpact - marketEffectiveImf * oraclePrice), 0);
            // if denominator is 0 that means each unit size is increasing free collateral
            const maxSizeAtThisPrice = denominator === 0 ? rowSize : numerator / denominator;
            sizeToTake += maxSizeAtThisPrice;
          }
        } else {
          // just sell as much as we can, then we're done
          sizeToTake = remainingPosition;
        }
      }
    } else {
      assertNever(effectiveSizeTarget.type);
    }

    // make sure size we take is between 0 and rowSize, then round to clean multiple of stepSize
    sizeToTake = toStepSize(
      clampBn(MustBigNumber(sizeToTake), BIG_NUMBERS.ZERO, MustBigNumber(rowSize)),
      marketStepSize
    );

    if (sizeToTake <= 0) {
      // can't take any from here, so we're done
      filled = true;
      break;
    } else {
      totalSize += sizeToTake;
      totalCostWithoutFees += sizeToTake * rowPrice;
      totalCost += sizeToTake * rowPrice + sizeToTake * rowPrice * feeRate;
      thisPositionValue += sizeToTake * operationMultipler * oraclePrice;
      equity +=
        // update to notional
        sizeToTake * operationMultipler * oraclePrice +
        // update to quote for cost
        sizeToTake * operationMultipler * -1 * rowPrice +
        // update to quote for fees
        sizeToTake * rowPrice * feeRate * -1;
      orderbookRows.push({ price: rowPrice, size: sizeToTake });
    }
  }

  return {
    orderbook: orderbookRows,
    averagePrice: totalSize <= 0 ? undefined : totalCostWithoutFees / totalSize,

    // we may have accumulated rounding errors, so round to clean multiple of step size
    // this is still wrong since the clean multiple of step size might not be perfectly representable as double
    // correct fix here is to do all calculations in bignumber and return a string size
    size: toStepSize(totalSize, marketStepSize),
    usdcSize: totalCostWithoutFees,

    totalFees: totalCost - totalCostWithoutFees,
    leverageSigned:
      equity <= 0
        ? undefined
        : ((existingPosition?.value.toNumber() ?? 0) +
            totalSize * oraclePrice * operationMultipler) /
          equity,
    worstPrice: orderbookRows.at(-1)?.price,
    filled,
  };
}

function calculateSubaccountToUseForTrade(
  marginMode: MarginMode | undefined,
  existingPositionSubaccount: number | undefined,
  openOrderSubaccount: number | undefined,
  allOpenOrders: SubaccountOrder[],
  rawParentSubaccountData: ParentSubaccountDataBase | undefined
): number {
  if (existingPositionSubaccount != null) {
    return existingPositionSubaccount;
  }
  if (openOrderSubaccount != null) {
    return openOrderSubaccount;
  }
  if (marginMode == null || marginMode === MarginMode.CROSS) {
    return rawParentSubaccountData?.parentSubaccount ?? 0;
  }
  // it's isolated, so return first available one
  const inUseSubaccountIdStrings = new Set([
    ...allOpenOrders.map((o) => `${o.subaccountNumber}`),
    ...Object.keys(rawParentSubaccountData?.childSubaccounts ?? {}),
  ]);

  for (
    let potentialSubaccount =
      (rawParentSubaccountData?.parentSubaccount ?? 0) + NUM_PARENT_SUBACCOUNTS;
    potentialSubaccount <= MAX_SUBACCOUNT_NUMBER;
    potentialSubaccount += NUM_PARENT_SUBACCOUNTS
  ) {
    if (!inUseSubaccountIdStrings.has(`${potentialSubaccount}`)) {
      return potentialSubaccount;
    }
  }
  // eslint-disable-next-line no-console
  console.error('calculateTradeInfo found no possible isolated subaccount numbers available');
  return 0;
}

function getSignedLeverageLimits(
  currentPosition: SubaccountPosition | undefined,
  marketEffectiveImf: number | undefined,
  side: OrderSide | undefined,
  reduceOnly: boolean
): { minLeverage: BigNumber; maxLeverage: BigNumber } {
  const sideToUse = side ?? OrderSide.BUY;

  const effectiveImf = marketEffectiveImf ?? 1;
  const marketMaxLeverage = BIG_NUMBERS.ONE.div(effectiveImf === 0 ? 1 : effectiveImf);

  const hasPosition = currentPosition != null && !currentPosition.signedSize.isZero();
  const positionLeverageUnsigned = currentPosition?.leverage ?? BIG_NUMBERS.ZERO;
  const isPositionLong = hasPosition && currentPosition.signedSize.gt(BIG_NUMBERS.ZERO);
  const positionLeverageSigned = positionLeverageUnsigned.times(isPositionLong ? 1 : -1);

  const isOrderBuy = sideToUse === OrderSide.BUY;
  const isOrderIncreasingPosition =
    !hasPosition || (isPositionLong && isOrderBuy) || (!isPositionLong && !isOrderBuy);

  return {
    minLeverage: positionLeverageSigned,
    maxLeverage: calc(() => {
      if (reduceOnly) {
        if (isOrderIncreasingPosition) {
          // Can't increase position with reduceOnly
          return positionLeverageSigned;
        }
        // Can reduce position to zero
        return BIG_NUMBERS.ZERO;
      }
      // Not reduceOnly, use standard market limits
      return (isOrderBuy ? marketMaxLeverage : marketMaxLeverage.times(-1)).times(
        MAX_LEVERAGE_BUFFER_PERCENT
      );
    }),
  };
}

function getSignedLeverageLimitsForMarketOrder(
  limits: {
    minLeverage: BigNumber;
    maxLeverage: BigNumber;
  },
  maxCalculated: number | undefined
) {
  return (
    mapIfPresent(maxCalculated, (m) =>
      AttemptBigNumber(m)?.decimalPlaces(2, BigNumber.ROUND_DOWN).times(MAX_LEVERAGE_BUFFER_PERCENT)
    ) ?? limits.maxLeverage
  );
}

function calculateEffectiveSizeTarget(
  sizeInput: OrderSizeInput,
  trade: TradeForm,
  baseAccount: TradeAccountDetails | undefined,
  accountData: TradeFormInputData
): SizeTarget | undefined {
  return OrderSizeInputs.match<SizeTarget | undefined>(sizeInput, {
    AVAILABLE_PERCENT: ({ value }) => {
      const percent = AttemptBigNumber(value);
      if (percent == null) {
        return undefined;
      }

      const isDecreasingOrFlipping =
        baseAccount?.position != null &&
        ((trade.side === OrderSide.BUY &&
          baseAccount.position.side === IndexerPositionSide.SHORT) ||
          (trade.side === OrderSide.SELL &&
            baseAccount.position.side === IndexerPositionSide.LONG));
      const isReduceOnly = !!trade.reduceOnly;

      if (isReduceOnly && isDecreasingOrFlipping && baseAccount.position != null) {
        const target = baseAccount.position.unsignedSize.times(percent);
        return {
          target,
          type: 'size' as const,
        };
      }
      // we don't support target leverage for isolated positions, makes no sense since we're transferring collateral with trade
      if (trade.marginMode === MarginMode.ISOLATED) {
        return undefined;
      }
      const parentSubaccountFreeCollateral =
        baseAccount?.account?.freeCollateral ?? BIG_NUMBERS.ZERO;
      const marketEffectiveImf =
        accountData.currentTradeMarketSummary?.effectiveInitialMarginFraction ?? 1;
      const usdcTarget = parentSubaccountFreeCollateral
        .times(percent)
        .div(marketEffectiveImf === 0 ? 1 : marketEffectiveImf);
      return {
        target: usdcTarget,
        type: 'usdc' as const,
      };
    },
    SIZE: ({ value }) => {
      const target = AttemptBigNumber(value);
      if (target == null) {
        return undefined;
      }
      return {
        type: 'size' as const,
        target,
      };
    },
    USDC_SIZE: ({ value }) => {
      const target = AttemptBigNumber(value);
      if (target == null) {
        return undefined;
      }
      return {
        type: 'usdc' as const,
        target,
      };
    },
    SIGNED_POSITION_LEVERAGE: ({ value }) => {
      let target = AttemptBigNumber(value);
      if (target == null) {
        return undefined;
      }
      if (trade.side == null) {
        return undefined;
      }
      // we don't support target leverage for isolated positions, makes no sense since we're transferring collateral with trade
      if (trade.marginMode === MarginMode.ISOLATED && !trade.reduceOnly) {
        return undefined;
      }
      const signedLimits = getSignedLeverageLimits(
        baseAccount?.position,
        accountData.currentTradeMarketSummary?.effectiveInitialMarginFraction ?? undefined,
        trade.side,
        trade.reduceOnly ?? false
      );
      if (trade.side === OrderSide.BUY) {
        // going positive
        if (target.lt(signedLimits.minLeverage)) {
          target = signedLimits.minLeverage;
        }
        if (target.gt(signedLimits.maxLeverage)) {
          target = signedLimits.maxLeverage;
        }
      } else {
        // going negative
        if (target.gt(signedLimits.minLeverage)) {
          target = signedLimits.minLeverage;
        }
        if (target.lt(signedLimits.maxLeverage)) {
          target = signedLimits.maxLeverage;
        }
      }
      return {
        target,
        type: 'leverage',
      };
    },
  });
}

function calculateLimitOrderInputSummary(
  size: OrderSizeInput | undefined,
  limitPrice: string | undefined,
  reduceOnly: boolean | undefined,
  marketStepSize: number | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  baseAccount: TradeAccountDetails | undefined
): TradeInputSummary {
  const price = MustNumber(limitPrice);
  const effectiveSize = toStepSize(
    size != null
      ? OrderSizeInputs.match(size, {
          // only reduce only
          AVAILABLE_PERCENT: ({ value }) => {
            if (!reduceOnly) {
              return 0.0;
            }
            const percent = AttemptBigNumber(value);
            if (percent == null) {
              return 0.0;
            }
            return baseAccount?.position?.unsignedSize.times(percent).toNumber() ?? 0.0;
          },
          // not supported
          SIGNED_POSITION_LEVERAGE: () => 0.0,
          SIZE: ({ value }) => AttemptNumber(value) ?? 0.0,
          USDC_SIZE: ({ value }) => divideIfNonZeroElse(MustNumber(value), price, 0),
        })
      : 0.0,
    marketStepSize ?? 1
  );

  return {
    averageFillPrice: price,
    worstFillPrice: price,
    size: {
      // not supported
      leverageSigned: undefined,
      size: effectiveSize,
      usdcSize: effectiveSize * price,
    },
  };
}

function divideIfNonZeroElse(numerator: number, denominator: number, backup: number) {
  return denominator !== 0 ? numerator / denominator : backup;
}

const RATE_LOST_TO_REV_SHARES = 0.4; // megavault and ops
const MAX_POSSIBLE_TAKER_REV_SHARE = 0.5; // affiliates

function calculateTakerReward(
  usdcSize: number | undefined,
  fee: number | undefined,
  rewardsParams: RewardParamsSummary | undefined,
  feeTiers: FeeTierSummary[] | undefined
): number | undefined {
  const feeMultiplier = rewardsParams?.feeMultiplier;
  const tokenPrice = rewardsParams?.tokenPrice;
  const notional = usdcSize;
  const maxMakerRebate = findMaxMakerRebate(feeTiers);

  if (
    fee != null &&
    feeMultiplier != null &&
    tokenPrice != null &&
    fee > 0.0 &&
    notional != null &&
    tokenPrice > 0.0
  ) {
    return (
      ((fee - maxMakerRebate * notional - fee * MAX_POSSIBLE_TAKER_REV_SHARE) *
        feeMultiplier *
        RATE_LOST_TO_REV_SHARES) /
      tokenPrice
    );
  }
  return undefined;
}

function calculateMakerReward(
  fee: number | undefined,
  rewardsParams: RewardParamsSummary | undefined
): number | undefined {
  const feeMultiplier = rewardsParams?.feeMultiplier;
  const tokenPrice = rewardsParams?.tokenPrice;

  if (fee != null && feeMultiplier != null && tokenPrice != null && fee > 0.0 && tokenPrice > 0.0) {
    return (fee * feeMultiplier * RATE_LOST_TO_REV_SHARES) / tokenPrice;
  }
  return undefined;
}

function findMaxMakerRebate(feeTiers: FeeTierSummary[] | undefined): number {
  if (feeTiers == null || feeTiers.length === 0) return 0.0;

  const negativeRates = feeTiers.map((tier) => tier.maker ?? 0.0).filter((rate) => rate < 0.0);

  if (negativeRates.length === 0) return 0.0;

  return Math.abs(Math.min(...negativeRates));
}

function calculateMarketOrderSlippage(
  worstPrice: number | undefined,
  midPrice: number | undefined
) {
  return mapIfPresent(worstPrice, midPrice, (worst, mid) => {
    return mid <= 0 ? 0 : Math.abs(worst - mid) / mid;
  });
}

function calculateOrderTotal(
  usdcSize: number | undefined,
  totalFees: number | undefined,
  side: OrderSide | undefined
) {
  return mapIfPresent(usdcSize, (u) => u * (side === OrderSide.SELL ? 1 : -1) - (totalFees ?? 0));
}

function calculateIsolatedTransferAmount(
  trade: TradeForm,
  tradeSize: number,
  tradePrice: number,
  subaccountToUse: number,
  parentSubaccount: number | undefined,
  existingPosition: SubaccountPosition | undefined,
  tradeMarketSummary: PerpetualMarketSummary | undefined
): number {
  if (
    !getShouldTransferCollateral(
      trade,
      tradeSize,
      subaccountToUse,
      existingPosition,
      parentSubaccount
    )
  ) {
    return 0;
  }
  return (
    calculateIsolatedMarginTransferAmount(
      trade,
      tradeSize,
      tradePrice,
      existingPosition,
      tradeMarketSummary
    ) ?? 0
  );
}

function getShouldTransferCollateral(
  trade: TradeForm,
  tradeSize: number,
  subaccountToUse: number,
  existingPosition: SubaccountPosition | undefined,
  parentSubaccount: number | undefined
): boolean {
  const isIsolatedOrder =
    trade.marginMode === MarginMode.ISOLATED && subaccountToUse !== parentSubaccount;
  const isReduceOnly = trade.reduceOnly ?? false;
  const isIncreasingSize = getPositionSizeDifference(trade, tradeSize, existingPosition) > 0;
  return isIsolatedOrder && isIncreasingSize && !isReduceOnly;
}

function calculateIsolatedMarginTransferAmount(
  trade: TradeForm,
  tradeSize: number,
  tradePrice: number,
  existingPosition: SubaccountPosition | undefined,
  tradeMarketSummary: PerpetualMarketSummary | undefined
): number | undefined {
  const oraclePrice = AttemptNumber(tradeMarketSummary?.oraclePrice);
  const side = trade.side;
  if (side == null || oraclePrice == null) {
    return undefined;
  }

  const effectiveImf = tradeMarketSummary?.effectiveInitialMarginFraction ?? 0;
  const marketMaxLeverage = 1 / (effectiveImf === 0 ? 1 : effectiveImf);
  const targetLeverage =
    AttemptNumber(trade.targetLeverage) ?? Math.min(DEFAULT_TARGET_LEVERAGE, marketMaxLeverage);

  const positionSizeDifference = getPositionSizeDifference(trade, tradeSize, existingPosition);

  const estOraclePriceAtExecution = calc(() => {
    switch (trade.type) {
      case TradeFormType.MARKET:
        return oraclePrice;
      case TradeFormType.LIMIT:
      case TradeFormType.TRIGGER_LIMIT:
        return tradePrice;
      case TradeFormType.TRIGGER_MARKET:
        return MustNumber(trade.triggerPrice);
      default:
        assertNever(trade.type);
        return 0;
    }
  });

  return calculateIsolatedMarginTransferAmountFromValues(
    targetLeverage,
    side,
    estOraclePriceAtExecution,
    tradePrice,
    marketMaxLeverage,
    positionSizeDifference
  );
}

function getPositionSizeDifference(
  trade: TradeForm,
  tradeSize: number,
  existingPosition: SubaccountPosition | undefined
) {
  const baseTradeSizeSigned = tradeSize * (trade.side === OrderSide.SELL ? -1 : 1);
  const positionSizeBefore = existingPosition?.signedSize.toNumber() ?? 0;
  const positionSizeAfterNotAccountingForReduceOnly = positionSizeBefore + baseTradeSizeSigned;
  const positionSizeAfter =
    trade.reduceOnly && positionSizeBefore * positionSizeAfterNotAccountingForReduceOnly <= 0
      ? 0
      : positionSizeAfterNotAccountingForReduceOnly;
  const positionSizeDifference = Math.abs(positionSizeAfter) - Math.abs(positionSizeBefore);
  return positionSizeDifference;
}

function calculateIsolatedMarginTransferAmountFromValues(
  targetLeverage: number,
  side: OrderSide,
  estOraclePriceAtExecution: number,
  price: number,
  maxMarketLeverage: number,
  positionSizeDifference: number
): number | undefined {
  const adjustedTargetLeverage = Math.min(
    targetLeverage,
    maxMarketLeverage * MAX_TARGET_LEVERAGE_BUFFER_PERCENT
  );

  if (adjustedTargetLeverage === 0) {
    return undefined;
  }

  const amount = getTransferAmountFromTargetLeverage(
    price,
    estOraclePriceAtExecution,
    side,
    positionSizeDifference,
    adjustedTargetLeverage
  );
  if (amount <= 0) {
    return undefined;
  }
  return amount;
}

function getTransferAmountFromTargetLeverage(
  price: number,
  estOraclePriceAtExecution: number,
  side: OrderSide,
  size: number,
  targetLeverage: number
): number {
  if (targetLeverage === 0) {
    return 0;
  }

  const naiveTransferAmount = (price * size) / targetLeverage;

  // Calculate price difference for immediate PnL impact
  const priceDiff =
    side === OrderSide.BUY ? price - estOraclePriceAtExecution : estOraclePriceAtExecution - price;

  // Return the maximum of the naive transfer and the adjusted transfer amount
  return Math.max(
    (estOraclePriceAtExecution * size) / targetLeverage + priceDiff * size,
    naiveTransferAmount
  );
}
