import type { DydxAddress, EvmAddress } from './wallets';

export enum OnboardingSteps {
  ChooseWallet = 'ChooseWallet',
  KeyDerivation = 'KeyDerivation',
  AcknowledgeTerms = 'AcknowledgeTerms',
  DepositFunds = 'DepositFunds',
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

export const AMOUNT_RESERVED_FOR_GAS_USDC = 100_000;
