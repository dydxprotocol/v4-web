import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query';
import type { Address, PositionStableId } from '@sdk/shared/types';
import type { PositionRepository } from '../../../domain';

export const positionsApi = createApi({
  reducerPath: 'positionsApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['positions-by-address', 'positions-by-stable-id'],
  endpoints: (builder) => ({
    getPositionsByAddress: builder.query({
      async queryFn(address: Address, api) {
        try {
          const { positionRepository } = api.extra as PositionsThunkExtra;
          const result = await positionRepository.getPositionsByAccount(address);
          return { data: result ?? [] };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        }
      },
      providesTags: (_result, _error, arg) => [{ type: 'positions-by-address', id: arg }],
    }),
    getPositionsByStableId: builder.query({
      async queryFn(stableId: PositionStableId, api) {
        try {
          const { positionRepository } = api.extra as PositionsThunkExtra;
          const result = await positionRepository.getPositionsByStableId(stableId);
          return { data: result ?? [] };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        }
      },
      providesTags: (_result, _error, arg) => [{ type: 'positions-by-stable-id', id: arg }],
    }),
  }),
});

export interface PositionsThunkExtra {
  positionRepository: PositionRepository;
}
