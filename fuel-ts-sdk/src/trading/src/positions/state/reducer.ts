import { slice, thunks } from './positions';

export const { positionsReducer } = slice;
export type PositionsThunkExtra = thunks.PositionsThunkExtra;
