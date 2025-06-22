import { getSimpleOrderStatus } from '@/bonsai/calculators/orders';
import {
  ErrorFormat,
  ErrorType,
  simpleValidationError,
  ValidationError,
} from '@/bonsai/lib/validationErrors';
import { OrderFlags, OrderStatus } from '@/bonsai/types/summaryTypes';
import { OrderType } from '@dydxprotocol/v4-client-js';

import { STRING_KEYS } from '@/constants/localization';
import { timeUnits } from '@/constants/time';
import {
  IndexerOrderSide,
  IndexerOrderType,
  IndexerPerpetualMarketStatus,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';

import { assertNever } from '@/lib/assertNever';
import { mapIfPresent } from '@/lib/do';
import { AttemptNumber } from '@/lib/numbers';

import { validateTriggerOrder } from '../triggers/errors';
import { TriggerOrderState, TriggerPriceInputType } from '../triggers/types';
import { getGoodTilInSeconds } from './summary';
import {
  ExecutionType,
  MarginMode,
  OrderSide,
  TimeInForce,
  TradeForm,
  TradeFormInputData,
  TradeFormSummary,
  TradeFormType,
} from './types';

const marketOrderErrorSlippage = 0.1;
const marketOrderWarningSlippage = 0.05;
const isolatedLimitOrderMinimumEquity = 20.0;

export function calculateTradeFormErrors(
  state: TradeForm,
  inputData: TradeFormInputData,
  summary: TradeFormSummary
): ValidationError[] {
  const errors: ValidationError[] = [];
  errors.push(...validateMarket(inputData, summary));
  errors.push(...validateNonMarketInputData(inputData, summary));
  errors.push(...validateFieldsBasic(inputData, summary));
  errors.push(...validateLimitPriceForConditionalLimitOrders(summary));
  errors.push(...validateAdvancedTradeConditions(inputData, summary));
  errors.push(...validateTriggerPrices(inputData, summary));
  errors.push(...validatePositionState(summary));
  errors.push(...validateAccountState(inputData, summary));
  errors.push(...validateRestrictions(inputData, summary));
  errors.push(...validateTradeFormSummaryFields(summary));
  errors.push(...validateBracketOrders(inputData, summary));
  errors.push(...validateEquityTiers(inputData, summary));

  return errors;
}

function validateMarket(
  inputData: TradeFormInputData,
  summary: TradeFormSummary
): ValidationError[] {
  const errors: ValidationError[] = [];
  const state = summary.effectiveTrade;

  if (state.marketId == null || state.marketId.trim().length === 0) {
    errors.push(
      simpleValidationError({
        code: 'REQUIRED_MARKET',
      })
    );
    return errors;
  }

  if (
    inputData.currentTradeMarket == null ||
    inputData.currentTradeMarket.ticker !== state.marketId ||
    !inputData.currentTradeMarketOpenOrders.every((o) => o.marketId === state.marketId) ||
    inputData.currentTradeMarketSummary == null ||
    inputData.currentTradeMarketSummary.ticker !== state.marketId
  ) {
    errors.push(
      simpleValidationError({
        code: 'MISSING_INPUT_DATA_OR_NOT_MATCHING',
      })
    );
  }

  return errors;
}

function validateNonMarketInputData(
  inputData: TradeFormInputData,
  summary: TradeFormSummary
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (inputData.rawParentSubaccountData == null) {
    errors.push(
      simpleValidationError({
        code: 'REQUIRED_SUBACCOUNT',
      })
    );
    return errors;
  }

  if (inputData.rawRelevantMarkets == null) {
    errors.push(
      simpleValidationError({
        code: 'REQUIRED_RELEVANT_MARKETS',
      })
    );
  }

  if (inputData.userFeeStats.makerFeeRate == null || inputData.userFeeStats.takerFeeRate == null) {
    errors.push(
      simpleValidationError({
        code: 'REQUIRED_RELEVANT_MARKETS',
        type: ErrorType.warning,
        textKey: STRING_KEYS.TAKER_FEE_INVALID,
      })
    );
  }

  const state = summary.effectiveTrade;
  if (
    inputData.currentTradeMarketOrderbook == null &&
    (state.type === TradeFormType.MARKET || state.type === TradeFormType.TRIGGER_MARKET)
  ) {
    errors.push(
      simpleValidationError({
        // todo probably need a message
        code: 'REQUIRED_ORDERBOOK',
      })
    );
  }
  // not validating since they only affect predicted reward and that's fine to be missing:
  //   feeTiers: FeeTierSummary[] | undefined;
  //   rewardParams: RewardParamsSummary;

  return errors;
}

function validateFieldsBasic(
  inputData: TradeFormInputData,
  summary: TradeFormSummary
): ValidationError[] {
  const errors: ValidationError[] = [];
  const options = summary.options;
  const state = summary.effectiveTrade;
  const info = summary.tradeInfo;

  if (options.needsLimitPrice) {
    const limitPrice = AttemptNumber(info.payloadPrice) ?? 0;
    if (limitPrice <= 0) {
      errors.push(
        simpleValidationError({
          code: 'REQUIRED_LIMIT_PRICE',
          type: ErrorType.error,
          fields: ['limitPrice'],
          titleKey: STRING_KEYS.ENTER_LIMIT_PRICE,
        })
      );
    }
  }

  if (options.needsSize) {
    const sizeValue = AttemptNumber(info.inputSummary.size?.size) ?? 0;
    const sizeIsTyped = (state.size?.value.value.length ?? 0) > 0;
    const marketMinSize = AttemptNumber(inputData.currentTradeMarketSummary?.stepSize);
    if (sizeIsTyped && marketMinSize != null && sizeValue < marketMinSize) {
      errors.push(
        simpleValidationError({
          code: 'ORDER_SIZE_BELOW_MIN_SIZE',
          type: ErrorType.error,
          fields: ['size'],
          titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
          textKey: STRING_KEYS.ORDER_SIZE_BELOW_MIN_SIZE,
          titleParams: {
            MIN_SIZE: {
              value: marketMinSize,
              format: ErrorFormat.Size,
              decimals: inputData.currentTradeMarketSummary?.stepSizeDecimals ?? 0,
            },
            SYMBOL: {
              value: inputData.currentTradeMarketSummary?.displayableAsset ?? '',
              format: ErrorFormat.String,
            },
          },
        })
      );
    }

    if (sizeValue <= 0) {
      errors.push(
        simpleValidationError({
          code: 'REQUIRED_SIZE',
          type: ErrorType.error,
          fields: ['size'],
          titleKey: STRING_KEYS.ENTER_AMOUNT,
        })
      );
    }
  }

  if (options.needsTriggerPrice) {
    const triggerPrice = AttemptNumber(state.triggerPrice) ?? 0;
    if (triggerPrice <= 0) {
      errors.push(
        simpleValidationError({
          code: 'REQUIRED_TRIGGER_PRICE',
          type: ErrorType.error,
          fields: ['triggerPrice'],
          titleKey: STRING_KEYS.ENTER_TRIGGER_PRICE,
        })
      );
    }
  }

  if (options.needsTimeInForce && options.timeInForceOptions.length > 0) {
    if (state.timeInForce == null) {
      errors.push(
        simpleValidationError({
          code: 'REQUIRED_TIME_IN_FORCE',
          type: ErrorType.error,
          fields: ['timeInForce'],
          titleKey: STRING_KEYS.ENTER_TIME_IN_FORCE,
        })
      );
    }
  }

  if (options.needsGoodTil) {
    if (state.goodTil == null || (AttemptNumber(state.goodTil.duration) ?? 0) <= 0) {
      errors.push(
        simpleValidationError({
          code: 'REQUIRED_GOOD_UNTIL',
          type: ErrorType.error,
          fields: ['goodTil'],
          titleKey: STRING_KEYS.ENTER_GOOD_UNTIL,
        })
      );
    }
    const goodTilInSeconds = AttemptNumber(getGoodTilInSeconds(state.goodTil));
    if (
      goodTilInSeconds == null ||
      goodTilInSeconds <= 0 ||
      goodTilInSeconds > (90 * timeUnits.day) / timeUnits.second
    ) {
      errors.push(
        simpleValidationError({
          code: 'INVALID_GOOD_TIL',
          type: ErrorType.error,
          fields: ['goodTil'],
          titleKey: STRING_KEYS.MODIFY_GOOD_TIL,
          textKey:
            (goodTilInSeconds ?? 0) > (90 * timeUnits.day) / timeUnits.second
              ? STRING_KEYS.INVALID_GOOD_TIL_MAX_90_DAYS
              : STRING_KEYS.MODIFY_GOOD_TIL,
        })
      );
    }
  }

  if (options.needsExecution && options.executionOptions.length > 0) {
    if (state.execution == null) {
      errors.push(
        simpleValidationError({
          code: 'REQUIRED_EXECUTION',
          type: ErrorType.error,
          fields: ['execution'],
          titleKey: STRING_KEYS.ENTER_EXECUTION,
        })
      );
    }
  }

  if (state.side == null) {
    errors.push(
      simpleValidationError({
        code: 'REQUIRED_SIDE',
        type: ErrorType.error,
      })
    );
  }

  if (options.needsMarginMode && state.marginMode == null) {
    errors.push(
      simpleValidationError({
        code: 'REQUIRED_MARGIN_MODE',
        type: ErrorType.error,
      })
    );
  }

  if (options.needsTargetLeverage) {
    const targetLeverage = AttemptNumber(state.targetLeverage) ?? 0;
    if (targetLeverage <= 0) {
      errors.push(
        simpleValidationError({
          code: 'REQUIRED_TARGET_LEVERAGE',
          type: ErrorType.error,
          fields: ['targetLeverage'],
          titleKey: STRING_KEYS.MODIFY_TARGET_LEVERAGE,
        })
      );
    }
  }

  return errors;
}

function validateLimitPriceForConditionalLimitOrders(summary: TradeFormSummary): ValidationError[] {
  const errors: ValidationError[] = [];
  const state = summary.effectiveTrade;

  // Only validate for StopLimit and TakeProfitLimit orders
  if (state.type !== TradeFormType.TRIGGER_LIMIT && state.type !== TradeFormType.TRIGGER_MARKET) {
    return errors;
  }

  // Only validate for IOC execution
  const isError = state.execution === ExecutionType.IOC;

  // Need both side, limitPrice and triggerPrice to validate
  if (!state.side || !state.limitPrice || !state.triggerPrice) {
    return errors;
  }

  const limitPrice = AttemptNumber(state.limitPrice);
  const triggerPrice = AttemptNumber(state.triggerPrice);

  if (limitPrice == null || triggerPrice == null) {
    return errors;
  }

  // Buy orders: limit price must be above trigger price
  if (state.side === OrderSide.BUY && limitPrice < triggerPrice) {
    errors.push(
      simpleValidationError({
        code: 'LIMIT_MUST_ABOVE_TRIGGER_PRICE',
        type: isError ? ErrorType.error : ErrorType.warning,
        fields: ['price.triggerPrice'],
        titleKey: STRING_KEYS.MODIFY_TRIGGER_PRICE,
        textKey: STRING_KEYS.LIMIT_MUST_ABOVE_TRIGGER_PRICE,
      })
    );
    // Sell orders: limit price must be below trigger price
  } else if (state.side === OrderSide.SELL && limitPrice > triggerPrice) {
    errors.push(
      simpleValidationError({
        code: 'LIMIT_MUST_BELOW_TRIGGER_PRICE',
        type: isError ? ErrorType.error : ErrorType.warning,
        fields: ['price.triggerPrice'],
        titleKey: STRING_KEYS.MODIFY_TRIGGER_PRICE,
        textKey: STRING_KEYS.LIMIT_MUST_BELOW_TRIGGER_PRICE,
      })
    );
  }

  return errors;
}

function validateAdvancedTradeConditions(
  inputData: TradeFormInputData,
  summary: TradeFormSummary
): ValidationError[] {
  const errors: ValidationError[] = [];

  const state = summary.effectiveTrade;

  // For a market order, validate liquidity and slippage
  if (state.type === TradeFormType.MARKET) {
    const liquidityError = validateLiquidity(summary);
    if (liquidityError) {
      errors.push(liquidityError);
    }

    const slippageError = validateOrderbookOrIndexSlippage(summary);
    if (slippageError) {
      errors.push(slippageError);
    }
    // For limit orders, validate isolated margin requirements
  } else if (
    state.type === TradeFormType.LIMIT ||
    state.type === TradeFormType.TRIGGER_LIMIT ||
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    state.type === TradeFormType.TRIGGER_MARKET
  ) {
    // todo this should probably check for limit order if the execution is IOC
    const isolatedMarginError = validateIsolatedMarginMinSize(summary);
    if (isolatedMarginError) {
      errors.push(isolatedMarginError);
    }
  } else {
    assertNever(state.type);
  }

  return errors;
}

function validateLiquidity(summary: TradeFormSummary): ValidationError | undefined {
  if (!summary.tradeInfo.filled) {
    return simpleValidationError({
      code: 'MARKET_ORDER_NOT_ENOUGH_LIQUIDITY',
      type: ErrorType.error,
      fields: ['size'],
      titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
      textKey: STRING_KEYS.MARKET_ORDER_NOT_ENOUGH_LIQUIDITY,
    });
  }

  if (summary.tradeInfo.slippage == null) {
    return simpleValidationError({
      code: 'MARKET_ORDER_ONE_SIDED_LIQUIDITY',
      type: ErrorType.error,
      fields: ['size'],
      titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
      textKey: STRING_KEYS.MARKET_ORDER_ONE_SIDED_LIQUIDITY,
    });
  }

  return undefined;
}

function validateIsolatedMarginMinSize(summary: TradeFormSummary): ValidationError | undefined {
  const state = summary.effectiveTrade;

  // Only check for isolated margin mode
  if (state.marginMode !== MarginMode.ISOLATED) {
    return undefined;
  }

  const subaccountBefore = summary.accountDetailsBefore?.account;
  const subaccountAfter = summary.accountDetailsAfter?.account;

  if (!subaccountBefore || !subaccountAfter) {
    return undefined;
  }

  if (
    summary.accountDetailsBefore?.position?.marginValueInitial.gte(isolatedLimitOrderMinimumEquity)
  ) {
    return undefined;
  }

  const currentFreeCollateral = subaccountBefore.freeCollateral.toNumber();
  const postFreeCollateral = subaccountAfter.freeCollateral.toNumber();
  const orderEquity = currentFreeCollateral - postFreeCollateral;
  const isReducingPosition = orderEquity <= 0;

  // Check if the order meets minimum equity requirements
  if (
    postFreeCollateral >= 0 &&
    !isReducingPosition &&
    orderEquity < isolatedLimitOrderMinimumEquity
  ) {
    return simpleValidationError({
      code: 'ISOLATED_MARGIN_LIMIT_ORDER_BELOW_MINIMUM',
      type: ErrorType.error,
      fields: ['size'],
      titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
      textKey: STRING_KEYS.ISOLATED_MARGIN_LIMIT_ORDER_BELOW_MINIMUM,
      textParams: {
        MIN_VALUE: {
          value: isolatedLimitOrderMinimumEquity,
          format: ErrorFormat.Price,
        },
      },
      learnMoreUrlKey: 'equityTiersLearnMore',
    });
  }

  return undefined;
}

function validateOrderbookOrIndexSlippage(summary: TradeFormSummary): ValidationError | undefined {
  // Missing orderbook slippage is due to one-sided liquidity (handled by validateLiquidity)
  const orderbookSlippage = summary.tradeInfo.slippage;
  if (orderbookSlippage == null) return undefined;

  const orderbookSlippageValue = Math.abs(orderbookSlippage);
  const indexSlippage = summary.tradeInfo.indexSlippage;

  let slippageType: 'ORDERBOOK' | 'INDEX_PRICE' = 'ORDERBOOK' as const;
  let minSlippageValue = orderbookSlippageValue;

  // Use the smaller slippage between orderbook and index if available
  if (indexSlippage != null && indexSlippage < orderbookSlippageValue) {
    slippageType = 'INDEX_PRICE';
    minSlippageValue = indexSlippage;
  }

  const textParams = {
    SLIPPAGE: {
      value: minSlippageValue,
      format: ErrorFormat.Percent,
    },
  };

  // Create appropriate error or warning based on slippage value
  if (minSlippageValue >= marketOrderErrorSlippage) {
    return simpleValidationError({
      code: `MARKET_ORDER_ERROR_${slippageType}_SLIPPAGE`,
      type: ErrorType.error,
      titleKey: STRING_KEYS.PLACE_LIMIT_ORDER,
      textKey: STRING_KEYS[`MARKET_ORDER_ERROR_${slippageType}_SLIPPAGE`],
      textParams,
    });
  }
  if (minSlippageValue >= marketOrderWarningSlippage) {
    return simpleValidationError({
      code: `MARKET_ORDER_WARNING_${slippageType}_SLIPPAGE`,
      type: ErrorType.warning,
      titleKey: STRING_KEYS.PLACE_LIMIT_ORDER,
      textKey: STRING_KEYS[`MARKET_ORDER_WARNING_${slippageType}_SLIPPAGE`],
      textParams,
    });
  }

  return undefined;
}

function validateTriggerPrices(
  inputData: TradeFormInputData,
  summary: TradeFormSummary
): ValidationError[] {
  const errors: ValidationError[] = [];
  const state = summary.effectiveTrade;

  // Only run validation for order types that need trigger prices
  if (!summary.options.needsTriggerPrice) {
    return errors;
  }

  const market = inputData.currentTradeMarketSummary;
  if (!market) {
    return errors;
  }

  const triggerPrice = AttemptNumber(state.triggerPrice);
  if (triggerPrice == null || triggerPrice <= 0) {
    return errors;
  }

  const oraclePrice = AttemptNumber(market.oraclePrice);
  if (oraclePrice == null) {
    errors.push(
      simpleValidationError({
        code: 'MISSING_ORACLE_PRICE',
        type: ErrorType.error,
      })
    );
    return errors;
  }

  // Get the type and side from the effective trade
  const { type, side } = state;
  if (side == null) {
    return errors;
  }

  // Validate against liquidation price for stop market orders
  const position = summary.accountDetailsBefore?.position;
  if (
    position != null &&
    (type === TradeFormType.TRIGGER_LIMIT || type === TradeFormType.TRIGGER_MARKET)
  ) {
    const isLong = position.side === IndexerPositionSide.LONG;
    const liquidationPrice = position.liquidationPrice?.toNumber();

    if (liquidationPrice != null && liquidationPrice > 0) {
      // For long positions with sell stop orders
      if (isLong && side === OrderSide.SELL && triggerPrice <= liquidationPrice) {
        errors.push(
          simpleValidationError({
            code: 'STOP_LOSS_TRIGGER_NEAR_LIQUIDATION',
            type: ErrorType.error,
            fields: ['triggerPrice'],
            titleKey: STRING_KEYS.MODIFY_TRIGGER_PRICE,
            textKey: STRING_KEYS.SELL_TRIGGER_TOO_CLOSE_TO_LIQUIDATION_PRICE_NO_LIMIT,
            textParams: {
              TRIGGER_PRICE_LIMIT: {
                value: liquidationPrice,
                format: ErrorFormat.Price,
                decimals: market.tickSizeDecimals,
              },
            },
          })
        );
      }
      // For short positions with buy stop orders
      else if (!isLong && side === OrderSide.BUY && triggerPrice >= liquidationPrice) {
        errors.push(
          simpleValidationError({
            code: 'STOP_LOSS_TRIGGER_NEAR_LIQUIDATION',
            type: ErrorType.error,
            fields: ['triggerPrice'],
            titleKey: STRING_KEYS.MODIFY_TRIGGER_PRICE,
            textKey: STRING_KEYS.BUY_TRIGGER_TOO_CLOSE_TO_LIQUIDATION_PRICE_NO_LIMIT,
            textParams: {
              TRIGGER_PRICE_LIMIT: {
                value: liquidationPrice,
                format: ErrorFormat.Price,
                decimals: market.tickSizeDecimals,
              },
            },
          })
        );
      }
    }
  }

  return errors;
}

function validatePositionState(summary: TradeFormSummary): ValidationError[] {
  const errors: ValidationError[] = [];
  const state = summary.effectiveTrade;

  // Only check if reduce-only is needed and enabled
  const needsReduceOnly = summary.options.needsReduceOnly;
  const reduceOnly = state.reduceOnly;
  const side = state.side;
  const size = AttemptNumber(summary.tradePayload?.orderPayload?.size);

  if (side == null || size == null) {
    return errors;
  }

  if (needsReduceOnly && reduceOnly) {
    const startSizeSigned = summary.accountDetailsBefore?.position?.signedSize.toNumber() ?? 0;
    const tradeDirection = side === OrderSide.BUY ? 1 : -1;

    if (
      // new position
      startSizeSigned === 0 ||
      // increasing
      startSizeSigned * tradeDirection > 0 ||
      // crossing
      (startSizeSigned * tradeDirection < 0 && size > Math.abs(startSizeSigned))
    ) {
      errors.push(
        simpleValidationError({
          code: 'ORDER_WOULD_FLIP_POSITION',
          type: ErrorType.error,
          fields: ['size.size'],
          titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
          textKey: STRING_KEYS.ORDER_WOULD_FLIP_POSITION,
        })
      );
    }
  }

  return errors;
}

function validateAccountState(
  inputData: TradeFormInputData,
  summary: TradeFormSummary
): ValidationError[] {
  const errors: ValidationError[] = [];

  const marginUsageError = validateParentSubaccountMarginUsage(summary);
  if (marginUsageError) {
    errors.push(marginUsageError);
  }

  const crossOrderError = validateSubaccountCrossOrders(inputData, summary);
  if (crossOrderError) {
    errors.push(crossOrderError);
  }

  const postOrderError = validateSubaccountMargin(summary);
  if (postOrderError) {
    errors.push(postOrderError);
  }

  return errors;
}

/**
 * Validates that the account's margin usage remains valid after the trade
 */
function validateParentSubaccountMarginUsage(
  summary: TradeFormSummary
): ValidationError | undefined {
  // ignore if reducing
  if (summary.effectiveTrade.reduceOnly) {
    return undefined;
  }

  const accountAfter = summary.accountDetailsAfter?.account;
  const accountBefore = summary.accountDetailsBefore?.account;
  if (!accountAfter || !accountBefore) {
    return undefined;
  }

  const equityAfter = accountAfter.equity.toNumber();
  const marginUsageAfter = accountAfter.marginUsage?.toNumber();

  const equityBefore = accountBefore.equity.toNumber();
  const marginUsageBefore = accountBefore.marginUsage?.toNumber();

  // Check if margin usage is invalid
  const isInvalidAfter = equityAfter <= 0 || marginUsageAfter == null || marginUsageAfter >= 1;
  const wasInvalidBefore = equityBefore <= 0 || marginUsageBefore == null || marginUsageBefore >= 1;
  // only error if they're going from valid->invalid
  // invalid->invalid is fine and invalid->valid is fine
  if (isInvalidAfter && !wasInvalidBefore) {
    return simpleValidationError({
      code: 'INVALID_NEW_ACCOUNT_MARGIN_USAGE',
      type: ErrorType.error,
      fields: ['size.size'],
      titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
      textKey: STRING_KEYS.INVALID_NEW_ACCOUNT_MARGIN_USAGE,
    });
  }

  return undefined;
}

/**
 * Validates that the trade doesn't cross the user's own existing orders
 */
function validateSubaccountCrossOrders(
  inputData: TradeFormInputData,
  summary: TradeFormSummary
): ValidationError | undefined {
  if (fillsExistingOrder(inputData, summary)) {
    return simpleValidationError({
      code: 'ORDER_CROSSES_OWN_ORDER',
      type: ErrorType.error,
      fields: ['size.size'],
      titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
      textKey: STRING_KEYS.ORDER_CROSSES_OWN_ORDER,
    });
  }

  return undefined;
}

/**
 * Checks if the order would fill an existing order on the orderbook
 */
function fillsExistingOrder(inputData: TradeFormInputData, summary: TradeFormSummary): boolean {
  const state = summary.effectiveTrade;
  const { type, side, marketId } = state;

  // Does not apply to trigger/stop trades
  if (isTriggerOrder(type)) {
    return false;
  }

  if (side == null || marketId == null || marketId === '') {
    return false;
  }

  // Determine the effective price
  let price: number | undefined;
  if (type === TradeFormType.MARKET) {
    price = summary.tradeInfo.inputSummary.worstFillPrice;
  } else {
    price = summary.tradeInfo.payloadPrice;
  }

  if (price == null) {
    return false;
  }

  // Check against all open orders
  const existingOrders = inputData.allOpenOrders;
  if (existingOrders.length === 0) {
    return false;
  }

  // Find if there's any order that would be crossed
  const crossingOrder = existingOrders.find((order) => {
    // Only check limit orders for the same market that are open
    if (
      order.marketId !== marketId ||
      order.type !== IndexerOrderType.LIMIT ||
      getSimpleOrderStatus(order.status ?? OrderStatus.Canceled) !== OrderStatus.Open
    ) {
      return false;
    }

    // Check if the order would cross
    if (side === OrderSide.BUY && order.side === IndexerOrderSide.SELL) {
      // For buy orders, check if price is >= sell order price
      if (price >= order.price.toNumber()) {
        return true;
      }
    } else if (side === OrderSide.SELL && order.side === IndexerOrderSide.BUY) {
      // For sell orders, check if price is <= buy order price
      if (price <= order.price.toNumber()) {
        return true;
      }
    }

    return false;
  });

  return crossingOrder != null;
}

function isTriggerOrder(type: TradeFormType): boolean {
  return [TradeFormType.TRIGGER_MARKET, TradeFormType.TRIGGER_LIMIT].includes(type);
}

/**
 * Validates that all positions remain valid after the order
 */
function validateSubaccountMargin(summary: TradeFormSummary): ValidationError | undefined {
  if (summary.effectiveTrade.marginMode !== MarginMode.ISOLATED) {
    return undefined;
  }

  if (
    summary.accountDetailsAfter?.position == null ||
    summary.accountDetailsAfter.position.unsignedSize.isZero()
  ) {
    return undefined;
  }

  const preOrderFreeCollateral =
    summary.accountDetailsBefore?.subaccountSummaries?.[
      summary.tradeInfo.subaccountNumber
    ]?.freeCollateral.toNumber();
  const postOrderFreeCollateral =
    summary.accountDetailsAfter.subaccountSummaries?.[
      summary.tradeInfo.subaccountNumber
    ]?.freeCollateral.toNumber();

  // post order is negative and pre order was positive or non-existent
  const overleveraged =
    postOrderFreeCollateral != null &&
    postOrderFreeCollateral <= 0 &&
    (preOrderFreeCollateral == null || preOrderFreeCollateral > 0);

  if (overleveraged) {
    return simpleValidationError({
      code: 'ORDER_WITH_CURRENT_ORDERS_INVALID',
      type: ErrorType.error,
      titleKey: STRING_KEYS.MODIFY_TARGET_LEVERAGE,
      textKey: STRING_KEYS.ORDER_WITH_CURRENT_ORDERS_INVALID,
    });
  }

  return undefined;
}

/**
 * Validates trade restrictions based on market status and user restrictions
 */
function validateRestrictions(
  inputData: TradeFormInputData,
  summary: TradeFormSummary
): ValidationError[] {
  const errors: ValidationError[] = [];
  const state = summary.effectiveTrade;

  // Get market ID and market info
  const marketId = state.marketId;
  if (!marketId) {
    return errors;
  }

  const market = inputData.currentTradeMarketSummary;
  if (!market) {
    return errors;
  }

  // Get market asset symbol
  const marketSymbol = market.displayableAsset;

  // Get market status
  const canTrade = market.status === IndexerPerpetualMarketStatus.ACTIVE;
  const canReduce = market.status === IndexerPerpetualMarketStatus.CANCELONLY;

  // Check if market is tradeable
  if (canTrade) {
    return errors;
  }

  if (canReduce) {
    const positionSizeBefore = summary.accountDetailsBefore?.position?.signedSize.toNumber() ?? 0;
    const positionSizeAfter = summary.accountDetailsAfter?.position?.signedSize.toNumber() ?? 0;

    if (
      // new position
      positionSizeBefore === 0 ||
      // switched sides
      positionSizeAfter * positionSizeBefore < 0 ||
      // got bigger
      Math.abs(positionSizeAfter) > Math.abs(positionSizeBefore)
    ) {
      errors.push(
        simpleValidationError({
          code: 'CLOSE_ONLY_MARKET',
          type: ErrorType.error,
          fields: ['size.size'],
          titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
          textKey: STRING_KEYS.MARKET_STATUS_CLOSE_ONLY,
          textParams: {
            MARKET: {
              value: marketSymbol,
              format: ErrorFormat.String,
            },
          },
        })
      );
    }
    return errors;
  }

  // Market is completely closed
  errors.push(
    simpleValidationError({
      code: 'CLOSED_MARKET',
      type: ErrorType.error,
      titleKey: STRING_KEYS.MARKET_STATUS_CLOSE_ONLY,
      textKey: STRING_KEYS.MARKET_STATUS_CLOSE_ONLY,
      textParams: {
        MARKET: {
          value: marketSymbol,
          format: ErrorFormat.String,
        },
      },
    })
  );

  return errors;
}

function validateTradeFormSummaryFields(summary: TradeFormSummary): ValidationError[] {
  const errors: ValidationError[] = [];

  if (summary.tradePayload == null) {
    errors.push(simpleValidationError({ code: 'MISSING_TRADE_PAYLOAD' }));
  }

  if (summary.tradeInfo.inputSummary.size?.size == null || summary.tradeInfo.payloadPrice == null) {
    errors.push(simpleValidationError({ code: 'MISSING__METRICS' }));
  }

  if (summary.accountDetailsBefore == null || summary.accountDetailsBefore.account == null) {
    errors.push(simpleValidationError({ code: 'MISSING_ACCOUNT_DETAILS_BEFORE' }));
  }

  if (summary.accountDetailsAfter == null || summary.accountDetailsAfter.account == null) {
    errors.push(simpleValidationError({ code: 'MISSING_ACCOUNT_DETAILS_AFTER' }));
  }

  return errors;
}

function validateEquityTiers(inputData: TradeFormInputData, summary: TradeFormSummary) {
  const subaccountToUse = summary.tradePayload?.orderPayload?.subaccountNumber;
  if (subaccountToUse == null) {
    return [];
  }
  if (inputData.equityTiers == null) {
    return [];
  }
  const relevantOpenOrders = inputData.allOpenOrders.filter(
    (o) => o.subaccountNumber === subaccountToUse && o.orderFlags !== OrderFlags.SHORT_TERM
  );
  const subaccountEquity = mapIfPresent(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    summary.accountDetailsBefore?.subaccountSummaries?.[subaccountToUse]?.equity.toNumber() ?? 0,
    summary.tradePayload?.orderPayload?.transferToSubaccountAmount,
    (equity, transferAmount) => {
      return equity + transferAmount;
    }
  );
  if (subaccountEquity == null) {
    return [];
  }
  const myEquityTierLimit = inputData.equityTiers.statefulOrderEquityTiers.find(
    (t) =>
      subaccountEquity >= t.requiredTotalNetCollateralUSD &&
      subaccountEquity < (t.nextLevelRequiredTotalNetCollateralUSD ?? Number.MAX_SAFE_INTEGER)
  );
  if (myEquityTierLimit == null) {
    return [];
  }

  const isShortTerm =
    summary.effectiveTrade.type === TradeFormType.MARKET ||
    (summary.effectiveTrade.type === TradeFormType.LIMIT &&
      summary.effectiveTrade.timeInForce === TimeInForce.IOC);

  const ordersToOpen =
    (isShortTerm ? 0 : 1) +
    (summary.tradePayload?.triggersPayloads?.filter((t) => t.placePayload != null).length ?? 0);

  if (ordersToOpen <= 0) {
    return [];
  }

  if (relevantOpenOrders.length + ordersToOpen > myEquityTierLimit.maxOrders) {
    const nextTierEquity =
      myEquityTierLimit.nextLevelRequiredTotalNetCollateralUSD ?? Number.MAX_SAFE_INTEGER;
    return [
      simpleValidationError({
        code: 'OPEN_ORDERS_EXCEEDS_EQUITY_TIER_LIMIT',
        type: ErrorType.error,
        learnMoreUrlKey: 'equityTiersLearnMore',
        textKey: STRING_KEYS.TRIGGERS_EQUITY_TIER_ERROR,
        textParams: {
          CURRENT_EQUITY: {
            value: subaccountEquity,
            format: ErrorFormat.Price,
            decimals: 0,
          },
          NEXT_TIER_EQUITY: {
            value: nextTierEquity,
            format: ErrorFormat.Price,
            decimals: 0,
          },
          MAX_ORDERS: {
            value: `${Math.round(myEquityTierLimit.maxOrders)}`,
            format: ErrorFormat.String,
            decimals: 0,
          },
        },
      }),
    ];
  }
  return [];
}

function validateBracketOrders(
  inputData: TradeFormInputData,
  summary: TradeFormSummary
): ValidationError[] {
  const inputTp = summary.effectiveTrade.takeProfitOrder;
  const inputSl = summary.effectiveTrade.stopLossOrder;

  const tpDetails = summary.triggersSummary?.takeProfitOrder;
  const slDetails = summary.triggersSummary?.stopLossOrder;

  // This assumes we currently only submit take profit/stop loss MARKET orders, no limits
  const tpPayload = summary.tradePayload?.triggersPayloads?.find(
    (t) => t.placePayload?.type === OrderType.TAKE_PROFIT_MARKET
  );
  const slPayload = summary.tradePayload?.triggersPayloads?.find(
    (t) => t.placePayload?.type === OrderType.STOP_MARKET
  );

  const attemptingTp = isAttempingBracketOperation(inputTp);
  const attemptingSl = isAttempingBracketOperation(inputSl);

  if (!attemptingSl && !attemptingTp) {
    return [];
  }

  const market = inputData.currentTradeMarketSummary;
  const estPosition = summary.accountDetailsAfter?.position;

  if (market == null || estPosition == null) {
    return [
      simpleValidationError({
        code: 'MISSING_REQUIRED_DATA_FOR_BRACKET_VALIDATION',
      }),
    ];
  }

  const errors: ValidationError[] = [];
  if (attemptingSl && inputSl != null) {
    const errorResult = validateTriggerOrder(
      true,
      inputSl,
      slDetails ?? {},
      {
        positionId: estPosition.uniqueId,
        showLimits: false,
        stopLossOrder: inputSl,
        takeProfitOrder: inputTp ?? {},
        size: { checked: false, size: '' },
      },
      { market, position: estPosition }
    );
    errors.push(...errorResult);
    if (slPayload == null) {
      errors.push(
        simpleValidationError({
          code: 'MISSING_STOP_LOSS_PAYLOAD',
        })
      );
    }
  }
  if (attemptingTp && inputTp != null) {
    const errorResult = validateTriggerOrder(
      false,
      inputTp,
      tpDetails ?? {},
      {
        positionId: estPosition.uniqueId,
        showLimits: false,
        stopLossOrder: inputSl ?? {},
        takeProfitOrder: inputTp,
        size: { checked: false, size: '' },
      },
      { market, position: estPosition }
    );
    errors.push(...errorResult);
    if (tpPayload == null) {
      errors.push(
        simpleValidationError({
          code: 'MISSING_TAKE_PROFIT_PAYLOAD',
        })
      );
    }
  }
  return errors;
}

function isAttempingBracketOperation(state: TriggerOrderState | undefined): boolean {
  if (state?.priceInput?.type == null) {
    return false;
  }
  switch (state.priceInput.type) {
    case TriggerPriceInputType.PercentDiff:
      return state.priceInput.percentDiff.trim().length > 0;
    case TriggerPriceInputType.TriggerPrice:
      return state.priceInput.triggerPrice.trim().length > 0;
    case TriggerPriceInputType.UsdcDiff:
      return state.priceInput.usdcDiff.trim().length > 0;
    default:
      assertNever(state.priceInput);
  }
  return false;
}
