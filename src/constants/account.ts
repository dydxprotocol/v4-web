/**
 * OnboardingSteps
 * 1. Choose between 3 options
 *  a. Ethereum EOA (current)
 *  b. Keplr or Other Cosmos (future)
 *  c. Social (future)
 * 2. Key derivation
 *  a. If wallet has no dYdX Chain transactions and not on whitelist, sign twice (future)
 *   i. Success
 *   ii. Signatures don't match error (Wallet is non-deterministic)
 *  b. Success
 * 3. Post Registration items (Only on first onboarding)
 *  a. Acknowledge Terms
 *  b. DepositFunds
 */
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

import type { DydxAddress, EthereumAddress } from './wallets';

export type EvmDerivedAddresses = {
  version?: string;
  [EthereumAddress: EthereumAddress]: {
    encryptedSignature?: string;
    dydxAddress?: DydxAddress;
  };
}

export const AMOUNT_RESERVED_FOR_GAS_USDC = 100_000;