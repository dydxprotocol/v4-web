import { TriggerOrdersInputField } from '@/constants/abacus';

export enum TriggerFields {
  Limit = 'Limit',
  All = 'All',
}

export const CLEARED_TRIGGER_LIMIT_INPUTS = {
  [TriggerOrdersInputField.stopLossLimitPrice.rawValue]: '',
  [TriggerOrdersInputField.takeProfitLimitPrice.rawValue]: '',
};

export const CLEARED_TRIGGER_ORDER_INPUTS = {
  [TriggerOrdersInputField.stopLossPrice.rawValue]: '',
  [TriggerOrdersInputField.stopLossPercentDiff.rawValue]: '',
  [TriggerOrdersInputField.stopLossUsdcDiff.rawValue]: '',
  [TriggerOrdersInputField.takeProfitPrice.rawValue]: '',
  [TriggerOrdersInputField.takeProfitPercentDiff.rawValue]: '',
  [TriggerOrdersInputField.takeProfitUsdcDiff.rawValue]: '',
};
