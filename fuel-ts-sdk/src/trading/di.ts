import { combineReducers } from '@reduxjs/toolkit';
import type { GraphQLClient } from 'graphql-request';
import type { StoreService } from '@/shared/lib/store-service';
import * as Domain from './src/domain-services';
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
      const domainCommands = Domain.createTradingDomainQueries({
        marketQueries,
        positionsQueries,
      });

      return {
        ...positionCommands,
        ...marketCommands,
        ...domainCommands,
        ...positionsQueries,
        ...marketQueries,
      };
    },
  };
};

export type TradingModule = ReturnType<typeof createTradingModule>;
export type TradingThunkExtras = Markets.MarketsThunkExtra & Positions.PositionsThunkExtra;
