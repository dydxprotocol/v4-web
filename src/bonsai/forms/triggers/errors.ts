import { ErrorType, simpleValidationError, ValidationError } from '@/bonsai/lib/validationErrors';

import { STRING_KEYS } from '@/constants/localization';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import {
  InputData,
  SummaryData,
  TriggerOrderDetails,
  TriggerOrdersFormState,
  TriggerOrderState,
} from './types';

export function getErrors(
  state: TriggerOrdersFormState,
  inputData: InputData,
  summary: SummaryData
): ValidationError[] {
  const errors = new TriggerOrderFormValidationErrors();
  const validationErrors: ValidationError[] = [];

  // Basic input validation
  if (inputData.position == null) {
    validationErrors.push(errors.positionNotFound());
  }

  // Market state validation
  if (state.marketId == null || inputData.market == null) {
    validationErrors.push(errors.invalidMarket());
  }

  // Position validation
  const position = inputData.position;
  if (!position || position.size.current === 0) {
    validationErrors.push(errors.positionNotFound());
  }

  // Validate Stop Loss Order
  if (state.stopLossOrder.orderId || state.stopLossOrder.priceInput) {
    validateTriggerOrder(
      true, // isStopLoss
      state.stopLossOrder,
      summary.stopLossOrder,
      state,
      inputData,
      validationErrors,
      errors
    );
  }

  // Validate Take Profit Order
  if (state.takeProfitOrder.orderId || state.takeProfitOrder.priceInput) {
    validateTriggerOrder(
      false, // isStopLoss
      state.takeProfitOrder,
      summary.takeProfitOrder,
      state,
      inputData,
      validationErrors,
      errors
    );
  }

  // Size validation if using custom size
  if (state.size.checked) {
    validateCustomSize(state.size.size, inputData, validationErrors, errors);
  }

  // Summary/Payload validation
  if (!summary) {
    validationErrors.push(errors.noSummaryData());
  }

  return validationErrors;
}

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
      code: 'TRIGGER_MUST_ABOVE_INDEX_PRICE',
      type: ErrorType.error,
      fields: ['takeProfitPrice.triggerPrice'],
      titleKey: STRING_KEYS.TAKE_PROFIT_TRIGGER_MUST_ABOVE_INDEX_PRICE,
      textKey: STRING_KEYS.TAKE_PROFIT_TRIGGER_MUST_ABOVE_INDEX_PRICE,
    });
  }

  takeProfitTriggerAboveIndex(): ValidationError {
    return simpleValidationError({
      code: 'TRIGGER_MUST_BELOW_INDEX_PRICE',
      type: ErrorType.error,
      fields: ['takeProfitPrice.triggerPrice'],
      titleKey: STRING_KEYS.TAKE_PROFIT_TRIGGER_MUST_BELOW_INDEX_PRICE,
      textKey: STRING_KEYS.TAKE_PROFIT_TRIGGER_MUST_BELOW_INDEX_PRICE,
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
      titleKey: STRING_KEYS.ORDER_SIZE_BELOW_MIN_SIZE,
      textKey: STRING_KEYS.ORDER_SIZE_BELOW_MIN_SIZE,
      textParams: {
        MIN_SIZE: {
          value: minSize,
          format: 'size',
        },
        MARKET: {
          value: marketId,
          format: 'string',
        },
      },
    });
  }

  sizeExceedsPosition(): ValidationError {
    return simpleValidationError({
      code: 'SIZE_EXCEEDS_POSITION',
      type: ErrorType.error,
      fields: ['size'],
      titleKey: STRING_KEYS.SIZE_EXCEEDS_POSITION,
      textKey: STRING_KEYS.SIZE_EXCEEDS_POSITION,
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
      actionStringKey: 'APP.TRADE.ENTER_TRIGGER_PRICE',
    });
  }

  stopLossTriggerNearLiquidation(liquidationPrice: number, tickSize: string): ValidationError {
    return simpleValidationError({
      code: 'SELL_TRIGGER_TOO_CLOSE_TO_LIQUIDATION_PRICE',
      type: ErrorType.error,
      fields: ['stopLossPrice.triggerPrice'],
      actionStringKey: 'APP.TRADE.MODIFY_TRIGGER_PRICE',
      titleStringKey: 'ERRORS.TRIGGERS_FORM_TITLE.SELL_TRIGGER_TOO_CLOSE_TO_LIQUIDATION_PRICE',
      textStringKey: 'ERRORS.TRIGGERS_FORM.SELL_TRIGGER_TOO_CLOSE_TO_LIQUIDATION_PRICE_NO_LIMIT',
      textParams: {
        TRIGGER_PRICE_LIMIT: {
          value: liquidationPrice,
          format: 'price',
          tickSize: tickSize,
        },
      },
    });
  }

  // Update existing errors with more specific messages...
  limitPriceMustBeAboveTriggerStopLoss(): ValidationError {
    return simpleValidationError({
      code: 'LIMIT_MUST_ABOVE_TRIGGER_PRICE',
      fields: ['stopLossLimitPrice'],
      titleStringKey: 'ERRORS.TRIGGERS_FORM_TITLE.STOP_LOSS_LIMIT_MUST_ABOVE_TRIGGER_PRICE',
      textStringKey: 'ERRORS.TRIGGERS_FORM.STOP_LOSS_LIMIT_MUST_ABOVE_TRIGGER_PRICE',
    });
  }

  limitPriceMustBeAboveTriggerTakeProfit(): ValidationError {
    return simpleValidationError({
      code: 'LIMIT_MUST_ABOVE_TRIGGER_PRICE',
      fields: ['takeProfitLimitPrice'],
      titleStringKey: 'ERRORS.TRIGGERS_FORM_TITLE.TAKE_PROFIT_LIMIT_MUST_ABOVE_TRIGGER_PRICE',
      textStringKey: 'ERRORS.TRIGGERS_FORM.TAKE_PROFIT_LIMIT_MUST_ABOVE_TRIGGER_PRICE',
    });
  }
}

