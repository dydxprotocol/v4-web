import { combineReducers } from '@reduxjs/toolkit';
import type { ContractsService, WalletQueries } from '@sdk/Accounts';
import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { GraphQLClient } from 'graphql-request';
import * as Markets from './src/Markets';
import * as Positions from './src/Positions';
import * as ApplicationServices from './src/application';

export interface TradingModuleConfig {
  graphqlClient: GraphQLClient;
}

export const createTradingModule = ({ graphqlClient }: TradingModuleConfig) => {
  return {
    getThunkExtras: (): TradingThunkExtras => ({
      assetPriceRepository:
        Markets.marketsAdapters.createGraphQLAssetPriceRepository(graphqlClient),
      candleRepository: Markets.marketsAdapters.createGraphQLCandleRepository(graphqlClient),
      positionRepository:
        Positions.positionsAdapters.createGraphQLPositionRepository(graphqlClient),
    }),
    createCommandsAndQueries: (
      storeService: StoreService,
      contractsService: ContractsService,
      walletQueries: WalletQueries
    ) => {
      const positionCommands = Positions.createPositionCommands({ contractsService, storeService });
      const positionsQueries = Positions.createPositionQueries({ storeService });
      const marketCommands = Markets.createMarketCommands(storeService);
      const marketQueries = Markets.createMarketQueries(storeService);
      const tradingQueries = ApplicationServices.createTradingQueries({
        marketQueries,
        positionsQueries,
        walletQueries,
      });
      const tradingWorkflows = ApplicationServices.createTradingWorkflows({
        marketCommands,
        marketQueries,
        positionsQueries,
        walletQueries,
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

export const tradingReducer = combineReducers({
  markets: Markets.marketsReducer,
  positions: Positions.positionsReducer,
});

export const tradingApis = {
  ...Markets.marketsApis,
  ...Positions.positionsApis,
};

export const tradingMiddleware = [...Markets.marketsMiddleware, ...Positions.positionsMiddleware];

export type TradingModule = ReturnType<typeof createTradingModule>;
export type TradingThunkExtras = Markets.MarketsThunkExtra & Positions.PositionsThunkExtra;
