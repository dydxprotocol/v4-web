import { createForm } from '@/bonsai/lib/forms';
import { tradeFormReducer } from './reducer';

const TradeFormFns = createForm({
  reducer: tradeFormReducer,
  calculateSummary: () => {}
  getErrors: () => [],
});
