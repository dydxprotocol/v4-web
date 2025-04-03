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
import { mapValues } from 'lodash';

import { MAX_SUBACCOUNT_NUMBER, NUM_PARENT_SUBACCOUNTS } from '@/constants/account';
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
  TradeFormFieldStates,
  TradeFormInputData,
  TradeFormType,
  TradeInputSummary,
  TradeSummary,
} from './types';

const MARKET_ORDER_MAX_SLIPPAGE = 0.05;
const MAJOR_MARKETS = new Set(['ETH-USD', 'BTC-USD', 'SOL-USD']);
const STOP_MARKET_ORDER_SLIPPAGE_BUFFER_MAJOR_MARKET = 0.05;
const TAKE_PROFIT_MARKET_ORDER_SLIPPAGE_BUFFER_MAJOR_MARKET = 0.05;
const STOP_MARKET_ORDER_SLIPPAGE_BUFFER = 0.1;
const TAKE_PROFIT_MARKET_ORDER_SLIPPAGE_BUFFER = 0.1;
const MAX_TARGET_LEVERAGE_BUFFER_PERCENT = 0.98;
const MAX_LEVERAGE_BUFFER_PERCENT = 0.98;
const DEFAULT_TARGET_LEVERAGE = 2.0;

export function calculateTradeInfo(
  fieldStates: TradeFormFieldStates,
  baseAccount: TradeAccountDetails | undefined,
  accountData: TradeFormInputData
): TradeSummary {
  const trade = mapValues(fieldStates, (s) => s.effectiveValue) as TradeForm;

  const subaccountToUse = calculateSubaccountToUseForTrade(
    trade.marginMode,
    baseAccount?.position?.subaccountNumber,
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
          const calculated = calculateMarketOrder(trade, baseAccount, accountData);
          const orderbookBase = accountData.currentTradeMarketOrderbook;

          return {
            inputSummary: calculated.summary ?? { size: undefined, averageFillPrice: undefined },
            subaccountNumber: subaccountToUse,
            payloadPrice: mapIfPresent(calculated.marketOrder?.averagePrice, (price) => {
              if (trade.side == null || trade.side === OrderSide.BUY) {
                return price * (1 + MARKET_ORDER_MAX_SLIPPAGE);
              }
              return price * (1 - MARKET_ORDER_MAX_SLIPPAGE);
            }),
            minimumSignedLeverage: leverageLimits.minLeverage.toNumber(),
            maximumSignedLeverage: leverageLimits.maxLeverage.toNumber(),
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
      case TradeFormType.STOP_MARKET:
      case TradeFormType.TAKE_PROFIT_MARKET:
        return calc((): TradeSummary => {
          const calculated = calculateMarketOrder(trade, baseAccount, accountData);
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
                  return trade.type === TradeFormType.STOP_MARKET
                    ? STOP_MARKET_ORDER_SLIPPAGE_BUFFER_MAJOR_MARKET
                    : TAKE_PROFIT_MARKET_ORDER_SLIPPAGE_BUFFER_MAJOR_MARKET;
                }
                return trade.type === TradeFormType.STOP_MARKET
                  ? STOP_MARKET_ORDER_SLIPPAGE_BUFFER
                  : TAKE_PROFIT_MARKET_ORDER_SLIPPAGE_BUFFER;
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
      case TradeFormType.STOP_LIMIT:
      case TradeFormType.TAKE_PROFIT_LIMIT:
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
  balancePercent?: number;
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
  accountData: TradeFormInputData
): {
  marketOrder: TradeInputMarketOrder | undefined;
  summary: TradeInputSummary | undefined;
} {
  const marketOrder = createMarketOrder(trade, baseAccount, accountData);

  return {
    marketOrder,
    summary: {
      averageFillPrice: marketOrder?.averagePrice,
      size: {
        balancePercent: marketOrder?.balancePercent,
        leverageSigned: marketOrder?.leverageSigned,
        size: marketOrder?.size,
        usdcSize: marketOrder?.usdcSize,
      },
    },
  };
}

type SizeTarget = {
  target: BigNumber;
  type: 'size' | 'usdc' | 'leverage';
};

function createMarketOrder(
  trade: TradeForm,
  baseAccount: TradeAccountDetails | undefined,
  accountData: TradeFormInputData
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

  if (trade.size == null) {
    return undefined;
  }

  const effectiveSizeTarget = calculateEffectiveSizeTarget(
    trade.size,
    trade,
    baseAccount,
    accountData
  );

  if (effectiveSizeTarget == null) {
    return undefined;
  }

  return mapIfPresent(
    AttemptNumber(accountData.currentTradeMarketSummary?.oraclePrice),
    baseAccount?.account?.parentSubaccountEquity.toNumber(),
    baseAccount?.account?.freeCollateral.toNumber(),
    AttemptNumber(accountData.currentTradeMarketSummary?.stepSize),
    trade.side,
    (oraclePrice, equity, freeCollateral, stepSize, orderSide) =>
      simulateMarketOrder(
        effectiveSizeTarget,
        orderbook,
        accountData.userFeeStats.takerFeeRate ?? 0,
        oraclePrice,
        equity,
        freeCollateral,
        stepSize,
        orderSide,
        baseAccount?.position
      )
  );
}

function simulateMarketOrder(
  effectiveSizeTargetBase: SizeTarget,
  orderbook: CanvasOrderbookLine[],
  feeRate: number,
  oraclePrice: number,
  crossAccountEquity: number,
  crossAccountFreeCollateral: number,
  marketStepSize: number,
  side: OrderSide,
  existingPosition: SubaccountPosition | undefined
): TradeInputMarketOrder | undefined {
  const operationMultipler = side === OrderSide.BUY ? 1 : -1;

  let totalSize = 0;
  let totalCostWithoutFees = 0;
  let totalCost = 0;
  let thisPositionValue = existingPosition == null ? 0 : existingPosition.value.toNumber();
  let equity = crossAccountEquity;
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
      averagePrice: 0,
      balancePercent: 0,
      worstPrice: 0,
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

    if (effectiveSizeTarget.type === 'size') {
      sizeToTake = effectiveSizeTarget.target - totalSize;
    } else if (effectiveSizeTarget.type === 'usdc') {
      const maxSizeForRemainingUsdc =
        (effectiveSizeTarget.target - totalCost) / (rowPrice * (1 + feeRate));
      sizeToTake = maxSizeForRemainingUsdc;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (effectiveSizeTarget.type === 'leverage') {
      const targetLeverage = effectiveSizeTarget.target;
      const aFactor =
        oraclePrice * operationMultipler - rowPrice * feeRate - rowPrice * operationMultipler;
      const denominator = targetLeverage * aFactor - operationMultipler * oraclePrice;
      const numerator = thisPositionValue - targetLeverage * equity;
      const maxSizeAtThisPrice = denominator === 0 ? 0 : numerator / denominator;
      sizeToTake = maxSizeAtThisPrice;
    } else {
      assertNever(effectiveSizeTarget.type);
    }

    sizeToTake = clampBn(MustBigNumber(sizeToTake), BIG_NUMBERS.ZERO, MustBigNumber(rowSize))
      .div(marketStepSize)
      .decimalPlaces(0, BigNumber.ROUND_HALF_DOWN)
      .times(marketStepSize)
      .toNumber();

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
    averagePrice: totalCostWithoutFees / totalSize,

    size: totalSize,
    usdcSize: totalCostWithoutFees,

    balancePercent: totalCost / crossAccountFreeCollateral,
    totalFees: totalCost - totalCostWithoutFees,
    leverageSigned:
      equity <= 0
        ? 0
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
  allOpenOrders: SubaccountOrder[],
  rawParentSubaccountData: ParentSubaccountDataBase | undefined
): number {
  //   const byExistingPosition = baseAccount?.position?.subaccountNumber;
  if (existingPositionSubaccount != null) {
    return existingPositionSubaccount;
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
      if (trade.marginMode === MarginMode.ISOLATED) {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  baseAccount: TradeAccountDetails | undefined
): TradeInputSummary {
  const price = MustNumber(limitPrice);
  const effectiveSize =
    size != null
      ? OrderSizeInputs.match(size, {
          // not supported
          AVAILABLE_PERCENT: () => 0.0,
          // not supported
          SIGNED_POSITION_LEVERAGE: () => 0.0,
          SIZE: ({ value }) => AttemptNumber(value) ?? 0.0,
          USDC_SIZE: ({ value }) => divideIfNonZeroElse(MustNumber(value), price, 0),
        })
      : 0.0;

  return {
    averageFillPrice: price,
    size: {
      // not supported
      balancePercent: undefined,
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
    return (feeMultiplier * (fee - maxMakerRebate * notional)) / tokenPrice;
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
    return (fee * feeMultiplier) / tokenPrice;
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
  if (!getShouldTransferCollateral(trade, subaccountToUse, existingPosition, parentSubaccount)) {
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
  subaccountToUse: number,
  existingPosition: SubaccountPosition | undefined,
  parentSubaccount: number | undefined
): boolean {
  const isIsolatedOrder =
    trade.marginMode === MarginMode.ISOLATED && subaccountToUse !== parentSubaccount;
  const isReduceOnly = trade.reduceOnly ?? false;
  const isIncreasingSize = isTradeIncreasingPositionSize(
    trade.side,
    existingPosition?.side,
    trade.reduceOnly
  );
  return isIsolatedOrder && isIncreasingSize && !isReduceOnly;
}

function isTradeIncreasingPositionSize(
  tradeSide: OrderSide | undefined,
  positionSide: IndexerPositionSide | undefined,
  reduceOnly: boolean | undefined
) {
  if (reduceOnly === true) {
    return false;
  }
  return (
    positionSide == null ||
    tradeSide == null ||
    (tradeSide === OrderSide.BUY && positionSide === IndexerPositionSide.LONG) ||
    (tradeSide === OrderSide.SELL && positionSide === IndexerPositionSide.SHORT)
  );
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

  const baseTradeSizeSigned = tradeSize * (trade.side === OrderSide.SELL ? -1 : 1);
  const positionSizeDifference = isTradeIncreasingPositionSize(
    trade.side,
    existingPosition?.side,
    trade.reduceOnly
  )
    ? baseTradeSizeSigned
    : trade.reduceOnly
      ? // reduce only + decreasing size
        calc(() => {
          if (
            existingPosition?.side === IndexerPositionSide.LONG &&
            trade.side === OrderSide.SELL
          ) {
            const size = Math.min(existingPosition.unsignedSize.toNumber(), tradeSize);
            return size * -1;
          }
          if (
            existingPosition?.side === IndexerPositionSide.SHORT &&
            trade.side === OrderSide.BUY
          ) {
            const size = Math.min(existingPosition.unsignedSize.toNumber(), tradeSize);
            return size;
          }
          return baseTradeSizeSigned;
        })
      : baseTradeSizeSigned;

  return calculateIsolatedMarginTransferAmountFromValues(
    targetLeverage,
    side,
    oraclePrice,
    tradePrice,
    marketMaxLeverage,
    positionSizeDifference
  );
}

function calculateIsolatedMarginTransferAmountFromValues(
  targetLeverage: number,
  side: OrderSide,
  oraclePrice: number,
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

  return getTransferAmountFromTargetLeverage(
    price,
    oraclePrice,
    side,
    positionSizeDifference,
    adjustedTargetLeverage
  );
}

function getTransferAmountFromTargetLeverage(
  price: number,
  oraclePrice: number,
  side: OrderSide,
  size: number,
  targetLeverage: number
): number {
  if (targetLeverage === 0) {
    return 0;
  }

  const naiveTransferAmount = (price * size) / targetLeverage;

  // Calculate price difference for immediate PnL impact
  const priceDiff = side === OrderSide.BUY ? price - oraclePrice : oraclePrice - price;

  // Return the maximum of the naive transfer and the adjusted transfer amount
  return Math.max((oraclePrice * size) / targetLeverage + priceDiff * size, naiveTransferAmount);
}
