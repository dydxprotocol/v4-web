import type { B256Account } from '@sdk/shared/contracts';
import type { ContractId } from '@sdk/shared/types';
import { testnetTokenAbi, vaultAbi } from '@starboard/indexer/abis';
import type { Account } from 'fuels';
import { Contract } from 'fuels';

export interface ContractsService {
  getVaultContract: () => Promise<Contract>;
  getTestnetTokenContract: () => Promise<Contract>;
  getB256Account: () => Promise<B256Account | null>;
}

export interface ContractsServiceDependencies {
  walletGetter: WalletGetterFn;
  vaultContractId: ContractId;
  testnetTokenContractId?: ContractId;
}

export const createContractsService = ({
  vaultContractId,
  testnetTokenContractId,
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
    async getTestnetTokenContract() {
      const wallet = await walletGetter();
      if (!wallet) throw new Error('Wallet is not connected');
      if (!testnetTokenContractId) throw new Error('Testnet token contract ID is not configured');

      return new Contract(testnetTokenContractId, testnetTokenAbi, wallet);
    },
  };
};

export type WalletGetterFn = () => Promise<Account | null>;
