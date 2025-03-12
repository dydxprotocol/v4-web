import { createForm } from '@/bonsai/lib/forms';

import { tradeFormReducer } from './reducer';
import { TradeForm, TradeFormSummary } from './types';

export const TradeFormFns = createForm({
  reducer: tradeFormReducer,
  calculateSummary: (_state: TradeForm): TradeFormSummary => {
    return {} as any as TradeFormSummary;
  },
  getErrors: () => [],
});
