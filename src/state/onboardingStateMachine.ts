/**
 * @fileoverview Onboarding State Machine
 * Unified state machine for all wallet onboarding flows (EVM, Cosmos, Solana, Turnkey)
 */

import { WalletInfo, WalletNetworkType } from '@/constants/wallets';
import { DydxAddress } from '@/constants/wallets';
import type { LocalWallet } from '@dydxprotocol/v4-client-js';

/**
 * Onboarding States
 */
export enum OnboardingMachineState {
  // Initial state
  Idle = 'idle',

  // Wallet selection
  SelectingWallet = 'selectingWallet',

  // External wallet connection (MetaMask, Keplr, Phantom, etc.)
  ConnectingWallet = 'connectingWallet',
  WalletConnected = 'walletConnected',

  // Turnkey authentication
  AuthenticatingTurnkey = 'authenticatingTurnkey',
  TurnkeyAwaitingEmail = 'turnkeyAwaitingEmail',
  TurnkeyAuthenticated = 'turnkeyAuthenticated',

  // Account derivation
  DerivingAccount = 'derivingAccount',

  // Turnkey address upload
  UploadingTurnkeyAddress = 'uploadingTurnkeyAddress',

  // Final states
  AccountConnected = 'accountConnected',
  Error = 'error',

  // Disconnection
  Disconnecting = 'disconnecting',
}

/**
 * Onboarding Events
 */
export type OnboardingMachineEvent =
  | { type: 'SELECT_WALLET'; wallet: WalletInfo }
  | { type: 'WALLET_CONNECTED'; address: string; chain: WalletNetworkType }
  | { type: 'WALLET_CONNECTION_FAILED'; error: string }
  | { type: 'TURNKEY_AUTH_STARTED'; method: 'oauth' | 'email' | 'passkey' }
  | { type: 'TURNKEY_EMAIL_SENT'; email: string }
  | { type: 'TURNKEY_EMAIL_RECEIVED'; token: string }
  | { type: 'TURNKEY_AUTHENTICATED'; session: string }
  | { type: 'TURNKEY_AUTH_FAILED'; error: string }
  | { type: 'START_DERIVE_ACCOUNT' }
  | { type: 'ACCOUNT_DERIVED'; dydxAddress: DydxAddress; wallet: LocalWallet }
  | { type: 'ACCOUNT_DERIVATION_FAILED'; error: string }
  | { type: 'TURNKEY_UPLOAD_STARTED' }
  | { type: 'TURNKEY_UPLOAD_SUCCESS' }
  | { type: 'TURNKEY_UPLOAD_FAILED'; error: string }
  | { type: 'DISCONNECT' }
  | { type: 'RESET' }
  | { type: 'RETRY' }
  | { type: 'CLEAR_ERROR' };

/**
 * Onboarding Context
 */
export interface OnboardingMachineContext {
  // Wallet info
  selectedWallet?: WalletInfo;
  walletAddress?: string;
  walletChain?: WalletNetworkType;

  // dYdX account
  dydxAddress?: DydxAddress;
  localDydxWallet?: LocalWallet;

  // Turnkey specific
  turnkeyEmail?: string;
  turnkeyToken?: string;
  turnkeySession?: string;
  needsAddressUpload?: boolean;

  // Error handling
  error?: string;
  previousError?: string;

  // Metadata
  lastTransitionTimestamp?: number;
}

/**
 * Type guards for onboarding states
 */
export const OnboardingStateGuards = {
  isIdle: (state: OnboardingMachineState) => state === OnboardingMachineState.Idle,

  isSelectingWallet: (state: OnboardingMachineState) =>
    state === OnboardingMachineState.SelectingWallet,

  isConnectingWallet: (state: OnboardingMachineState) =>
    state === OnboardingMachineState.ConnectingWallet,

  isWalletConnected: (state: OnboardingMachineState) =>
    state === OnboardingMachineState.WalletConnected,

  isAuthenticatingTurnkey: (state: OnboardingMachineState) =>
    state === OnboardingMachineState.AuthenticatingTurnkey,

  isTurnkeyAwaitingEmail: (state: OnboardingMachineState) =>
    state === OnboardingMachineState.TurnkeyAwaitingEmail,

  isTurnkeyAuthenticated: (state: OnboardingMachineState) =>
    state === OnboardingMachineState.TurnkeyAuthenticated,

  isDerivingAccount: (state: OnboardingMachineState) =>
    state === OnboardingMachineState.DerivingAccount,

  isUploadingTurnkeyAddress: (state: OnboardingMachineState) =>
    state === OnboardingMachineState.UploadingTurnkeyAddress,

  isAccountConnected: (state: OnboardingMachineState) =>
    state === OnboardingMachineState.AccountConnected,

  isError: (state: OnboardingMachineState) => state === OnboardingMachineState.Error,

  isDisconnecting: (state: OnboardingMachineState) =>
    state === OnboardingMachineState.Disconnecting,

  // Composite guards
  isConnected: (state: OnboardingMachineState) =>
    state === OnboardingMachineState.WalletConnected ||
    state === OnboardingMachineState.TurnkeyAuthenticated ||
    state === OnboardingMachineState.AccountConnected,

  isInProgress: (state: OnboardingMachineState) =>
    state !== OnboardingMachineState.Idle &&
    state !== OnboardingMachineState.AccountConnected &&
    state !== OnboardingMachineState.Error,

  canRetry: (state: OnboardingMachineState) => state === OnboardingMachineState.Error,
};

/**
 * Helper to check if a wallet is Turnkey
 */
export const isTurnkeyWallet = (wallet?: WalletInfo): boolean => {
  return wallet?.connectorType === 'Turnkey';
};

/**
 * Helper to check if a wallet requires derivation
 */
export const requiresAccountDerivation = (wallet?: WalletInfo): boolean => {
  // Cosmos wallets with Keplr don't need derivation (they use offline signer)
  // Test wallets don't need derivation
  if (!wallet) return false;

  return (
    wallet.connectorType !== 'Cosmos' &&
    wallet.connectorType !== 'Test'
  );
};
