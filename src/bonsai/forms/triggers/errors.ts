import { getSimpleOrderStatus } from '@/bonsai/calculators/orders';
import {
  ErrorFormat,
  ErrorType,
  simpleValidationError,
  ValidationError,
} from '@/bonsai/lib/validationErrors';
import { OrderStatus } from '@/bonsai/types/summaryTypes';

import { STRING_KEYS } from '@/constants/localization';
import { IndexerPerpetualPositionStatus, IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { calc } from '@/lib/do';
import { AttemptBigNumber, AttemptNumber, MustBigNumber, MustNumber } from '@/lib/numbers';
import { isPresent } from '@/lib/typeUtils';

import {
  SummaryData,
  TriggerOrderDetails,
  TriggerOrderInputData,
  TriggerOrdersFormState,
  TriggerOrderState,
} from './types';

export function getErrors(
  state: TriggerOrdersFormState,
  inputData: TriggerOrderInputData,
  summary: SummaryData
): ValidationError[] {
  const validationErrors: ValidationError[] = [];

  // make sure referenced market is here
  if (inputData.market == null) {
    validationErrors.push(errors.invalidMarket());
  }

  // make sure we have a position and it's in a good state
  if (
    inputData.position == null ||
    inputData.position.uniqueId !== state.positionId ||
    inputData.position.unsignedSize.lte(0) ||
    inputData.position.market !== inputData.market?.ticker ||
    inputData.position.status !== IndexerPerpetualPositionStatus.OPEN
  ) {
    validationErrors.push(errors.positionNotFound());
  }

  // make sure any referenced orders are here and open
  const requiredOrders = [state.stopLossOrder.orderId, state.takeProfitOrder.orderId].filter(
    isPresent
  );
  requiredOrders.forEach((orderId) => {
    const order = inputData.existingTriggerOrders?.find((o) => o.id === orderId);
    if (
      order == null ||
      getSimpleOrderStatus(order.status ?? OrderStatus.Open) !== OrderStatus.Open
    ) {
      validationErrors.push(errors.orderNotFound());
    }
  });

  if (
    state.stopLossOrder.orderId != null ||
    state.stopLossOrder.priceInput != null ||
    state.stopLossOrder.limitPrice != null ||
    state.size.checked
  ) {
    validationErrors.push(
      ...validateTriggerOrder(true, state.stopLossOrder, summary.stopLossOrder, state, inputData)
    );
  }

  if (
    state.takeProfitOrder.orderId != null ||
    state.takeProfitOrder.priceInput != null ||
    state.takeProfitOrder.limitPrice != null ||
    state.size.checked
  ) {
    validationErrors.push(
      ...validateTriggerOrder(
        false,
        state.takeProfitOrder,
        summary.takeProfitOrder,
        state,
        inputData
      )
    );
  }

  // Size validation if using custom size
  if (state.size.checked) {
    validationErrors.push(...validateCustomSize(state.size.size, inputData));
  }

  if (
    summary.payload == null ||
    (summary.payload.cancelOrderPayloads.length === 0 &&
      summary.payload.placeOrderPayloads.length === 0)
  ) {
    validationErrors.push(errors.noPayload());
  }

  return validationErrors;
}

function validateTriggerOrder(
  isStopLoss: boolean,
  state: TriggerOrderState,
  details: TriggerOrderDetails,
  formState: TriggerOrdersFormState,
  inputData: TriggerOrderInputData
): ValidationError[] {
  const validationErrors: ValidationError[] = [];
  const { position, market } = inputData;
  if (!position || !market) return validationErrors;

  // we allow fully empty state if you're cancelling the order, but otherwise you need to be modifying something
  const isModifyingOrder = state.orderId != null;

  const validatedTriggerPrice = calc(() => {
    const triggerPrice = details.triggerPrice;
    if (triggerPrice == null) {
      return { isUserInput: false, validationErrors: [] };
    }

    const triggerPriceNum = AttemptBigNumber(triggerPrice);
    const oraclePrice = market.oraclePrice;
    const isLong = position.side === IndexerPositionSide.LONG;
    const localErrors: ValidationError[] = [];

    // Price positivity check
    if (triggerPriceNum == null || triggerPriceNum.lte(0)) {
      localErrors.push(errors.priceNotPositive());
      return { isUserInput: true, validationErrors: localErrors };
    }

    // we need a valid oracle to validate orders
    if (oraclePrice == null) {
      localErrors.push(errors.missingOraclePrice());
      return { isUserInput: true, validationErrors: localErrors };
    }

    // Oracle price validation
    if (isStopLoss) {
      // we're long and stop loss means we are selling when price is below trigger price
      if (isLong && MustBigNumber(oraclePrice).lte(triggerPriceNum)) {
        localErrors.push(errors.stopLossTriggerAboveIndex());
        // if we are short then stop loss means buy when price is above trigger
      } else if (!isLong && MustBigNumber(oraclePrice).gte(triggerPriceNum)) {
        localErrors.push(errors.stopLossTriggerBelowIndex());
      }
    } else {
      // we're long and taking profit, which means sell when oracle is greater than trigger
      if (isLong && MustBigNumber(oraclePrice).gte(triggerPriceNum)) {
        localErrors.push(errors.takeProfitTriggerBelowIndex());
        // we're short and taking profit which means buy when price is below trigger
      } else if (!isLong && MustBigNumber(oraclePrice).lte(triggerPriceNum)) {
        localErrors.push(errors.takeProfitTriggerAboveIndex());
      }
    }

    // Liquidation price validation
    const liquidationPrice = position.liquidationPrice;
    if (liquidationPrice && isStopLoss) {
      if (isLong && triggerPriceNum <= liquidationPrice) {
        localErrors.push(errors.stopLossTriggerNearLiquidation(liquidationPrice.toNumber()));
      } else if (!isLong && triggerPriceNum >= liquidationPrice) {
        localErrors.push(errors.stopLossTriggerNearLiquidation(liquidationPrice.toNumber()));
      }
    }

    return { isUserInput: true, validationErrors: localErrors };
  });

  const validatedLimitPrice = calc(() => {
    if (!formState.showLimits) {
      return { isUserInput: false, validationErrors: [] };
    }

    const limitPrice = AttemptNumber(details.limitPrice);
    const triggerPrice = AttemptNumber(details.triggerPrice);

    const isSellOrder = position.side === IndexerPositionSide.LONG;

    const localErrors: ValidationError[] = [];

    if (limitPrice == null) {
      localErrors.push(
        isSellOrder ? errors.limitPriceMustBeBelowTrigger() : errors.limitPriceMustBeAboveTrigger()
      );
    } else if (limitPrice <= 0) {
      localErrors.push(errors.priceNotPositive());
    } else if (triggerPrice != null) {
      if (isSellOrder && limitPrice >= triggerPrice) {
        localErrors.push(errors.limitPriceMustBeBelowTrigger());
      } else if (!isSellOrder && limitPrice <= triggerPrice) {
        localErrors.push(errors.limitPriceMustBeAboveTrigger());
      }
    }

    return { isUserInput: true, validationErrors: localErrors };
  });

  const validatedSize = calc(() => {
    if (!formState.size.checked || !details.size) {
      return { isUserInput: false, validationErrors: [] };
    }

    return {
      isUserInput: true,
      validationErrors: validateCustomSize(formState.size.size, inputData),
    };
  });

  if (isModifyingOrder) {
    // any user provided inputs must be valid since they'll override the order
    // but if they're all empty we'll just cancel the order and do nothing
    if (validatedTriggerPrice.isUserInput) {
      validationErrors.push(...validatedTriggerPrice.validationErrors);
    }
    if (validatedLimitPrice.isUserInput) {
      validationErrors.push(...validatedLimitPrice.validationErrors);
    }
    if (validatedSize.isUserInput) {
      validationErrors.push(...validatedSize.validationErrors);
    }
  } else {
    // we need at least a valid trigger price and if limit is checked we need valid limit
    // and if size is checked we need valid size
    if (!validatedTriggerPrice.isUserInput) {
      validationErrors.push(errors.triggerPriceRequired());
    } else {
      validationErrors.push(...validatedTriggerPrice.validationErrors);
    }

    // todo check if we should allow empty and do a sane default
    if (formState.showLimits && validatedLimitPrice.validationErrors.length > 0) {
      validationErrors.push(...validatedLimitPrice.validationErrors);
    }

    // todo check if we should allow empty and do a sane default
    if (formState.size.checked && validatedSize.validationErrors.length > 0) {
      validationErrors.push(...validatedSize.validationErrors);
    }
  }

  return validationErrors;
}

function validateCustomSize(size: string, inputData: TriggerOrderInputData): ValidationError[] {
  const { market, position } = inputData;
  if (!market || !position) return [];

  const sizeNum = AttemptBigNumber(size);

  if (sizeNum == null || sizeNum.lt(market.stepSize)) {
    return [errors.sizeBelowMinimum(MustNumber(market.stepSize), market.displayableTicker)];
  }

  if (sizeNum.gt(position.unsignedSize)) {
    return [errors.sizeExceedsPosition()];
  }

  return [];
}

// todo - remove unused
class TriggerOrderFormValidationErrors {
  // Basic validation errors
  accountDataMissing(canViewAccount?: boolean): ValidationError {
    return simpleValidationError({
      code: 'ACCOUNT_DATA_MISSING',
      type: ErrorType.error,
      titleKey:
        canViewAccount != null && canViewAccount
          ? STRING_KEYS.NOT_ALLOWED
          : STRING_KEYS.CONNECT_WALLET,
    });
  }

  positionNotFound(): ValidationError {
    return simpleValidationError({
      code: 'NO_POSITION',
      type: ErrorType.error,
      titleKey: STRING_KEYS.NO_POSITION,
    });
  }

  orderNotFound(): ValidationError {
    return simpleValidationError({
      code: 'NO_ORDER_MATCHING_ORDER_ID',
      type: ErrorType.error,
      titleKey: STRING_KEYS.UNKNOWN_ERROR,
    });
  }

  // Stop Loss specific errors
  stopLossTriggerBelowLiquidation(): ValidationError {
    return simpleValidationError({
      code: 'SELL_TRIGGER_TOO_CLOSE_TO_LIQUIDATION_PRICE',
      type: ErrorType.error,
      fields: ['stopLossPrice.triggerPrice'],
      titleKey: STRING_KEYS.SELL_TRIGGER_TOO_CLOSE_TO_LIQUIDATION_PRICE,
      textKey: STRING_KEYS.SELL_TRIGGER_TOO_CLOSE_TO_LIQUIDATION_PRICE,
    });
  }

  stopLossTriggerAboveLiquidation(): ValidationError {
    return simpleValidationError({
      code: 'BUY_TRIGGER_TOO_CLOSE_TO_LIQUIDATION_PRICE',
      type: ErrorType.error,
      fields: ['stopLossPrice.triggerPrice'],
      titleKey: STRING_KEYS.BUY_TRIGGER_TOO_CLOSE_TO_LIQUIDATION_PRICE,
      textKey: STRING_KEYS.BUY_TRIGGER_TOO_CLOSE_TO_LIQUIDATION_PRICE,
    });
  }

  // Take Profit specific errors
  takeProfitTriggerBelowIndex(): ValidationError {
    return simpleValidationError({
      code: 'TAKE_PROFIT_TRIGGER_MUST_ABOVE_INDEX_PRICE',
      type: ErrorType.error,
      fields: ['takeProfitPrice.triggerPrice'],
      titleKey: STRING_KEYS.TAKE_PROFIT_TRIGGER_MUST_ABOVE_INDEX_PRICE,
      textKey: STRING_KEYS.TAKE_PROFIT_TRIGGER_MUST_ABOVE_INDEX_PRICE,
    });
  }

  takeProfitTriggerAboveIndex(): ValidationError {
    return simpleValidationError({
      code: 'TAKE_PROFIT_TRIGGER_MUST_BELOW_INDEX_PRICE',
      type: ErrorType.error,
      fields: ['takeProfitPrice.triggerPrice'],
      titleKey: STRING_KEYS.TAKE_PROFIT_TRIGGER_MUST_BELOW_INDEX_PRICE,
      textKey: STRING_KEYS.TAKE_PROFIT_TRIGGER_MUST_BELOW_INDEX_PRICE,
    });
  }

  stopLossTriggerBelowIndex(): ValidationError {
    return simpleValidationError({
      code: 'STOP_LOSS_TRIGGER_MUST_ABOVE_INDEX_PRICE',
      type: ErrorType.error,
      fields: ['stopLossPrice.triggerPrice'],
      titleKey: STRING_KEYS.STOP_LOSS_TRIGGER_MUST_ABOVE_INDEX_PRICE,
      textKey: STRING_KEYS.STOP_LOSS_TRIGGER_MUST_ABOVE_INDEX_PRICE,
    });
  }

  stopLossTriggerAboveIndex(): ValidationError {
    return simpleValidationError({
      code: 'STOP_LOSS_TRIGGER_MUST_BELOW_INDEX_PRICE',
      type: ErrorType.error,
      fields: ['stopLossPrice.triggerPrice'],
      titleKey: STRING_KEYS.STOP_LOSS_TRIGGER_MUST_BELOW_INDEX_PRICE,
      textKey: STRING_KEYS.STOP_LOSS_TRIGGER_MUST_BELOW_INDEX_PRICE,
    });
  }

  // Limit price errors
  limitPriceMustBeAboveTrigger(): ValidationError {
    return simpleValidationError({
      code: 'LIMIT_MUST_ABOVE_TRIGGER_PRICE',
      type: ErrorType.error,
      fields: ['limitPrice'],
      titleKey: STRING_KEYS.LIMIT_MUST_ABOVE_TRIGGER_PRICE,
      textKey: STRING_KEYS.LIMIT_MUST_ABOVE_TRIGGER_PRICE,
    });
  }

  limitPriceMustBeBelowTrigger(): ValidationError {
    return simpleValidationError({
      code: 'LIMIT_MUST_BELOW_TRIGGER_PRICE',
      type: ErrorType.error,
      fields: ['limitPrice'],
      titleKey: STRING_KEYS.LIMIT_MUST_BELOW_TRIGGER_PRICE,
      textKey: STRING_KEYS.LIMIT_MUST_BELOW_TRIGGER_PRICE,
    });
  }

  // Size errors
  sizeBelowMinimum(minSize: number, marketId: string): ValidationError {
    return simpleValidationError({
      code: 'ORDER_SIZE_BELOW_MIN_SIZE',
      type: ErrorType.error,
      fields: ['size'],
      titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
      textKey: STRING_KEYS.ORDER_SIZE_BELOW_MIN_SIZE,
      textParams: {
        MIN_SIZE: {
          value: minSize,
          format: ErrorFormat.Size,
        },
        MARKET: {
          value: marketId,
          format: ErrorFormat.String,
        },
      },
    });
  }

  sizeExceedsPosition(): ValidationError {
    return simpleValidationError({
      code: 'SIZE_EXCEEDS_POSITION',
      type: ErrorType.error,
      fields: ['size'],
      titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
    });
  }

  // Price errors
  priceNotPositive(): ValidationError {
    return simpleValidationError({
      code: 'PRICE_MUST_POSITIVE',
      type: ErrorType.error,
      fields: ['triggerPrice', 'limitPrice'],
      titleKey: STRING_KEYS.PRICE_MUST_POSITIVE,
      textKey: STRING_KEYS.PRICE_MUST_POSITIVE,
    });
  }

  // Summary/Payload errors
  noSummaryData(): ValidationError {
    return simpleValidationError({
      code: 'MISSING_SUMMARY_DATA',
      type: ErrorType.error,
      titleKey: STRING_KEYS.UNKNOWN_ERROR,
    });
  }

  noPayload(): ValidationError {
    return simpleValidationError({
      code: 'MISSING_PAYLOAD',
      type: ErrorType.error,
      titleKey: STRING_KEYS.UNKNOWN_ERROR,
    });
  }

  missingOraclePrice(): ValidationError {
    return simpleValidationError({
      code: 'MISSING_ORACLE_PRICE',
      type: ErrorType.error,
      titleKey: STRING_KEYS.UNKNOWN_ERROR,
    });
  }

  invalidMarket(): ValidationError {
    return simpleValidationError({
      code: 'INVALID_MARKET',
      type: ErrorType.error,
      titleKey: STRING_KEYS.NO_MARKET,
    });
  }

  triggerPriceRequired(): ValidationError {
    return simpleValidationError({
      code: 'REQUIRED_TRIGGER_PRICE',
      type: ErrorType.error,
      fields: ['price.triggerPrice'],
      titleKey: STRING_KEYS.ENTER_TRIGGER_PRICE,
    });
  }

  stopLossTriggerNearLiquidation(liquidationPrice: number): ValidationError {
    return simpleValidationError({
      code: 'SELL_TRIGGER_TOO_CLOSE_TO_LIQUIDATION_PRICE',
      type: ErrorType.error,
      fields: ['stopLossPrice.triggerPrice'],
      titleKey: STRING_KEYS.SELL_TRIGGER_TOO_CLOSE_TO_LIQUIDATION_PRICE,
      textKey: STRING_KEYS.SELL_TRIGGER_TOO_CLOSE_TO_LIQUIDATION_PRICE_NO_LIMIT,
      textParams: {
        TRIGGER_PRICE_LIMIT: {
          value: liquidationPrice,
          format: ErrorFormat.Price,
        },
      },
    });
  }
}
const errors = new TriggerOrderFormValidationErrors();
