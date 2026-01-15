import { GraphQLClient } from 'graphql-request';
import { createTradingModule } from '@sdk/Trading/di';
import { createStoreService } from './shared/lib/StoreService';
import type { RootState } from './shared/lib/redux';
import { createStore } from './shared/lib/redux';

export type { RootState };
export type StarboardClient = ReturnType<typeof createStarboardClient>;

export interface StarboardClientConfig {
  indexerUrl: string;
}

export const createStarboardClient = (config: StarboardClientConfig) => {
  const graphqlClient = new GraphQLClient(config.indexerUrl);

  const tradingModule = createTradingModule(graphqlClient);

  const starboardStore = createStore(tradingModule.getThunkExtras());
  const storeService = createStoreService(starboardStore);

  return {
    trading: tradingModule.createCommandsAndQueries(storeService),
    store: starboardStore,
  };
};
