# Onboarding State Machine Architecture

## Overview

This document describes the new unified onboarding state machine architecture that replaces the previous scattered implementation across `useWalletConnection`, `useAccounts`, `TurnkeyAuthProvider`, and `TurnkeyWalletProvider`.

## Problem Statement

### Previous Architecture Issues

1. **Complex State Spread**: Onboarding state was scattered across multiple hooks and providers
2. **Implicit Transitions**: State changes happened through side effects in `useEffect` hooks
3. **Race Conditions**: Multiple effects could trigger simultaneously
4. **Separate Turnkey Path**: Turnkey authentication had a completely different flow
5. **Hard to Debug**: No single source of truth for the current state
6. **Hard to Test**: Complex web of dependencies made unit testing difficult

### Solution

A unified state machine that:
- Provides a single source of truth for all onboarding state
- Makes state transitions explicit and predictable
- Handles all wallet types (EVM, Cosmos, Solana, Turnkey) in one flow
- Centralizes side effects as state machine actions
- Makes the flow easy to visualize, test, and debug

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     State Machine Core                       │
│                  (lib/stateMachine.ts)                       │
│  Generic state machine implementation with:                 │
│  - States, Events, Context                                   │
│  - Guards, Actions, Transitions                              │
│  - Entry/Exit hooks                                          │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Onboarding State Machine Config                 │
│          (state/onboardingStateMachine.ts)                   │
│  - OnboardingMachineState (enum)                             │
│  - OnboardingMachineEvent (union type)                       │
│  - OnboardingMachineContext (interface)                      │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           Onboarding State Machine Hook                      │
│       (hooks/useOnboardingStateMachine.ts)                   │
│  Creates and manages the state machine instance              │
│  - State transitions defined                                 │
│  - Guards and actions configured                             │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Onboarding Orchestrator Hook                    │
│        (hooks/useOnboardingOrchestrator.ts)                  │
│  Coordinates state machine with side effects:                │
│  - Wallet connection                                         │
│  - Account derivation                                        │
│  - Turnkey authentication                                    │
│  - Redux state sync                                          │
└─────────────────────────────────────────────────────────────┘
```

## State Diagram

```
                    ┌──────┐
                    │ Idle │
                    └──┬───┘
                       │ SELECT_WALLET
                       ▼
              ┌────────────────┐
              │ SelectingWallet │
              └────┬───────┬───┘
                   │       │
      ┌────────────┘       └──────────────┐
      │ TURNKEY_AUTH_STARTED              │ WALLET_CONNECTED
      │                                   │
      ▼                                   ▼
┌─────────────────┐              ┌─────────────────┐
│ Authenticating  │              │ WalletConnected │
│    Turnkey      │              └────────┬────────┘
└────┬───────┬────┘                       │
     │       │                            │ START_DERIVE_ACCOUNT
     │       │ TURNKEY_EMAIL_SENT         │
     │       ▼                            ▼
     │  ┌───────────────┐         ┌──────────────┐
     │  │ TurnkeyAwaiting│        │  Deriving    │
     │  │     Email      │        │  Account     │
     │  └───────┬────────┘        └──────┬───────┘
     │          │                        │
     │          │ TURNKEY_EMAIL_RECEIVED │ ACCOUNT_DERIVED
     │          └────────────────────────┤
     │                                   │
     │ TURNKEY_AUTHENTICATED             │
     └─────────────┬─────────────────────┘
                   │
                   ▼
         ┌──────────────────┐
         │   Turnkey        │
         │ Authenticated    │
         └────────┬─────────┘
                  │
                  │ (needs upload?)
                  │
      ┌───────────┴──────────────┐
      │ YES                      │ NO
      ▼                          ▼
┌──────────────────┐      ┌─────────────────┐
│   Uploading      │      │    Account      │
│ TurnkeyAddress   │      │   Connected     │
└────────┬─────────┘      └─────────────────┘
         │
         │ TURNKEY_UPLOAD_SUCCESS
         └──────────────────────►
