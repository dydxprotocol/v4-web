/**
 * @fileoverview Onboarding Orchestrator Hook
 * Coordinates the onboarding state machine with all wallet connection and account derivation side effects
 */

import { useCallback, useEffect, useRef } from 'react';

import { OnboardingState } from '@/constants/account';
import { ConnectorType, WalletInfo, WalletNetworkType } from '@/constants/wallets';

import { useOnboardingStateMachine } from './useOnboardingStateMachine';
import { OnboardingMachineState } from '@/state/onboardingStateMachine';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setOnboardingState } from '@/state/account';
import { setSourceAddress, setWalletInfo } from '@/state/wallet';
import { getSourceAccount } from '@/state/walletSelectors';

import { log } from '@/lib/telemetry';

/**
 * Props for the orchestrator
 */
export interface OnboardingOrchestratorProps {
  // Wallet connection functions
  connectWallet: (params: {
    wallet: WalletInfo;
    forceConnect?: boolean;
    isEvmAccountConnected?: boolean;
  }) => Promise<void>;
  disconnectWallet: () => Promise<void>;

  // Account derivation functions
  setWalletFromSignature: (signature: string) => Promise<string | undefined>;
  signMessageAsync?: () => Promise<string>;

  // Turnkey functions
  signInWithOauth?: (params: { oidcToken: string; providerName: 'google' | 'apple' }) => void;
  signInWithOtp?: (params: { userEmail: string }) => void;
  handleEmailMagicLink?: (params: { token: string }) => Promise<void>;
  uploadAddress?: (params: { dydxAddress: string }) => Promise<void>;

  // Wallet state
  evmAddress?: string;
  solAddress?: string;
  dydxAddress?: string;
  isConnectedWagmi?: boolean;
  isConnectedGraz?: boolean;
  authenticated?: boolean;

  // Turnkey state
  turnkeyEmailSignInStatus?: 'idle' | 'loading' | 'success' | 'error';
  turnkeyEmailSignInError?: string;
  needsAddressUpload?: boolean;
}

/**
 * Maps state machine states to legacy OnboardingState enum
 */
function mapMachineStateToOnboardingState(
  machineState: OnboardingMachineState
): OnboardingState {
  switch (machineState) {
    case OnboardingMachineState.Idle:
    case OnboardingMachineState.SelectingWallet:
    case OnboardingMachineState.Disconnecting:
      return OnboardingState.Disconnected;

    case OnboardingMachineState.ConnectingWallet:
    case OnboardingMachineState.WalletConnected:
    case OnboardingMachineState.AuthenticatingTurnkey:
    case OnboardingMachineState.TurnkeyAwaitingEmail:
    case OnboardingMachineState.TurnkeyAuthenticated:
    case OnboardingMachineState.DerivingAccount:
    case OnboardingMachineState.UploadingTurnkeyAddress:
      return OnboardingState.WalletConnected;

    case OnboardingMachineState.AccountConnected:
      return OnboardingState.AccountConnected;

    case OnboardingMachineState.Error:
      // Keep the previous state or default to Disconnected
      return OnboardingState.Disconnected;

    default:
      return OnboardingState.Disconnected;
  }
}

/**
 * Orchestrator hook that manages the entire onboarding flow using the state machine
 */
