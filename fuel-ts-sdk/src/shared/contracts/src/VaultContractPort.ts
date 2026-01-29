import type { B256Address, Contract } from 'fuels';

export interface VaultContractPort {
  getVaultContract(): Promise<Contract>;
  getB256Account(): Promise<B256Account | null>;
}

export type B256Account = {
  Address: {
    bits: B256Address;
  };
};
