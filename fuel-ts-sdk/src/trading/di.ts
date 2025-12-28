import { combineReducers } from '@reduxjs/toolkit';
import type { GraphQLClient } from 'graphql-request';
import type { StoreService } from '@/shared/lib/store-service';
import * as Markets from './src/markets';
import * as Positions from './src/positions';

export const tradingReducer = combineReducers({
  markets: Markets.marketsReducer,
  positions: Positions.positionsReducer,
});

export const createTradingModule = (graphqlClient: GraphQLClient) => {
  return {
    getThunkExtras: (): TradingThunkExtras => ({
      assetPriceRepository: Markets.adapters.createGraphQLAssetPriceRepository(graphqlClient),
      candleRepository: Markets.adapters.createGraphQLCandleRepository(graphqlClient),
      marketConfigRepository: Markets.adapters.createGraphQLMarketConfigRepository(graphqlClient),

      positionRepository: Positions.adapters.createGraphQLPositionRepository(graphqlClient),
    }),
    createCommands: (storeService: StoreService) => {
      const positionCommands = Positions.createPositionCommands(storeService);
      const marketCommands = Markets.createMarketCommands(storeService);

      return {
        ...positionCommands,
        ...marketCommands,
      };
    },
  };
};

export type TradingModule = ReturnType<typeof createTradingModule>;
export type TradingThunkExtras = Markets.MarketsThunkExtra & Positions.PositionsThunkExtra;
