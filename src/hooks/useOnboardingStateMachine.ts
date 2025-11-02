/**
 * @fileoverview Onboarding State Machine Hook
 * React hook that provides the onboarding state machine instance
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ConnectorType } from '@/constants/wallets';

import { createStateMachine, type StateMachine } from '@/lib/stateMachine';
import {
  OnboardingMachineContext,
  OnboardingMachineEvent,
  OnboardingMachineState,
  isTurnkeyWallet,
  requiresAccountDerivation,
} from '@/state/onboardingStateMachine';

import { log } from '@/lib/telemetry';

/**
 * Creates the onboarding state machine configuration
 */
function createOnboardingStateMachine() {
  const initialContext: OnboardingMachineContext = {
    lastTransitionTimestamp: Date.now(),
  };

  return createStateMachine<
    OnboardingMachineState,
    OnboardingMachineEvent,
    OnboardingMachineContext
  >({
    id: 'onboarding',
    initial: OnboardingMachineState.Idle,
    context: initialContext,

    states: {
      /* ===================================================================
       * IDLE STATE
       * Initial state when no wallet is selected
       * =================================================================== */
      [OnboardingMachineState.Idle]: {
        on: {
          SELECT_WALLET: {
            target: OnboardingMachineState.SelectingWallet,
            actions: [
              (context, event) => {
                context.selectedWallet = event.wallet;
                context.error = undefined;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },
        },
      },

      /* ===================================================================
       * SELECTING WALLET STATE
       * Wallet has been selected, determine which flow to follow
       * =================================================================== */
      [OnboardingMachineState.SelectingWallet]: {
        on: {
          // For Turnkey wallets, start authentication
          TURNKEY_AUTH_STARTED: {
            target: OnboardingMachineState.AuthenticatingTurnkey,
            guard: (context) => isTurnkeyWallet(context.selectedWallet),
            actions: [
              (context, event) => {
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          // For non-Turnkey wallets, start connection
          WALLET_CONNECTED: {
            target: OnboardingMachineState.WalletConnected,
            guard: (context) => !isTurnkeyWallet(context.selectedWallet),
            actions: [
              (context, event) => {
                context.walletAddress = event.address;
                context.walletChain = event.chain;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          WALLET_CONNECTION_FAILED: {
            target: OnboardingMachineState.Error,
            actions: [
              (context, event) => {
                context.error = event.error;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          DISCONNECT: {
            target: OnboardingMachineState.Disconnecting,
          },
        },
      },

      /* ===================================================================
       * CONNECTING WALLET STATE
       * External wallet connection in progress
       * =================================================================== */
      [OnboardingMachineState.ConnectingWallet]: {
        on: {
          WALLET_CONNECTED: {
            target: OnboardingMachineState.WalletConnected,
            actions: [
              (context, event) => {
                context.walletAddress = event.address;
                context.walletChain = event.chain;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          WALLET_CONNECTION_FAILED: {
            target: OnboardingMachineState.Error,
            actions: [
              (context, event) => {
                context.error = event.error;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          DISCONNECT: {
            target: OnboardingMachineState.Disconnecting,
          },
        },
      },

      /* ===================================================================
       * WALLET CONNECTED STATE
       * External wallet is connected, ready to derive account
       * =================================================================== */
      [OnboardingMachineState.WalletConnected]: {
        on: {
          START_DERIVE_ACCOUNT: {
            target: OnboardingMachineState.DerivingAccount,
            guard: (context) => requiresAccountDerivation(context.selectedWallet),
            actions: [
              (context) => {
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          // For wallets that don't need derivation (e.g., Cosmos with offline signer)
          ACCOUNT_DERIVED: {
            target: OnboardingMachineState.AccountConnected,
            guard: (context) => !requiresAccountDerivation(context.selectedWallet),
            actions: [
              (context, event) => {
                context.dydxAddress = event.dydxAddress;
                context.localDydxWallet = event.wallet;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          DISCONNECT: {
            target: OnboardingMachineState.Disconnecting,
          },
        },
      },

      /* ===================================================================
       * TURNKEY AUTHENTICATION STATES
       * =================================================================== */
      [OnboardingMachineState.AuthenticatingTurnkey]: {
        on: {
          // Email OTP flow
          TURNKEY_EMAIL_SENT: {
            target: OnboardingMachineState.TurnkeyAwaitingEmail,
            actions: [
              (context, event) => {
                context.turnkeyEmail = event.email;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          // OAuth flow (direct authentication)
          TURNKEY_AUTHENTICATED: {
            target: OnboardingMachineState.TurnkeyAuthenticated,
            actions: [
              (context, event) => {
                context.turnkeySession = event.session;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          TURNKEY_AUTH_FAILED: {
            target: OnboardingMachineState.Error,
            actions: [
              (context, event) => {
                context.error = event.error;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          DISCONNECT: {
            target: OnboardingMachineState.Disconnecting,
          },
        },
      },

      [OnboardingMachineState.TurnkeyAwaitingEmail]: {
        on: {
          TURNKEY_EMAIL_RECEIVED: {
            target: OnboardingMachineState.AuthenticatingTurnkey,
            actions: [
              (context, event) => {
                context.turnkeyToken = event.token;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          TURNKEY_AUTHENTICATED: {
            target: OnboardingMachineState.TurnkeyAuthenticated,
            actions: [
              (context, event) => {
                context.turnkeySession = event.session;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          TURNKEY_AUTH_FAILED: {
            target: OnboardingMachineState.Error,
            actions: [
              (context, event) => {
                context.error = event.error;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          DISCONNECT: {
            target: OnboardingMachineState.Disconnecting,
          },
        },
      },

      [OnboardingMachineState.TurnkeyAuthenticated]: {
        on: {
          START_DERIVE_ACCOUNT: {
            target: OnboardingMachineState.DerivingAccount,
            actions: [
              (context) => {
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          ACCOUNT_DERIVED: {
            target: OnboardingMachineState.UploadingTurnkeyAddress,
            guard: (context) => context.needsAddressUpload === true,
            actions: [
              (context, event) => {
                context.dydxAddress = event.dydxAddress;
                context.localDydxWallet = event.wallet;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          DISCONNECT: {
            target: OnboardingMachineState.Disconnecting,
          },
        },
      },

      /* ===================================================================
       * DERIVING ACCOUNT STATE
       * Deriving dYdX account from wallet signature
       * =================================================================== */
      [OnboardingMachineState.DerivingAccount]: {
        on: {
          ACCOUNT_DERIVED: {
            target: OnboardingMachineState.AccountConnected,
            guard: (context) => !isTurnkeyWallet(context.selectedWallet) || !context.needsAddressUpload,
            actions: [
              (context, event) => {
                context.dydxAddress = event.dydxAddress;
                context.localDydxWallet = event.wallet;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          TURNKEY_UPLOAD_STARTED: {
            target: OnboardingMachineState.UploadingTurnkeyAddress,
            guard: (context) =>
              isTurnkeyWallet(context.selectedWallet) && context.needsAddressUpload === true,
            actions: [
              (context) => {
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          ACCOUNT_DERIVATION_FAILED: {
            target: OnboardingMachineState.Error,
            actions: [
              (context, event) => {
                context.error = event.error;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          DISCONNECT: {
            target: OnboardingMachineState.Disconnecting,
          },
        },
      },

      /* ===================================================================
       * UPLOADING TURNKEY ADDRESS STATE
       * Uploading derived address to Turnkey backend
       * =================================================================== */
      [OnboardingMachineState.UploadingTurnkeyAddress]: {
        on: {
          TURNKEY_UPLOAD_SUCCESS: {
            target: OnboardingMachineState.AccountConnected,
            actions: [
              (context) => {
                context.needsAddressUpload = false;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          TURNKEY_UPLOAD_FAILED: {
            target: OnboardingMachineState.Error,
            actions: [
              (context, event) => {
                context.error = event.error;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          DISCONNECT: {
            target: OnboardingMachineState.Disconnecting,
          },
        },
      },

      /* ===================================================================
       * ACCOUNT CONNECTED STATE
       * Successfully connected and derived account
       * =================================================================== */
      [OnboardingMachineState.AccountConnected]: {
        on: {
          DISCONNECT: {
            target: OnboardingMachineState.Disconnecting,
          },

          RESET: {
            target: OnboardingMachineState.Idle,
            actions: [
              (context) => {
                // Clear all context
                Object.keys(context).forEach((key) => {
                  if (key !== 'lastTransitionTimestamp') {
                    delete context[key as keyof OnboardingMachineContext];
                  }
                });
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },
        },
      },

      /* ===================================================================
       * ERROR STATE
       * Something went wrong during onboarding
       * =================================================================== */
      [OnboardingMachineState.Error]: {
        entry: [
          (context) => {
            // Store previous error for debugging
            context.previousError = context.error;
          },
        ],
        on: {
          RETRY: {
            target: OnboardingMachineState.SelectingWallet,
            guard: (context) => !!context.selectedWallet,
            actions: [
              (context) => {
                context.error = undefined;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          CLEAR_ERROR: {
            target: OnboardingMachineState.Idle,
            actions: [
              (context) => {
                context.error = undefined;
                context.selectedWallet = undefined;
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },

          DISCONNECT: {
            target: OnboardingMachineState.Disconnecting,
          },

          RESET: {
            target: OnboardingMachineState.Idle,
            actions: [
              (context) => {
                Object.keys(context).forEach((key) => {
                  if (key !== 'lastTransitionTimestamp') {
                    delete context[key as keyof OnboardingMachineContext];
                  }
                });
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },
        },
      },

      /* ===================================================================
       * DISCONNECTING STATE
       * User requested disconnect
       * =================================================================== */
      [OnboardingMachineState.Disconnecting]: {
        entry: [
          async (context) => {
            // Cleanup actions will be performed by the hook
          },
        ],
        on: {
          RESET: {
            target: OnboardingMachineState.Idle,
            actions: [
              (context) => {
                Object.keys(context).forEach((key) => {
                  if (key !== 'lastTransitionTimestamp') {
                    delete context[key as keyof OnboardingMachineContext];
                  }
                });
                context.lastTransitionTimestamp = Date.now();
              },
            ],
          },
        },
      },
    },

    onTransition: (from, to, event) => {
      log('OnboardingStateMachine', `${from} -> ${to} (via ${event.type})`);
    },

    onError: (error, state, event) => {
      log('OnboardingStateMachine/error', error, { state, event: event.type });
    },
  });
}

/**
 * Hook to use the onboarding state machine
 */
export function useOnboardingStateMachine() {
  const machineRef = useRef<StateMachine<
    OnboardingMachineState,
    OnboardingMachineEvent,
    OnboardingMachineContext
  > | null>(null);

  // Create machine instance once
  if (machineRef.current === null) {
    machineRef.current = createOnboardingStateMachine();
  }

  const machine = machineRef.current;

  // Force re-render when state changes
  const [, forceUpdate] = useState({});

  const send = useCallback(
    async (event: OnboardingMachineEvent) => {
      await machine.send(event);
      forceUpdate({}); // Force re-render
    },
    [machine]
  );

  const state = machine.getState();
  const context = machine.getContext();

  return {
    state,
    context,
    send,
    matches: machine.matches,
    can: machine.can,
  };
}
