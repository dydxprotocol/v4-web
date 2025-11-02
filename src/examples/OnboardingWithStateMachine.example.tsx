/**
 * @fileoverview Example: Onboarding with State Machine
 * This example shows how to integrate the new onboarding state machine
 * with the existing codebase during migration.
 */

import { useCallback } from 'react';

import { useOnboardingOrchestrator } from '@/hooks/useOnboardingOrchestrator';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useAccounts } from '@/hooks/useAccounts';
import { useTurnkeyAuth } from '@/providers/TurnkeyAuthProvider';
import { useTurnkeyWallet } from '@/providers/TurnkeyWalletProvider';
import useSignForWalletDerivation from '@/hooks/useSignForWalletDerivation';

import { OnboardingMachineState } from '@/state/onboardingStateMachine';
import { WalletInfo } from '@/constants/wallets';

/**
 * Example 1: Using the orchestrator with existing hooks
 */
export function OnboardingExample() {
  // Keep using existing hooks to access their functionality
  const walletConnection = useWalletConnection();
  const accounts = useAccounts();
  const turnkeyAuth = useTurnkeyAuth();
  const turnkeyWallet = useTurnkeyWallet();

  const signMessageAsync = useSignForWalletDerivation(accounts.sourceAccount.walletInfo);

  // Initialize the orchestrator with the existing hooks
  const onboarding = useOnboardingOrchestrator({
    // Wallet connection functions
    connectWallet: walletConnection.connectWallet,
    disconnectWallet: accounts.disconnect,

    // Account derivation functions
    setWalletFromSignature: accounts.setWalletFromSignature,
    signMessageAsync,

    // Turnkey functions
    signInWithOauth: turnkeyAuth.signInWithOauth,
    signInWithOtp: turnkeyAuth.signInWithOtp,
    uploadAddress: async ({ dydxAddress }) => {
      // Implementation from TurnkeyAuthProvider
      await turnkeyAuth.uploadAddress?.({ tkClient: undefined, dydxAddress });
    },

    // Wallet state
    evmAddress: accounts.sourceAccount.address,
    solAddress: accounts.sourceAccount.address,
    dydxAddress: accounts.dydxAddress,
    isConnectedWagmi: walletConnection.isConnectedWagmi,
    isConnectedGraz: walletConnection.isConnectedGraz,
    authenticated: false, // from usePrivy if needed

    // Turnkey state
    turnkeyEmailSignInStatus: turnkeyAuth.emailSignInStatus,
    turnkeyEmailSignInError: turnkeyAuth.emailSignInError,
    needsAddressUpload: turnkeyAuth.needsAddressUpload,
  });

  const handleWalletClick = useCallback(
    (wallet: WalletInfo) => {
      onboarding.selectWallet(wallet);
    },
    [onboarding]
  );

  const handleDerive = useCallback(() => {
    onboarding.deriveAccount();
  }, [onboarding]);

  return (
    <div>
      <h2>Onboarding Example</h2>

      {/* Show current state */}
      <div>
        <strong>State:</strong> {onboarding.state}
      </div>

      {/* Show error if any */}
      {onboarding.error && (
        <div style={{ color: 'red' }}>
          <strong>Error:</strong> {onboarding.error}
        </div>
      )}

      {/* Idle state - show wallet options */}
      {onboarding.isIdle && (
        <div>
          <h3>Select a Wallet</h3>
          <button onClick={() => handleWalletClick({ connectorType: 'Turnkey', name: 'Turnkey' })}>
            Turnkey
          </button>
          {/* Other wallet options... */}
        </div>
      )}

      {/* Selecting wallet */}
      {onboarding.isSelectingWallet && <div>Connecting to wallet...</div>}

      {/* Turnkey authentication */}
      {onboarding.isAuthenticatingTurnkey && <div>Authenticating with Turnkey...</div>}

      {/* Turnkey email sent */}
      {onboarding.isTurnkeyAwaitingEmail && (
        <div>
          <p>Email sent! Please check your inbox.</p>
          <p>Email: {onboarding.context.turnkeyEmail}</p>
        </div>
      )}

      {/* Wallet connected */}
      {onboarding.isWalletConnected && (
        <div>
          <p>Wallet Connected!</p>
          <p>Address: {onboarding.context.walletAddress}</p>
          <button onClick={handleDerive}>Derive dYdX Account</button>
        </div>
      )}

      {/* Deriving account */}
      {onboarding.isDerivingAccount && <div>Deriving dYdX account...</div>}

      {/* Uploading Turnkey address */}
      {onboarding.isUploadingTurnkeyAddress && <div>Uploading address to Turnkey...</div>}

      {/* Account connected */}
      {onboarding.isAccountConnected && (
        <div>
          <h3>Welcome!</h3>
          <p>dYdX Address: {onboarding.context.dydxAddress}</p>
          <button onClick={onboarding.disconnect}>Disconnect</button>
        </div>
      )}

      {/* Disconnecting */}
      {onboarding.isDisconnecting && <div>Disconnecting...</div>}
    </div>
  );
}

/**
 * Example 2: Checking state machine capabilities
 */
