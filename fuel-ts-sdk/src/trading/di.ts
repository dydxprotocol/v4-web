import { combineReducers } from '@reduxjs/toolkit';
import type { GraphQLClient } from 'graphql-request';
import type { StoreService } from '@/shared/lib/store-service';
import * as ApplicationServices from './src/application';
import * as Markets from './src/markets';
import * as Positions from './src/positions';

export const tradingReducer = combineReducers({
  ...Markets.marketsReducer,
  ...Positions.positionsReducer,
});

export const createTradingModule = (graphqlClient: GraphQLClient) => {
  return {
    getThunkExtras: (): TradingThunkExtras => ({
      assetPriceRepository:
        Markets.marketsAdapters.createGraphQLAssetPriceRepository(graphqlClient),
      marketConfigRepository:
        Markets.marketsAdapters.createGraphQLMarketConfigRepository(graphqlClient),
      candleRepository: Markets.marketsAdapters.createGraphQLCandleRepository(graphqlClient),
      positionRepository:
        Positions.positionsAdapters.createGraphQLPositionRepository(graphqlClient),
    }),
    createCommandsAndQueries: (storeService: StoreService) => {
      const positionCommands = Positions.createPositionCommands(storeService);
      const positionsQueries = Positions.createPositionQueries(storeService);
      const marketCommands = Markets.createMarketCommands(storeService);
      const marketQueries = Markets.createMarketQueries(storeService);
      const tradingQueries = ApplicationServices.createTradingQueries({
        marketQueries,
        positionsQueries,
      });
      const tradingWorkflows = ApplicationServices.createTradingWorkflows({
        marketCommands,
        marketQueries,
      });

      return {
        ...positionCommands,
        ...marketCommands,
        ...positionsQueries,
        ...marketQueries,
        ...tradingQueries,
        workflows: tradingWorkflows,
      };
    },
  };
};

export type TradingModule = ReturnType<typeof createTradingModule>;
export type TradingThunkExtras = Markets.MarketsThunkExtra & Positions.PositionsThunkExtra;
