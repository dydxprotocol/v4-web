import type { ContractId } from '@sdk/shared/types';
import { vaultAbi } from '@starboard/indexer/abis';
import type { Account, B256Address } from 'fuels';
import { Contract } from 'fuels';

export interface ContractsService {
  getVaultContract: () => Promise<Contract>;
  getB256Account: () => Promise<B256Account | null>;
}

export interface ContractsServiceDependencies {
  walletGetter: WalletGetterFn;
  vaultContractId: ContractId;
}

export const createContractsService = ({
  vaultContractId,
  walletGetter,
}: ContractsServiceDependencies): ContractsService => {
  return {
    async getB256Account() {
      const account = await walletGetter();
      if (!account) return null;
      return { Address: { bits: account.address.toB256() } };
    },
    async getVaultContract() {
      const wallet = await walletGetter();
      if (!wallet) throw new Error('Wallet is not connected');

      return new Contract(vaultContractId, vaultAbi, wallet);
    },
  };
};

export type B256Account = {
  Address: {
    bits: B256Address;
  };
};

export type WalletGetterFn = () => Promise<Account | null>;
