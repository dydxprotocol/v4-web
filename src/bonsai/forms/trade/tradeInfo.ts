import { calculateEffectiveSelectedLeverage } from '@/bonsai/calculators/markets';
import { calculateEffectiveMarketImfFromSelectedLeverage } from '@/bonsai/calculators/subaccount';
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

import { CURRENT_SURGE_REWARDS_DETAILS } from '@/hooks/rewards/util';

import { assertNever } from '@/lib/assertNever';
import { calc, mapIfPresent } from '@/lib/do';
import {
  AttemptBigNumber,
  AttemptNumber,
  BIG_NUMBERS,
  clampBn,
  MaybeBigNumber,
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
const MAX_ALLOCATION_BUFFER_CROSS = 0.98;
const MAX_ALLOCATION_BUFFER_ISOLATED = 0.95;
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

  return calc((): TradeSummary => {
    switch (trade.type) {
      case TradeFormType.MARKET:
        return calc((): TradeSummary => {
          const calculatedMaxTrade = getMaxCrossMarketOrderSizeSummary(
            trade,
            baseAccount,
            accountData,
            // we force simulate against parent subaccount regardless of actual subaccount we're using
            accountData.rawParentSubaccountData?.parentSubaccount ?? 0
          );
          const calculatedMaxUsdc = mapIfPresent(
            calculatedMaxTrade?.usdcSize,
            calculatedMaxTrade?.totalFees,
            (a, b) => a + b
          );

          const calculated = calculateMarketOrder(
            trade,
            baseAccount,
            accountData,
            subaccountToUse,
            calculatedMaxUsdc
          );
          const orderbookBase = accountData.currentTradeMarketOrderbook;

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
              calculated.marketOrder?.totalFees ?? 0,
              subaccountToUse,
              accountData.rawParentSubaccountData?.parentSubaccount,
              baseAccount?.position,
              accountData.currentTradeMarketSummary,
              accountData.rawSelectedMarketLeverages
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
          const calculated = calculateMarketOrder(
            trade,
            baseAccount,
            accountData,
            subaccountToUse,
            undefined
          );
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
          const totalFees = calculateTradeFeeAfterDiscounts(
            accountData,
            mapIfPresent(usdcSize, (u) => u * feeRate)
          );

          const isPositionClosed =
            mapIfPresent(
              size,
              baseAccount?.position?.unsignedSize.toNumber(),
              AttemptNumber(accountData.currentTradeMarketSummary?.stepSize),
              (orderSize, positionSize, stepSize) =>
                Math.abs(orderSize - positionSize) < stepSize / 2
            ) ?? false;

          const inputSummary: TradeInputSummary = {
            size: {
              size,
              usdcSize,
              // not supported
              allocationPercent: undefined,
            },
            averageFillPrice: price,
            worstFillPrice: price,
          };

          const total = calculateOrderTotal(usdcSize, totalFees, trade.side);

          return {
            indexSlippage: 0,
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
              inputSummary.size?.size ?? 0,
              price ?? 0,
              totalFees ?? 0,
              subaccountToUse,
              accountData.rawParentSubaccountData?.parentSubaccount,
              baseAccount?.position,
              accountData.currentTradeMarketSummary,
              accountData.rawSelectedMarketLeverages
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
            trade.side,
            trade.limitPrice,
            trade.reduceOnly,
            AttemptNumber(accountData.currentTradeMarketSummary?.stepSize),
            baseAccount,
            accountData,
            subaccountToUse
          );

          const totalFees = calculateTradeFeeAfterDiscounts(
            accountData,
            mapIfPresent(feeRate, inputSummary.size?.usdcSize, (fee, usdc) => fee * usdc)
          );

          return {
            subaccountNumber: subaccountToUse,
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
              totalFees ?? 0,
              subaccountToUse,
              accountData.rawParentSubaccountData?.parentSubaccount,
              baseAccount?.position,
              accountData.currentTradeMarketSummary,
              accountData.rawSelectedMarketLeverages
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
  subaccountNumber: number,
  maxTradeUsdc: number | undefined
): {
  marketOrder: TradeInputMarketOrder | undefined;
  summary: TradeInputSummary | undefined;
} {
  const marketOrder = createMarketOrder(
    trade,
    baseAccount,
    accountData,
    subaccountNumber,
    maxTradeUsdc
  );
  const isIsolated =
    subaccountNumber !== (accountData.rawParentSubaccountData?.parentSubaccount ?? 0);

  return {
    marketOrder,
    summary: {
      averageFillPrice: marketOrder?.averagePrice,
      worstFillPrice: marketOrder?.worstPrice,
      size: {
        size: marketOrder?.size,
        usdcSize: marketOrder?.usdcSize,
        allocationPercent: calc(() => {
          const isDecreasingOrFlipping =
            baseAccount?.position != null &&
            ((trade.side === OrderSide.BUY &&
              baseAccount.position.side === IndexerPositionSide.SHORT) ||
              (trade.side === OrderSide.SELL &&
                baseAccount.position.side === IndexerPositionSide.LONG));
          const isReduceOnly = !!trade.reduceOnly;

          if (isReduceOnly && isDecreasingOrFlipping) {
            // Case 1: reversal of size-based calculation
            return mapIfPresent(
              marketOrder?.size,
              baseAccount.position?.unsignedSize.toNumber(),
              (size, positionSize) => size / positionSize
            );
          }
          // Case 2: reversal of usdc-based calculation
          return mapIfPresent(
            marketOrder?.usdcSize,
            marketOrder?.totalFees,
            maxTradeUsdc,
            (sizeUsdc, fees, maxTotal) =>
              (sizeUsdc + fees) /
              (maxTotal *
                (isIsolated ? MAX_ALLOCATION_BUFFER_ISOLATED : MAX_ALLOCATION_BUFFER_CROSS))
          );
        }),
      },
    },
  };
}

type SizeTarget = {
  target: BigNumber;
  type: 'size' | 'usdc' | 'maximum';
};

function getMaxCrossMarketOrderSizeSummary(
  trade: TradeForm,
  baseAccount: TradeAccountDetails | undefined,
  accountData: TradeFormInputData,
  subaccountNumber: number
) {
  const result = createMarketOrder(
    trade,
    baseAccount,
    accountData,
    subaccountNumber,
    undefined,
    true
  );
  return result;
}

function createMarketOrder(
  trade: TradeForm,
  baseAccount: TradeAccountDetails | undefined,
  accountData: TradeFormInputData,
  subaccountNumber: number,
  maxTradeUsdc: number | undefined,
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
      ? calculateEffectiveSizeTarget(
          trade.size,
          trade,
          subaccountNumber,
          baseAccount,
          accountData,
          maxTradeUsdc
        )
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
    mapIfPresent(
      accountData.currentTradeMarketSummary?.ticker,
      AttemptBigNumber(accountData.currentTradeMarketSummary?.effectiveInitialMarginFraction),
      AttemptBigNumber(accountData.currentTradeMarketSummary?.initialMarginFraction),
      (ticker, effectiveImf, imf) => {
        return calculateEffectiveMarketImfFromSelectedLeverage({
          rawSelectedLeverage: accountData.rawSelectedMarketLeverages[ticker],
          effectiveInitialMarginFraction: MaybeBigNumber(effectiveImf),
          initialMarginFraction: MaybeBigNumber(imf),
        }).adjustedImfFromSelectedLeverage.toNumber();
      }
    ),
    trade.side,
    (oraclePrice, equity, freeCollateral, stepSize, marketEffectiveImf, orderSide) =>
      simulateMarketOrder(
        effectiveSizeTarget,
        orderbook,
        accountData.userFeeStats.takerFeeRate ?? 0,
        accountData.currentTradeMarketSummary?.marketFeeDiscountMultiplier,
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
  marketDiscountMultiplier: number | undefined,
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
    subaccountEquity -
    subaccountFreeCollateral -
    (existingPosition?.initialRiskFromSelectedLeverage.toNumber() ?? 0);
  const orderbookRows: OrderbookUsage[] = [];
  let filled = false;

  const feeRateAfterMarketDiscount =
    marketDiscountMultiplier == null ? feeRate : feeRate * marketDiscountMultiplier;

  if (orderbook.length === 0) {
    return {
      orderbook: [],
      filled: false,
      size: 0,
      usdcSize: 0,
      totalFees: 0,
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
      oraclePrice * operationMultipler -
      rowPrice * feeRateAfterMarketDiscount -
      rowPrice * operationMultipler;

    if (effectiveSizeTarget.type === 'size') {
      sizeToTake = effectiveSizeTarget.target - totalSize;
    } else if (effectiveSizeTarget.type === 'usdc') {
      const maxSizeForRemainingUsdc =
        (effectiveSizeTarget.target - totalCost) / (rowPrice * (1 + feeRateAfterMarketDiscount));
      sizeToTake = maxSizeForRemainingUsdc;
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
      totalCost += sizeToTake * rowPrice + sizeToTake * rowPrice * feeRateAfterMarketDiscount;
      thisPositionValue += sizeToTake * operationMultipler * oraclePrice;
      equity +=
        // update to notional
        sizeToTake * operationMultipler * oraclePrice +
        // update to quote for cost
        sizeToTake * operationMultipler * -1 * rowPrice +
        // update to quote for fees
        sizeToTake * rowPrice * feeRateAfterMarketDiscount * -1;
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
    worstPrice: orderbookRows.at(-1)?.price,
    filled,
  };
}

export function calculateSubaccountToUseForTrade(
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

function calculateEffectiveSizeTarget(
  sizeInput: OrderSizeInput,
  trade: TradeForm,
  subaccountNumber: number,
  baseAccount: TradeAccountDetails | undefined,
  accountData: TradeFormInputData,
  maxTradeUsdc: number | undefined
): SizeTarget | undefined {
  const isIsolated =
    subaccountNumber !== (accountData.rawParentSubaccountData?.parentSubaccount ?? 0);

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
      // we do the same for isolated and cross, which is only an approximation due to transfer buffers
      // we also aren't accounting for fees properly
      const usdcTarget = MustBigNumber(maxTradeUsdc)
        .times(isIsolated ? MAX_ALLOCATION_BUFFER_ISOLATED : MAX_ALLOCATION_BUFFER_CROSS)
        .times(percent);

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
  });
}

function calculateLimitOrderInputSummary(
  size: OrderSizeInput | undefined,
  side: OrderSide | undefined,
  limitPrice: string | undefined,
  reduceOnly: boolean | undefined,
  marketStepSize: number | undefined,
  baseAccount: TradeAccountDetails | undefined,
  accountData: TradeFormInputData,
  subaccountToUse: number
): TradeInputSummary {
  const price = MustNumber(limitPrice);
  const targetLeverage = calc(() => {
    const effectiveImf = accountData.currentTradeMarketSummary?.effectiveInitialMarginFraction ?? 0;
    const marketMaxLeverage = 1 / (effectiveImf === 0 ? 1 : effectiveImf);
    const effectiveTargetLeverage = calculateEffectiveSelectedLeverage({
      userSelectedLeverage:
        accountData.currentTradeMarketSummary?.ticker != null
          ? accountData.rawSelectedMarketLeverages[accountData.currentTradeMarketSummary.ticker]
          : undefined,
      initialMarginFraction: accountData.currentTradeMarketSummary?.initialMarginFraction,
    });
    return Math.min(effectiveTargetLeverage, marketMaxLeverage);
  });
  const isDecreasingOrFlipping =
    baseAccount?.position != null &&
    ((side === OrderSide.BUY && baseAccount.position.side === IndexerPositionSide.SHORT) ||
      (side === OrderSide.SELL && baseAccount.position.side === IndexerPositionSide.LONG));

  const isIsolatedOrder =
    subaccountToUse !== (accountData.rawParentSubaccountData?.parentSubaccount ?? 0);
  const transferBufferDivisor = isIsolatedOrder ? 1 + FLAT_TRANSFER_BUFFER : 1;

  const effectiveSize = toStepSize(
    size != null
      ? OrderSizeInputs.match(size, {
          AVAILABLE_PERCENT: ({ value }) => {
            const percent = AttemptBigNumber(value);
            if (percent == null) {
              return 0.0;
            }

            if (reduceOnly && isDecreasingOrFlipping) {
              return baseAccount.position?.unsignedSize.times(percent).toNumber() ?? 0.0;
            }
            // we do the same for isolated and cross, which is only an approximation
            // we also aren't accounting for fees properly
            const crossFree = baseAccount?.account?.freeCollateral.toNumber() ?? 0;
            const maxOrderUsdc = (crossFree * targetLeverage) / transferBufferDivisor;
            const maxSpendSize = divideIfNonZeroElse(MustNumber(maxOrderUsdc), price, 0);
            if (isDecreasingOrFlipping) {
              return percent.times(
                maxSpendSize + (baseAccount.position?.unsignedSize.toNumber() ?? 0)
              );
            }
            return percent.times(maxSpendSize);
          },
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
      size: effectiveSize,
      usdcSize: effectiveSize * price,
      allocationPercent: calc(() => {
        if (reduceOnly && isDecreasingOrFlipping) {
          return mapIfPresent(
            baseAccount.position?.unsignedSize.toNumber(),
            (positionSize) => effectiveSize / positionSize
          );
        }

        const crossFree = baseAccount?.account?.freeCollateral.toNumber() ?? 0;
        const maxOrderUsdc = (crossFree * targetLeverage) / transferBufferDivisor;
        const maxSpendSize = divideIfNonZeroElse(MustNumber(maxOrderUsdc), price, 0);

        if (isDecreasingOrFlipping) {
          const denominator = maxSpendSize + (baseAccount.position?.unsignedSize.toNumber() ?? 0);
          return denominator !== 0 ? effectiveSize / denominator : undefined;
        }

        return maxSpendSize !== 0 ? effectiveSize / maxSpendSize : undefined;
      }),
    },
  };
}

function divideIfNonZeroElse(numerator: number, denominator: number, backup: number) {
  return denominator !== 0 ? numerator / denominator : backup;
}

const RATE_LOST_TO_REV_SHARES = 0.4; // megavault and ops
const MAX_POSSIBLE_TAKER_REV_SHARE = 0.5; // affiliates

const IS_FEE_REBATE_TIME: boolean = true;
const FEE_REBATE_PERCENT = CURRENT_SURGE_REWARDS_DETAILS.rebateFraction;

function calculateTakerReward(
  usdcSize: number | undefined,
  fee: number | undefined,
  rewardsParams: RewardParamsSummary | undefined,
  feeTiers: FeeTierSummary[] | undefined
): number | undefined {
  const tokenPrice = rewardsParams?.tokenPrice;
  if (IS_FEE_REBATE_TIME) {
    return fee != null && tokenPrice != null && tokenPrice > 0
      ? (fee * FEE_REBATE_PERCENT) / tokenPrice
      : undefined;
  }
  const feeMultiplier = rewardsParams?.feeMultiplier;
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
  const tokenPrice = rewardsParams?.tokenPrice;
  if (IS_FEE_REBATE_TIME) {
    return fee != null && tokenPrice != null && tokenPrice > 0
      ? (fee * FEE_REBATE_PERCENT) / tokenPrice
      : undefined;
  }
  const feeMultiplier = rewardsParams?.feeMultiplier;

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
  tradeFees: number,
  subaccountToUse: number,
  parentSubaccount: number | undefined,
  existingPosition: SubaccountPosition | undefined,
  tradeMarketSummary: PerpetualMarketSummary | undefined,
  rawSelectedMarketLeverages: { [marketId: string]: number }
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
      tradeFees,
      existingPosition,
      tradeMarketSummary,
      rawSelectedMarketLeverages
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
  const isIncreasingOrCrossing =
    getIncreasingPositionAmount(trade, tradeSize, existingPosition) > 0;
  return isIsolatedOrder && isIncreasingOrCrossing && !isReduceOnly;
}

function calculateIsolatedMarginTransferAmount(
  trade: TradeForm,
  tradeSize: number,
  tradePrice: number,
  tradeFees: number,
  existingPosition: SubaccountPosition | undefined,
  tradeMarketSummary: PerpetualMarketSummary | undefined,
  rawSelectedMarketLeverages: { [marketId: string]: number }
): number | undefined {
  const oraclePrice = AttemptNumber(tradeMarketSummary?.oraclePrice);
  const side = trade.side;
  if (side == null || oraclePrice == null) {
    return undefined;
  }

  const effectiveImf = tradeMarketSummary?.effectiveInitialMarginFraction ?? 0;
  const marketMaxLeverage = 1 / (effectiveImf === 0 ? 1 : effectiveImf);
  const effectiveTargetLeverage = calculateEffectiveSelectedLeverage({
    userSelectedLeverage:
      tradeMarketSummary?.ticker != null
        ? rawSelectedMarketLeverages[tradeMarketSummary.ticker]
        : undefined,
    initialMarginFraction: tradeMarketSummary?.initialMarginFraction,
  });
  const targetLeverage =
    AttemptNumber(effectiveTargetLeverage) ?? Math.min(DEFAULT_TARGET_LEVERAGE, marketMaxLeverage);

  const positionIncreasingAmount = getIncreasingPositionAmount(trade, tradeSize, existingPosition);

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
    tradeFees,
    marketMaxLeverage,
    tradeSize,
    positionIncreasingAmount,
    trade.type === TradeFormType.LIMIT || trade.type === TradeFormType.TRIGGER_LIMIT
  );
}

function getIncreasingPositionAmount(
  trade: TradeForm,
  tradeSize: number,
  existingPosition: SubaccountPosition | undefined
): number {
  const side = trade.side;

  if (side == null) {
    return 0;
  }
  if (existingPosition == null) {
    return tradeSize;
  }

  const positionSide = existingPosition.side;
  const positionSize = existingPosition.unsignedSize.toNumber();

  const isSameSide =
    (side === OrderSide.BUY && positionSide === IndexerPositionSide.LONG) ||
    (side === OrderSide.SELL && positionSide === IndexerPositionSide.SHORT);

  if (isSameSide) {
    return tradeSize;
  }
  return Math.max(0, tradeSize - positionSize);
}

function calculateIsolatedMarginTransferAmountFromValues(
  targetLeverage: number,
  side: OrderSide,
  estOraclePriceAtExecution: number,
  price: number,
  fees: number,
  maxMarketLeverage: number,
  orderSize: number,
  positionIncreasingSize: number,
  ignoreSlippageAndOracleDrift: boolean
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
    fees,
    estOraclePriceAtExecution,
    side,
    orderSize,
    positionIncreasingSize,
    adjustedTargetLeverage,
    ignoreSlippageAndOracleDrift
  );
  if (amount <= 0) {
    return undefined;
  }
  return amount;
}

// for MARKET-ish orders
const SLIPPAGE_BUFFER = 0.005;
const ORACLE_BUFFER = 0.005;

// for LIMIT-ish orders
const FLAT_TRANSFER_BUFFER = 0.01;

function getTransferAmountFromTargetLeverage(
  price: number,
  fees: number,
  estOraclePriceAtExecution: number,
  side: OrderSide,
  orderSize: number,
  increasingSize: number,
  targetLeverage: number,
  ignoreSlippageAndOracleDrift: boolean
): number {
  if (targetLeverage === 0 || increasingSize <= 0 || orderSize <= 0) {
    return 0;
  }

  const slippageBuffer = ignoreSlippageAndOracleDrift ? 0 : SLIPPAGE_BUFFER;
  const oracleBuffer = ignoreSlippageAndOracleDrift ? 0 : ORACLE_BUFFER;

  const IMF = 1 / targetLeverage;

  // maximize margin requirement by adding buffer to oracle
  const margin = increasingSize * (estOraclePriceAtExecution * (1 + oracleBuffer)) * IMF;
  // maximize fees by adding buffer to fill price
  const feesAtFillPriceWithBuffer = fees * (1 + slippageBuffer);

  // maximize slippage in each case by adding/removing buffer from actual expectations
  const slippageLoss =
    side === OrderSide.BUY
      ? orderSize * (price * (1 + slippageBuffer) - estOraclePriceAtExecution * (1 - oracleBuffer))
      : orderSize * (estOraclePriceAtExecution * (1 + oracleBuffer) - price * (1 - slippageBuffer));

  return (
    (margin + feesAtFillPriceWithBuffer + slippageLoss) *
    (ignoreSlippageAndOracleDrift ? 1 + FLAT_TRANSFER_BUFFER : 1)
  );
}

function calculateTradeFeeAfterDiscounts(
  accountData: TradeFormInputData,
  feeUsdc: number | undefined
) {
  const marketDiscountMultiplier =
    accountData.currentTradeMarketSummary?.marketFeeDiscountMultiplier;

  if (feeUsdc == null) return undefined;

  const feeAfterMarketDiscount =
    marketDiscountMultiplier != null ? feeUsdc * marketDiscountMultiplier : feeUsdc;
  return feeAfterMarketDiscount;
}
