import { combineReducers } from '@reduxjs/toolkit';
import type { ContractId } from '@sdk/shared/types';
import * as Wallet from './src/Wallet';
import { type WalletGetterFn, createContractsService } from './src/application';

export type AccountsModuleDependencies = {
  walletGetter: WalletGetterFn;
  vaultContractId: ContractId;
};

export const createAccountsModule = (deps: AccountsModuleDependencies) => {
  return {
    getThunkExtras: (): AccountsThunkExtras => ({
      walletGetter: deps.walletGetter,
    }),
    createCommandsAndQueries: (deps: Wallet.WalletQueriesDeps) => ({
      ...Wallet.createWalletCommands({ storeService: deps.storeService }),
      ...Wallet.createWalletQueries({ storeService: deps.storeService }),
    }),
    services: {
      contractsService: createContractsService({
        walletGetter: deps.walletGetter,
        vaultContractId: deps.vaultContractId,
      }),
    },
  };
};

export const accountsReducer = combineReducers({
  wallet: Wallet.walletReducer,
});

export type AccountsModule = ReturnType<typeof createAccountsModule>;
export type AccountsThunkExtras = Wallet.WalletThunkExtra;
