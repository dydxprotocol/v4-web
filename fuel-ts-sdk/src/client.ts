import { createTradingModule } from '@sdk/Trading/di';
import type { Account } from 'fuels';
import { GraphQLClient } from 'graphql-request';
import { createAccountsModule } from './Accounts/di';
import {
  createTestnetTokenCommands,
  createVaultCommands,
  createVaultQueries,
} from './shared/contracts';
import { createStoreService } from './shared/lib/StoreService';
import { createStore } from './shared/lib/redux';
import type { ContractId } from './shared/types';

export type StarboardClient = ReturnType<typeof createStarboardClient>;

export interface StarboardClientConfig {
  indexerUrl: string;
  vaultContractId: ContractId;
  testnetTokenContractId?: ContractId;
  accountGetter: () => Promise<Account | null>;
}

export const createStarboardClient = (config: StarboardClientConfig) => {
  const graphqlClient = new GraphQLClient(config.indexerUrl);

  const accountsModule = createAccountsModule({
    walletGetter: config.accountGetter,
    vaultContractId: config.vaultContractId,
    testnetTokenContractId: config.testnetTokenContractId,
  });
  const tradingModule = createTradingModule({ graphqlClient });

  const starboardStore = createStore({
    ...tradingModule.getThunkExtras(),
    ...accountsModule.getThunkExtras(),
  });
  const storeService = createStoreService(starboardStore);

  const vaultCommands = createVaultCommands({
    vaultContractPort: accountsModule.services.contractsService,
    storeService,
  });
  const vaultQueries = createVaultQueries({
    vaultContractPort: accountsModule.services.contractsService,
  });
  const testnetTokenCommands = createTestnetTokenCommands({
    testnetTokenContractPort: accountsModule.services.contractsService,
    storeService,
  });

  const accountsCommandsAndQueries = accountsModule.createCommandsAndQueries({ storeService });
  const tradingCommandsAndQueries = tradingModule.createCommandsAndQueries({
    storeService,
    vaultCommands,
    vaultQueries,
    walletQueries: accountsCommandsAndQueries,
  });

  return {
    accounts: accountsCommandsAndQueries,
    trading: tradingCommandsAndQueries,

    __extra: {
      faucet: testnetTokenCommands.faucet,
      getFundingInfo: vaultQueries.getFundingInfo,
    },
    store: starboardStore,
  };
};
