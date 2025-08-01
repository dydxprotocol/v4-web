import type { DydxAddress, EvmAddress } from './wallets';
import { SolAddress } from './wallets';

export enum OnboardingSteps {
  SignIn = 'SignIn',
  ChooseWallet = 'ChooseWallet',
  KeyDerivation = 'KeyDerivation',
}

/**
 * @description The three main OnboardingStates,
 * - Disconnected
 * - WalletConnected
 * - AccountConnected
 */
export enum OnboardingState {
  Disconnected = 'Disconnected',
  WalletConnected = 'WalletConnected',
  AccountConnected = 'AccountConnected',
}

/**
 * @description Guards to determine what onboarding step a user should be on
 * - hasAcknowledgedTerms
 * - hasPreviousTransactions
 */
export enum OnboardingGuard {
  hasAcknowledgedTerms = 'hasAcknowledgedTerms',
  hasPreviousTransactions = 'hasPreviousTransactions',
}

export enum EvmDerivedAccountStatus {
  NotDerived,
  Deriving,
  EnsuringDeterminism,
  Derived,
}

export type EvmDerivedAddresses = {
  version?: string;
  [EvmAddress: EvmAddress]: {
    encryptedSignature?: string;
    dydxAddress?: DydxAddress;
  };
};

export type SolDerivedAddresses = {
  version?: string;
} & Record<
  SolAddress,
  {
    encryptedSignature?: string;
    dydxAddress?: DydxAddress;
  }
>;

export type Hdkey = {
  mnemonic: string;
  privateKey: Uint8Array | null;
  publicKey: Uint8Array | null;
};

export const AMOUNT_RESERVED_FOR_GAS_USDC = 1.25;
export const AMOUNT_USDC_BEFORE_REBALANCE = 1.0;
export const AMOUNT_RESERVED_FOR_GAS_DYDX = 0.1;
export const AMOUNT_RESERVED_FOR_GAS_NOBLE = 0.1;
export const AMOUNT_SAFE_GAS_FOR_TRANSACTION_USDC = 0.005;

/**
 * @description The number of parentSubaccounts: 0 - 127, 128 is the first childSubaccount
 */
export const NUM_PARENT_SUBACCOUNTS = 128;
export const MAX_SUBACCOUNT_NUMBER = 128000;

export type RawSubaccountFill = {
  clientMetadata: string;
  createdAt: string;
  createdAtHeight: string;
  fee: string;
  id: string;
  liquidity: string;
  market: string;
  marketType: string;
  orderId: string;
  price: string;
  side: string;
  size: string;
  subaccountNumber: number;
  type: string;
};

export type RawSubaccountTransfer = {
  id: string;
  sender: RawAccount;
  recipient: RawAccount;
  size: string;
  createdAt: string;
  createdAtHeight: string;
  symbol: string;
  type: string;
  transactionHash: string;
};

export type RawAccount = {
  address: string;
  subaccountNumber: number;
};
