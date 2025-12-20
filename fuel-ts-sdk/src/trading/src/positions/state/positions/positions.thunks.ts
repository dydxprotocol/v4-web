import type { Address } from '@/shared/types';
import { createAsyncThunk } from '@reduxjs/toolkit';

import type { Position } from '../../domain';
import type { PositionRepository } from '../../port';

export const fetchPositionsByAccount = createAsyncThunk<
  { account: Address; positions: Position[] },
  Address,
  { rejectValue: string; extra: PositionsThunkExtra }
>('positions/fetchPositionsByAccount', async (account, { rejectWithValue, extra }) => {
  try {
    const positions = await extra.positionRepository.getPositionsByAccount(account, true);
    return { account, positions };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

export const fetchCurrentPositions = createAsyncThunk<
  { account: Address; positions: Position[] },
  Address,
  { rejectValue: string; extra: PositionsThunkExtra }
>('positions/fetchCurrentPositions', async (account, { rejectWithValue, extra }) => {
  try {
    const positions = await extra.positionRepository.getCurrentPositions(account);
    return { account, positions };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

export interface PositionsThunkExtra {
  positionRepository: PositionRepository;
}