function validateTriggerOrder(
  isStopLoss: boolean,
  triggerOrderState: TriggerOrderState,
  triggerOrderDetails: TriggerOrderDetails,
  formState: TriggerOrdersFormState,
  inputData: InputData,
  validationErrors: ValidationError[],
  errors: TriggerOrderFormValidationErrors
): void {
  const { position, market } = inputData;
  if (!position || !market) return;

  // Required inputs validation
  if (triggerOrderState.limitPrice && !triggerOrderDetails.triggerPrice) {
    validationErrors.push(errors.triggerPriceRequired());
    return;
  }

  const triggerPrice = triggerOrderDetails.triggerPrice;
  if (!triggerPrice) return;

  const oraclePrice = market.oraclePrice;
  const isLong = position.side === IndexerPositionSide.LONG;
  const triggerPriceNum = Number(triggerPrice);

  // Price positivity checks
  if (
    triggerPriceNum <= 0 ||
    (formState.showLimits &&
      triggerOrderDetails.limitPrice &&
      Number(triggerOrderDetails.limitPrice) <= 0)
  ) {
    validationErrors.push(errors.priceNotPositive());
    return;
  }

  // Validate trigger price vs oracle price
  if (isStopLoss) {
    if (isLong && triggerPriceNum >= oraclePrice) {
      validationErrors.push(errors.stopLossTriggerBelowIndex(oraclePrice, market.configs.tickSize));
    } else if (!isLong && triggerPriceNum <= oraclePrice) {
      validationErrors.push(errors.stopLossTriggerAboveIndex(oraclePrice, market.configs.tickSize));
    }

    // Validate trigger price vs liquidation price
    const liquidationPrice = position.liquidationPrice;
    if (liquidationPrice) {
      if (isLong && triggerPriceNum <= liquidationPrice) {
        validationErrors.push(
          errors.stopLossTriggerNearLiquidation(liquidationPrice, market.configs.tickSize)
        );
      } else if (!isLong && triggerPriceNum >= liquidationPrice) {
        validationErrors.push(
          errors.stopLossTriggerNearLiquidation(liquidationPrice, market.configs.tickSize)
        );
      }
    }
  } else {
    // Take Profit validation
    if (isLong && triggerPriceNum <= oraclePrice) {
      validationErrors.push(
        errors.takeProfitTriggerBelowIndex(oraclePrice, market.configs.tickSize)
      );
    } else if (!isLong && triggerPriceNum >= oraclePrice) {
      validationErrors.push(
        errors.takeProfitTriggerAboveIndex(oraclePrice, market.configs.tickSize)
      );
    }
  }

  // Limit price validation when applicable
  if (formState.showLimits && triggerOrderDetails.limitPrice) {
    const limitPrice = Number(triggerOrderDetails.limitPrice);

    if (isLong) {
      if (limitPrice < triggerPriceNum) {
        validationErrors.push(
          isStopLoss
            ? errors.limitPriceMustBeAboveTriggerStopLoss()
            : errors.limitPriceMustBeAboveTriggerTakeProfit()
        );
      }
    } else {
      if (limitPrice > triggerPriceNum) {
        validationErrors.push(
          isStopLoss
            ? errors.limitPriceMustBelowTriggerStopLoss()
            : errors.limitPriceMustBelowTriggerTakeProfit()
        );
      }
    }
  }
}

function validateCustomSize(
  size: string,
  inputData: InputData,
  validationErrors: ValidationError[],
  errors: TriggerOrderFormValidationErrors
): void {
  const { market, position } = inputData;
  if (!market || !position) return;

  const sizeNum = Number(size);
  if (sizeNum <= 0) return;

  // Check minimum size
  if (sizeNum < market.configs.minOrderSize) {
    validationErrors.push(
      errors.sizeBelowMinimum(
        market.configs.minOrderSize,
        market.id,
        market.asset.symbol // Added asset symbol
      )
    );
  }

  // Check against position size
  if (sizeNum > Math.abs(position.size.current)) {
    validationErrors.push(errors.sizeExceedsPosition());
  }
}
