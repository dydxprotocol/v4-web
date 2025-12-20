import type { LoadableState } from '@/shared/lib/redux';
import type { Address } from '@/shared/types';

import type { Position } from '../../domain';

export type PositionsState = LoadableState<Record<Address, Position[]>>;

export const positionsInitialState: PositionsState = {
  data: {},
  fetchStatus: 'idle',
  error: null,
};
