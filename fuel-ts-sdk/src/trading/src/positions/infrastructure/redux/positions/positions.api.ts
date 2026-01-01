import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query';
import type { Address } from '@/shared/types';
import type { Position, PositionRepository } from '../../../domain';

export interface GetPositionsArgs {
  address: Address;
}

export const positionsApi = createApi({
  reducerPath: 'positionsApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Positions'],
  endpoints: (builder) => ({
    getPositions: builder.query<Position[], GetPositionsArgs>({
      async queryFn(args, api) {
        try {
          const { positionRepository } = api.extra as PositionsThunkExtra;
          const data = await positionRepository.getPositionsByAccount(args.address);
          return { data };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        }
      },
      providesTags: (_result, _error, args) => [{ type: 'Positions', id: args.address }],
    }),
  }),
});

export interface PositionsThunkExtra {
  positionRepository: PositionRepository;
}