export function OnboardingStateChecks() {
  const onboarding = useOnboardingOrchestrator({
    /* ... props ... */
  } as any);

  return (
    <div>
      <h3>State Machine Capabilities</h3>

      {/* Check if specific state */}
      {onboarding.matches(OnboardingMachineState.WalletConnected) && (
        <p>Wallet is connected</p>
      )}

      {/* Check if event is valid in current state */}
      {onboarding.can('START_DERIVE_ACCOUNT') && (
        <button onClick={onboarding.deriveAccount}>Derive Account</button>
      )}

      {/* Manually send events */}
      <button
        onClick={() =>
          onboarding.send({
            type: 'WALLET_CONNECTED',
            address: '0x...',
            chain: 'evm' as any,
          })
        }
      >
        Manually Trigger Wallet Connected
      </button>

      {/* Access context */}
      <pre>{JSON.stringify(onboarding.context, null, 2)}</pre>
    </div>
  );
}

/**
 * Example 3: Integration in AccountsProvider
 * Shows how to integrate the orchestrator into the existing AccountsProvider
 */
export function IntegratedAccountsProvider({ ...props }) {
  const walletConnection = useWalletConnection();
  const accounts = useAccounts();
  const turnkeyAuth = useTurnkeyAuth();

  const signMessageAsync = useSignForWalletDerivation(accounts.sourceAccount.walletInfo);

  // Add the orchestrator alongside existing hooks
  const onboarding = useOnboardingOrchestrator({
    connectWallet: walletConnection.connectWallet,
    disconnectWallet: accounts.disconnect,
    setWalletFromSignature: accounts.setWalletFromSignature,
    signMessageAsync,
    signInWithOauth: turnkeyAuth.signInWithOauth,
    signInWithOtp: turnkeyAuth.signInWithOtp,
    evmAddress: accounts.sourceAccount.address,
    dydxAddress: accounts.dydxAddress,
    isConnectedWagmi: walletConnection.isConnectedWagmi,
    isConnectedGraz: walletConnection.isConnectedGraz,
    turnkeyEmailSignInStatus: turnkeyAuth.emailSignInStatus,
    turnkeyEmailSignInError: turnkeyAuth.emailSignInError,
    needsAddressUpload: turnkeyAuth.needsAddressUpload,
  });

  // Now components can access both the old hooks and the new orchestrator
  return (
    <div {...props}>
      {/* Existing components can continue using old hooks */}
      {/* New components can use the orchestrator */}
      <OnboardingExample />
    </div>
  );
}

/**
 * Example 4: Testing the state machine
 */
export function testOnboardingFlow() {
  // This shows how you would test the onboarding flow
  describe('Onboarding State Machine', () => {
    it('should transition from Idle to SelectingWallet', async () => {
      const { result } = renderHook(() =>
        useOnboardingOrchestrator({
          /* mock props */
        } as any)
      );

      expect(result.current.isIdle).toBe(true);

      await act(async () => {
        await result.current.selectWallet({
          connectorType: 'Turnkey',
          name: 'Turnkey',
        });
      });

      expect(result.current.isSelectingWallet).toBe(true);
    });

    it('should handle Turnkey OAuth flow', async () => {
      const { result } = renderHook(() =>
        useOnboardingOrchestrator({
          /* mock props */
        } as any)
      );

      // Select Turnkey wallet
      await act(async () => {
        await result.current.selectWallet({
          connectorType: 'Turnkey',
          name: 'Turnkey',
        });
      });

      // Start Turnkey auth
      await act(async () => {
        await result.current.send({
          type: 'TURNKEY_AUTH_STARTED',
          method: 'oauth',
        });
      });

      expect(result.current.isAuthenticatingTurnkey).toBe(true);

      // Simulate successful auth
      await act(async () => {
        await result.current.send({
          type: 'TURNKEY_AUTHENTICATED',
          session: 'mock-session',
        });
      });

      expect(result.current.isTurnkeyAuthenticated).toBe(true);
    });
  });
}

/**
 * Example 5: Migrating a component from old hooks to state machine
 */

// BEFORE: Using scattered hooks
function OldOnboardingDialog() {
  const { selectWallet, selectedWallet, selectedWalletError } = useWalletConnection();
  const { dydxAddress, setWalletFromSignature } = useAccounts();
  const { signInWithOauth } = useTurnkeyAuth();

  // Complex logic to determine current state...
  const isConnecting = selectedWallet && !dydxAddress;
  const isConnected = !!dydxAddress;

  return <div>{/* Complex conditional rendering based on scattered state */}</div>;
}

// AFTER: Using state machine
function NewOnboardingDialog() {
  const onboarding = useOnboardingOrchestrator({
    /* props */
  } as any);

  // Clear, explicit state checks
  return (
    <div>
      {onboarding.isIdle && <WalletSelectionStep onSelect={onboarding.selectWallet} />}
      {onboarding.isAuthenticatingTurnkey && <TurnkeyAuthStep />}
      {onboarding.isWalletConnected && <DeriveAccountStep onDerive={onboarding.deriveAccount} />}
      {onboarding.isAccountConnected && <WelcomeStep address={onboarding.context.dydxAddress} />}
      {onboarding.isError && <ErrorStep error={onboarding.error} />}
    </div>
  );
}
