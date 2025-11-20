import type { RootState } from './_store';
import { createAppSelector } from './appTypes';

export const getSwaps = (state: RootState) => state.swaps.swaps;

export const getPendingSwaps = createAppSelector([getSwaps], (swaps) =>
  swaps.filter((swap) => swap.status === 'pending' || swap.status === 'pending-transfer')
);

export const selectHasPendingSwaps = createAppSelector(
  [getPendingSwaps],
  (pendingSwaps) => pendingSwaps.length > 0
);
