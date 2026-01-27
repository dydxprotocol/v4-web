import { createTradingModule } from '@sdk/Trading/di';
import type { Account } from 'fuels';
import { GraphQLClient } from 'graphql-request';
import { createAccountsModule } from './Accounts/di';
import { createStoreService } from './shared/lib/StoreService';
import { createStore } from './shared/lib/redux';
import type { ContractId } from './shared/types';

export type StarboardClient = ReturnType<typeof createStarboardClient>;

export interface StarboardClientConfig {
  indexerUrl: string;
  vaultContractId: ContractId;
  accountGetter: () => Promise<Account | null>;
}

export const createStarboardClient = (config: StarboardClientConfig) => {
  const graphqlClient = new GraphQLClient(config.indexerUrl);

  const accountsModule = createAccountsModule({
    walletGetter: config.accountGetter,
    vaultContractId: config.vaultContractId,
  });
  const tradingModule = createTradingModule({ graphqlClient });

  const starboardStore = createStore({
    ...tradingModule.getThunkExtras(),
    ...accountsModule.getThunkExtras(),
  });
  const storeService = createStoreService(starboardStore);

  const accountsCommandsAndQueries = accountsModule.createCommandsAndQueries({ storeService });
  const tradingCommandsAndQueries = tradingModule.createCommandsAndQueries(
    storeService,
    accountsModule.services.contractsService,
    accountsCommandsAndQueries
  );

  return {
    accounts: accountsCommandsAndQueries,
    trading: tradingCommandsAndQueries,
    store: starboardStore,
  };
};
