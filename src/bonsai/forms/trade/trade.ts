import { createForm } from '@/bonsai/lib/forms';

import { calculateTradeFormErrors } from './errors';
import { tradeFormReducer } from './reducer';
import { calculateTradeSummary } from './summary';

export const TradeFormFns = createForm({
  reducer: tradeFormReducer,
  calculateSummary: calculateTradeSummary,
  getErrors: calculateTradeFormErrors,
});
