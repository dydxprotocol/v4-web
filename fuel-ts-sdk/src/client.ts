import { createTradingModule } from '@sdk/Trading/di';
import { GraphQLClient } from 'graphql-request';
import type { SdkConfig } from './shared/lib/SdkConfig';
import { createStoreService } from './shared/lib/StoreService';
import type { RootState } from './shared/lib/redux';
import { createStore } from './shared/lib/redux';
import type { ContractId } from './shared/types';

export type { RootState };
export type StarboardClient = ReturnType<typeof createStarboardClient>;

export interface StarboardClientConfig {
  indexerUrl: string;
  vaultAddress: ContractId;
}

export const createStarboardClient = (config: StarboardClientConfig) => {
  const graphqlClient = new GraphQLClient(config.indexerUrl);
  const sdkConfig: SdkConfig = {
    vaultAddress: config.vaultAddress,
  };
  const tradingModule = createTradingModule(graphqlClient, sdkConfig);

  const starboardStore = createStore(tradingModule.getThunkExtras());
  const storeService = createStoreService(starboardStore);

  return {
    trading: tradingModule.createCommandsAndQueries(storeService),
    store: starboardStore,
  };
};