```

## States

| State | Description | Entry Actions | Exit Actions |
|-------|-------------|---------------|--------------|
| `Idle` | Initial state, no wallet selected | - | - |
| `SelectingWallet` | User has selected a wallet | - | - |
| `ConnectingWallet` | Connecting to external wallet | - | - |
| `WalletConnected` | External wallet connected | - | - |
| `AuthenticatingTurnkey` | Turnkey auth in progress | - | - |
| `TurnkeyAwaitingEmail` | Waiting for email magic link | - | - |
| `TurnkeyAuthenticated` | Turnkey auth successful | - | - |
| `DerivingAccount` | Deriving dYdX account | - | - |
| `UploadingTurnkeyAddress` | Uploading address to Turnkey backend | - | - |
| `AccountConnected` | Final state - fully onboarded | - | - |
| `Error` | Error occurred | Store previous error | - |
| `Disconnecting` | User disconnecting | Cleanup | - |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `SELECT_WALLET` | `{ wallet: WalletInfo }` | User selected a wallet |
| `WALLET_CONNECTED` | `{ address: string, chain: WalletNetworkType }` | External wallet connected |
| `WALLET_CONNECTION_FAILED` | `{ error: string }` | Wallet connection failed |
| `TURNKEY_AUTH_STARTED` | `{ method: 'oauth' \| 'email' \| 'passkey' }` | Turnkey auth started |
| `TURNKEY_EMAIL_SENT` | `{ email: string }` | Email sent to user |
| `TURNKEY_EMAIL_RECEIVED` | `{ token: string }` | User clicked magic link |
| `TURNKEY_AUTHENTICATED` | `{ session: string }` | Turnkey auth successful |
| `TURNKEY_AUTH_FAILED` | `{ error: string }` | Turnkey auth failed |
| `START_DERIVE_ACCOUNT` | - | Start deriving account |
| `ACCOUNT_DERIVED` | `{ dydxAddress: DydxAddress, wallet: LocalWallet }` | Account derived |
| `ACCOUNT_DERIVATION_FAILED` | `{ error: string }` | Derivation failed |
| `TURNKEY_UPLOAD_STARTED` | - | Starting address upload |
| `TURNKEY_UPLOAD_SUCCESS` | - | Upload successful |
| `TURNKEY_UPLOAD_FAILED` | `{ error: string }` | Upload failed |
| `DISCONNECT` | - | User disconnecting |
| `RESET` | - | Reset to initial state |
| `RETRY` | - | Retry after error |
| `CLEAR_ERROR` | - | Clear error and reset |

## Context

The state machine context holds all the data needed during onboarding:

```typescript
interface OnboardingMachineContext {
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
```

## Usage

### Basic Usage

```typescript
import { useOnboardingOrchestrator } from '@/hooks/useOnboardingOrchestrator';

function MyComponent() {
  const {
    state,
    context,
    selectWallet,
    deriveAccount,
    disconnect,
    isWalletConnected,
    isAccountConnected,
    error,
  } = useOnboardingOrchestrator({
    connectWallet,
    disconnectWallet,
    setWalletFromSignature,
    signMessageAsync,
    evmAddress,
    solAddress,
    dydxAddress,
    isConnectedWagmi,
    isConnectedGraz,
    authenticated,
  });

  const handleWalletSelection = (wallet: WalletInfo) => {
    selectWallet(wallet);
  };

  return (
    <div>
      <p>Current State: {state}</p>
      {error && <p>Error: {error}</p>}
      {isWalletConnected && <button onClick={deriveAccount}>Derive Account</button>}
      {isAccountConnected && <p>Welcome! Address: {context.dydxAddress}</p>}
    </div>
  );
}
```

### Advanced: Sending Custom Events

```typescript
const { send } = useOnboardingOrchestrator(props);

// Manually trigger events
await send({ type: 'TURNKEY_AUTH_STARTED', method: 'oauth' });
await send({ type: 'WALLET_CONNECTED', address: '0x...', chain: WalletNetworkType.Evm });
```

### Checking State

```typescript
const { matches, can } = useOnboardingOrchestrator(props);

// Check current state
if (matches(OnboardingMachineState.WalletConnected)) {
  // ...
}

// Check if event is valid in current state
if (can('START_DERIVE_ACCOUNT')) {
  // ...
}
```

## Migration Guide

### From Old Architecture

**Before:**
```typescript
// Scattered across multiple hooks
const { selectWallet, selectedWallet } = useWalletConnection();
const { dydxAddress, setWalletFromSignature } = useAccounts();
const { signInWithOauth } = useTurnkeyAuth();
```

**After:**
```typescript
// Single unified hook
const {
  state,
  context,
  selectWallet,
  deriveAccount,
  isAccountConnected,
} = useOnboardingOrchestrator({
  // Pass in the necessary functions
  connectWallet,
  disconnectWallet,
  setWalletFromSignature,
  // ...
});
```

### Integrating with Existing Code

The orchestrator is designed to work alongside existing hooks during migration:

1. **Keep existing hooks** (`useWalletConnection`, `useAccounts`, etc.)
2. **Add orchestrator** to coordinate them
3. **Gradually migrate** components to use orchestrator
4. **Remove old hooks** once migration is complete

## Testing

### Unit Testing State Transitions

```typescript
import { createStateMachine } from '@/lib/stateMachine';
import { OnboardingMachineState } from '@/state/onboardingStateMachine';

test('transitions from Idle to SelectingWallet on SELECT_WALLET', async () => {
  const machine = createOnboardingStateMachine();

  expect(machine.state).toBe(OnboardingMachineState.Idle);

  await machine.send({ type: 'SELECT_WALLET', wallet: mockWallet });

  expect(machine.state).toBe(OnboardingMachineState.SelectingWallet);
  expect(machine.context.selectedWallet).toBe(mockWallet);
});
```

### Integration Testing

```typescript
test('complete onboarding flow for MetaMask', async () => {
  const { result } = renderHook(() => useOnboardingOrchestrator(mockProps));

  // Select wallet
  await act(async () => {
    await result.current.selectWallet(mockMetaMaskWallet);
  });

  expect(result.current.isSelectingWallet).toBe(true);

  // Simulate wallet connection
  await act(async () => {
    await result.current.send({
      type: 'WALLET_CONNECTED',
      address: '0x123...',
      chain: WalletNetworkType.Evm,
    });
  });

  expect(result.current.isWalletConnected).toBe(true);

  // Derive account
  await act(async () => {
    await result.current.deriveAccount();
  });

  expect(result.current.isAccountConnected).toBe(true);
});
```

## Benefits

### 1. **Single Source of Truth**
All onboarding state is centralized in one state machine

### 2. **Predictable State Transitions**
State can only change through well-defined events and transitions

### 3. **Easy to Debug**
Every state transition is logged with clear before/after states

### 4. **Type-Safe**
Full TypeScript support with strict typing for states, events, and context

### 5. **Testable**
Each state transition can be tested in isolation

### 6. **Visualizable**
State machine can be easily visualized and documented

### 7. **Unified Flows**
All wallet types (EVM, Cosmos, Solana, Turnkey) follow the same state machine

## Future Enhancements

1. **Persistence**: Save/restore state machine state to localStorage
2. **Analytics**: Auto-track state transitions for analytics
3. **Retry Logic**: Built-in exponential backoff for failed operations
4. **Timeout Handling**: Automatic timeouts for long-running states
5. **State History**: Track full history of state transitions for debugging
6. **Visualization Tool**: Dev tool to visualize current state in real-time

## Conclusion

The new state machine architecture provides a robust, maintainable, and testable foundation for the onboarding flow. It unifies all wallet types into a single flow, makes state transitions explicit, and provides a clear mental model for developers.
