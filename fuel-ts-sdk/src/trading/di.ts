import { combineReducers } from '@reduxjs/toolkit';
import type { GraphQLClient } from 'graphql-request';

import { portfolioMetrics } from '@/cross-domain/portfolio';
import type { StoreService } from '@/shared/lib/store-service';

import * as Markets from './src/markets';
import * as Positions from './src/positions';

export const tradingReducer = combineReducers({
  markets: Markets.marketsReducer,
  positions: Positions.positionsReducer,
});

export const createTradingModule = (graphqlClient: GraphQLClient) => {
  const repositories = {
    markets: Markets.createRepositories(graphqlClient),
    positions: Positions.createRepositories(graphqlClient),
  };

  return {
    getThunkExtras: (): TradingThunkExtras => ({
      marketRepository: repositories.markets.graphQLMarketRepository,
      positionRepository: repositories.positions.graphQLPositionRepository,
    }),
    createServices: (storeService: StoreService) => ({
      markets: Markets.createServices(storeService),
      positions: Positions.createServices(storeService),
      portfolio: portfolioMetrics,
    }),
  };
};

export type TradingModule = ReturnType<typeof createTradingModule>;
export type TradingThunkExtras = Markets.MarketsThunkExtra & Positions.PositionsThunkExtra;
