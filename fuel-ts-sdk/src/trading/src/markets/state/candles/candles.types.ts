import { createEntityAdapter } from '@reduxjs/toolkit';
import { LoadableMixin } from '@/shared/lib/redux';
import type { CandleId } from '@/shared/types';
import type { Candle } from '../../domain';

export const candlesAdapter = createEntityAdapter<Candle, CandleId>({
  selectId: (candle) => candle.id,
  sortComparer: (a, b) => b.startedAt - a.startedAt,
});

export const candlesInitialState = candlesAdapter.getInitialState<LoadableMixin>({
  fetchStatus: 'idle',
  error: null,
});

export type CandlesState = typeof candlesInitialState;