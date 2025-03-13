import { createForm } from '@/bonsai/lib/forms';

import { tradeFormReducer } from './reducer';
import { calculateTradeSummary } from './summary';

export const TradeFormFns = createForm({
  reducer: tradeFormReducer,
  calculateSummary: calculateTradeSummary,
  getErrors: () => [],
});
