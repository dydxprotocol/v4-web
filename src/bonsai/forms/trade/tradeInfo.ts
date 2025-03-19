import { CanvasOrderbookLine } from '@/bonsai/types/orderbookTypes';
import { ParentSubaccountDataBase } from '@/bonsai/types/rawTypes';
import { SubaccountOrder, SubaccountPosition } from '@/bonsai/types/summaryTypes';
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
} from '@/lib/numbers';

import {
  MarginMode,
  OrderSide,
  OrderSizeInput,
  OrderSizeInputs,
  TradeAccountDetails,
  TradeForm,
  TradeFormFieldStates,
  TradeFormInputData,
  TradeFormType,
  TradeInputSummary,
  TradeSummary,
} from './types';

const MARKET_ORDER_MAX_SLIPPAGE = 0.05;

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

  const summaryBase = calc(() => {
    switch (trade.type) {
      case TradeFormType.MARKET:
        return calc(() => {
          const calculated = calculateMarketOrder(trade, baseAccount, accountData);
          const orderbookBase = accountData.currentTradeMarketOrderbook;
          return {
            inputSummary: calculated.summary,
            subaccountNumber: subaccountToUse,
            transferToSubaccountAmount: '',
            payloadPrice: mapIfPresent(calculated.marketOrder?.averagePrice, (price) => {
              if (trade.side == null || trade.side === OrderSide.BUY) {
                return price * (1 + MARKET_ORDER_MAX_SLIPPAGE);
              }
              return price * (1 - MARKET_ORDER_MAX_SLIPPAGE);
            }),
            minimumSignedLeverage: leverageLimits.minLeverage,
            maximumSignedLeverage: leverageLimits.maxLeverage,
            slippage: mapIfPresent(
              calculated.marketOrder?.worstPrice,
              orderbookBase?.midPrice,
              (worstPrice, midMarketPrice) => {
                return midMarketPrice <= 0
                  ? 0
                  : Math.abs(worstPrice - midMarketPrice) / midMarketPrice;
              }
            ),
            fee: calculated.marketOrder?.totalFees,
            total: mapIfPresent(
              calculated.marketOrder?.totalFees,
              calculated.marketOrder?.usdcSize,
              (fees, size) => -1 * fees + size * (trade.side === OrderSide.SELL ? 1 : -1)
            ),
            reward: undefined,
            filled: calculated.marketOrder?.filled,
            isPositionClosed:
              mapIfPresent(
                calculated.marketOrder?.size,
                baseAccount?.position?.unsignedSize.toNumber(),
                AttemptNumber(accountData.currentTradeMarketSummary?.stepSize),
                (filled, size, stepSize) => Math.abs(filled - size) < stepSize / 2
              ) ?? false,
            indexSlippage: mapIfPresent(
              calculated.marketOrder?.worstPrice,
              AttemptNumber(accountData.currentTradeMarketSummary?.oraclePrice),
              (worstPrice, oraclePrice) => {
                // todo this is different from abacus, we should double check where this is used
                return oraclePrice <= 0 ? 0 : Math.abs(worstPrice - oraclePrice) / oraclePrice;
              }
            ),
            feeRate: accountData.userFeeStats.takerFeeRate ?? 0,
          };
        });
      case TradeFormType.STOP_MARKET:
      case TradeFormType.TAKE_PROFIT_MARKET:
        return calc(() => {
          const calculated = calculateMarketOrder();
          return {} as TradeSummary;
        });
      case TradeFormType.LIMIT:
      case TradeFormType.STOP_LIMIT:
      case TradeFormType.TAKE_PROFIT_LIMIT:
        return calc(() => {
          const calculated = calculateMarketOrder();
          return {} as TradeSummary;
        });
      default:
        assertNever(trade.type);
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
    baseAccount?.account?.equity.toNumber(),
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
      const denominator =
        operationMultipler * oraclePrice * (targetLeverage - 1) -
        targetLeverage * feeRate +
        targetLeverage * operationMultipler * rowPrice;
      const numerator = thisPositionValue - targetLeverage * equity;
      const maxSizeAtThisPrice = denominator === 0 ? 0 : numerator / denominator;
      sizeToTake = maxSizeAtThisPrice;
    } else {
      assertNever(effectiveSizeTarget.type);
    }

    sizeToTake = clampBn(MustBigNumber(sizeToTake), BIG_NUMBERS.ZERO, MustBigNumber(rowSize))
      .div(marketStepSize)
      .decimalPlaces(0, BigNumber.ROUND_DOWN)
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
) {
  //   const byExistingPosition = baseAccount?.position?.subaccountNumber;
  if (existingPositionSubaccount != null) {
    return existingPositionSubaccount;
  }
  if (marginMode == null || marginMode === MarginMode.CROSS) {
    return rawParentSubaccountData?.parentSubaccount;
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
  const isPositionLong = hasPosition && currentPosition?.signedSize.gt(BIG_NUMBERS.ZERO);
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
      return isOrderBuy ? marketMaxLeverage : marketMaxLeverage.times(-1);
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
      // we don't support target leverage for isolated positions, makes no sense since we're transferring collateral with trade
      if (trade.marginMode === MarginMode.ISOLATED) {
        return undefined;
      }
      const isDecreasingOrFlipping =
        baseAccount?.position != null &&
        ((trade.side === OrderSide.BUY &&
          baseAccount.position.side === IndexerPositionSide.SHORT) ||
          (trade.side === OrderSide.SELL &&
            baseAccount.position.side === IndexerPositionSide.LONG));
      const isReduceOnly = !!trade.reduceOnly;
      const parentSubaccountFreeCollateral =
        baseAccount?.account?.freeCollateral ?? BIG_NUMBERS.ZERO;
      if (isReduceOnly && isDecreasingOrFlipping && baseAccount.position != null) {
        const target = baseAccount.position.unsignedSize.times(percent);
        return {
          target,
          type: 'size' as const,
        };
      }
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
