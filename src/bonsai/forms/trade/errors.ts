import { ValidationError } from '@/bonsai/lib/validationErrors';

import { TradeForm, TradeFormInputData, TradeFormSummary } from './types';

export function calculateTradeFormErrors(
  state: TradeForm,
  inputData: TradeFormInputData,
  summary: TradeFormSummary
): ValidationError[] {
  return [];
}