export function useOnboardingOrchestrator(props: OnboardingOrchestratorProps) {
  const dispatch = useAppDispatch();
  const sourceAccount = useAppSelector(getSourceAccount);
  const { state, context, send, matches, can } = useOnboardingStateMachine();

  // Track if we're performing an action to prevent infinite loops
  const isPerformingAction = useRef(false);

  /* ===================================================================
   * SYNC STATE MACHINE TO REDUX
   * =================================================================== */
  useEffect(() => {
    const onboardingState = mapMachineStateToOnboardingState(state);
    dispatch(setOnboardingState(onboardingState));
  }, [state, dispatch]);

  /* ===================================================================
   * WALLET SELECTION
   * =================================================================== */
  const selectWallet = useCallback(
    async (wallet: WalletInfo | undefined) => {
      if (isPerformingAction.current) return;

      try {
        isPerformingAction.current = true;

        if (!wallet) {
          // Disconnect
          await send({ type: 'DISCONNECT' });
          await props.disconnectWallet();
          await send({ type: 'RESET' });
          return;
        }

        // Select wallet in state machine
        await send({ type: 'SELECT_WALLET', wallet });

        // Update Redux
        dispatch(setWalletInfo(wallet));

        // Handle Turnkey separately
        if (wallet.connectorType === ConnectorType.Turnkey) {
          await send({ type: 'TURNKEY_AUTH_STARTED', method: 'oauth' });
          // Turnkey auth will be handled by TurnkeyAuthProvider
          return;
        }

        // For other wallets, connect via wallet provider
        try {
          await props.connectWallet({
            wallet,
            isEvmAccountConnected: Boolean(
              sourceAccount.chain === WalletNetworkType.Evm && sourceAccount.encryptedSignature
            ),
          });

          // Connection successful - determine address based on wallet type
          let address: string | undefined;
          let chain: WalletNetworkType | undefined;

          if (wallet.connectorType === ConnectorType.PhantomSolana && props.solAddress) {
            address = props.solAddress;
            chain = WalletNetworkType.Solana;
          } else if (wallet.connectorType === ConnectorType.Cosmos && props.dydxAddress) {
            address = props.dydxAddress;
            chain = WalletNetworkType.Cosmos;
          } else if (props.evmAddress) {
            address = props.evmAddress;
            chain = WalletNetworkType.Evm;
          }

          if (address && chain) {
            await send({ type: 'WALLET_CONNECTED', address, chain });
            dispatch(setSourceAddress({ address, chain }));
          }
        } catch (error) {
          await send({
            type: 'WALLET_CONNECTION_FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      } finally {
        isPerformingAction.current = false;
      }
    },
    [
      send,
      dispatch,
      props.connectWallet,
      props.disconnectWallet,
      props.evmAddress,
      props.solAddress,
      props.dydxAddress,
      sourceAccount.chain,
      sourceAccount.encryptedSignature,
    ]
  );

  /* ===================================================================
   * ACCOUNT DERIVATION
   * =================================================================== */
  const deriveAccount = useCallback(async () => {
    if (isPerformingAction.current) return;
    if (!matches(OnboardingMachineState.WalletConnected) && !matches(OnboardingMachineState.TurnkeyAuthenticated)) {
      return;
    }

    try {
      isPerformingAction.current = true;
      await send({ type: 'START_DERIVE_ACCOUNT' });

      // Get signature and derive account
      const signature = await props.signMessageAsync?.();
      if (!signature) {
        throw new Error('Failed to get signature');
      }

      const dydxAddress = await props.setWalletFromSignature(signature);
      if (!dydxAddress) {
        throw new Error('Failed to derive dYdX address');
      }

      // For now, we don't have access to the LocalWallet here, so we'll pass undefined
      // The actual wallet will be set by useAccounts
      await send({
        type: 'ACCOUNT_DERIVED',
        dydxAddress: dydxAddress as any,
        wallet: undefined as any,
      });

      // If Turnkey and needs upload
      if (context.selectedWallet?.connectorType === ConnectorType.Turnkey && context.needsAddressUpload) {
        await send({ type: 'TURNKEY_UPLOAD_STARTED' });
        try {
          await props.uploadAddress?.({ dydxAddress });
          await send({ type: 'TURNKEY_UPLOAD_SUCCESS' });
        } catch (error) {
          await send({
            type: 'TURNKEY_UPLOAD_FAILED',
            error: error instanceof Error ? error.message : 'Failed to upload address',
          });
        }
      }
    } catch (error) {
      await send({
        type: 'ACCOUNT_DERIVATION_FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      isPerformingAction.current = false;
    }
  }, [
    matches,
    send,
    props.signMessageAsync,
    props.setWalletFromSignature,
    props.uploadAddress,
    context.selectedWallet,
    context.needsAddressUpload,
  ]);

  /* ===================================================================
   * TURNKEY INTEGRATION
   * =================================================================== */

  // Handle Turnkey email status changes
  useEffect(() => {
    if (context.selectedWallet?.connectorType !== ConnectorType.Turnkey) return;

    (async () => {
      if (props.turnkeyEmailSignInStatus === 'success' && matches(OnboardingMachineState.AuthenticatingTurnkey)) {
        await send({ type: 'TURNKEY_AUTHENTICATED', session: '' });
      } else if (props.turnkeyEmailSignInStatus === 'error' && props.turnkeyEmailSignInError) {
        await send({ type: 'TURNKEY_AUTH_FAILED', error: props.turnkeyEmailSignInError });
      }
    })();
  }, [
    props.turnkeyEmailSignInStatus,
    props.turnkeyEmailSignInError,
    context.selectedWallet,
    matches,
    send,
  ]);

  // Sync Turnkey needsAddressUpload state
  useEffect(() => {
    if (props.needsAddressUpload !== undefined) {
      context.needsAddressUpload = props.needsAddressUpload;
    }
  }, [props.needsAddressUpload, context]);

  /* ===================================================================
   * DISCONNECT
   * =================================================================== */
  const disconnect = useCallback(async () => {
    await send({ type: 'DISCONNECT' });
    await props.disconnectWallet();
    await send({ type: 'RESET' });
  }, [send, props.disconnectWallet]);

  /* ===================================================================
   * AUTO-TRIGGER ACCOUNT DERIVATION
   * When wallet is connected and we have the necessary info, auto-derive
   * =================================================================== */
  useEffect(() => {
    if (
      matches(OnboardingMachineState.WalletConnected) &&
      context.walletAddress &&
      !isPerformingAction.current &&
      props.signMessageAsync
    ) {
      // Auto-trigger derivation for EVM wallets when wallet is connected
      // and we have an encrypted signature cached
      if (sourceAccount.encryptedSignature && !context.dydxAddress) {
        deriveAccount();
      }
    }
  }, [
    matches,
    context.walletAddress,
    context.dydxAddress,
    sourceAccount.encryptedSignature,
    props.signMessageAsync,
    deriveAccount,
  ]);

  /* ===================================================================
   * RETURN VALUES
   * =================================================================== */
  return {
    // State machine
    state,
    context,
    send,
    matches,
    can,

    // Actions
    selectWallet,
    deriveAccount,
    disconnect,

    // Helpers
    isIdle: matches(OnboardingMachineState.Idle),
    isSelectingWallet: matches(OnboardingMachineState.SelectingWallet),
    isConnectingWallet: matches(OnboardingMachineState.ConnectingWallet),
    isWalletConnected: matches(OnboardingMachineState.WalletConnected),
    isAuthenticatingTurnkey: matches(OnboardingMachineState.AuthenticatingTurnkey),
    isTurnkeyAwaitingEmail: matches(OnboardingMachineState.TurnkeyAwaitingEmail),
    isTurnkeyAuthenticated: matches(OnboardingMachineState.TurnkeyAuthenticated),
    isDerivingAccount: matches(OnboardingMachineState.DerivingAccount),
    isUploadingTurnkeyAddress: matches(OnboardingMachineState.UploadingTurnkeyAddress),
    isAccountConnected: matches(OnboardingMachineState.AccountConnected),
    isError: matches(OnboardingMachineState.Error),
    isDisconnecting: matches(OnboardingMachineState.Disconnecting),

    // Error info
    error: context.error,
  };
}
