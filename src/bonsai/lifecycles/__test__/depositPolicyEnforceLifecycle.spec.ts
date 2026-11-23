import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_APP_ENVIRONMENT, ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { WalletType } from '@/constants/wallets';
import { AddressFormat } from '@/types/turnkey';

import type { RootState, RootStore } from '@/state/_store';
import { walletEphemeralSlice } from '@/state/wallet';

import {
  type DepositPolicy,
  DepositPolicyStatus,
  type DepositPolicyTurnkeyClient,
  type fetchDepositPolicy,
  type syncDepositPolicy,
} from '@/lib/turnkey/depositPolicy';

import {
  type DepositPolicyEnforceDeps,
  enforceDepositPolicy,
  setUpDepositPolicyEnforceLifecycle,
} from '../depositPolicyEnforceLifecycle';

const DYDX_ADDRESS = 'dydx1qypqxpq9qcrsszg2pvxq6rs0zqg3yyc5kmz6xt';
const OTHER_DYDX_ADDRESS = 'dydx1qgpqxpq9qcrsszg2pvxq6rs0zqg3yyc5c8s62e';
const EVM_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const INDEXER_URL = ENVIRONMENT_CONFIG_MAP[DEFAULT_APP_ENVIRONMENT].endpoints.indexers[0]!.api;
const TURNKEY = {
  organizationId: '11111111-1111-4111-8111-111111111111',
  client: {} as DepositPolicyTurnkeyClient,
};

function getPolicy({
  evm = DepositPolicyStatus.ACTION_REQUIRED,
  solana = DepositPolicyStatus.ACTION_REQUIRED,
  obsoletePolicyIds = [] as string[],
} = {}): DepositPolicy {
  return {
    dydxAddress: DYDX_ADDRESS,
    injectiveAddress: 'inj1qypqxpq9qcrsszg2pvxq6rs0zqg3yyc54tm65y',
    evm: { address: EVM_ADDRESS, approvals: [{ chainId: '42161', status: evm, typedData: {} }] },
    solana: { status: solana, policy: {}, obsoletePolicyIds },
  };
}

const UP_TO_DATE = getPolicy({
  evm: DepositPolicyStatus.UP_TO_DATE,
  solana: DepositPolicyStatus.UP_TO_DATE,
});

function createDeps(policy: DepositPolicy | undefined, hasSession = true) {
  return {
    fetchDepositPolicy: vi.fn(async (_: Parameters<typeof fetchDepositPolicy>[0]) => policy),
    getTurnkeyUserSession: vi.fn(async () => (hasSession ? TURNKEY : undefined)),
    syncDepositPolicy: vi.fn(async (_: Parameters<typeof syncDepositPolicy>[0]) => ({
      approvedChainIds: ['42161'],
      solanaPolicyCreated: true,
      deletedPolicyIds: [],
    })),
  } satisfies DepositPolicyEnforceDeps;
}

type AccountState = {
  walletType?: WalletType;
  // null for a user who is not signed in
  dydxAddress?: string | null;
  indexerReady?: boolean;
  hasTurnkeyWallet?: boolean;
};

/** A store with just the state the lifecycle reads and the one flag it writes. */
function createStore(initial: AccountState = {}) {
  const listeners = new Set<() => void>();
  let state: RootState;

  const build = (
    {
      walletType = WalletType.Turnkey,
      dydxAddress = DYDX_ADDRESS,
      indexerReady = true,
      hasTurnkeyWallet = true,
    }: AccountState,
    walletEphemeral = walletEphemeralSlice.getInitialState()
  ) =>
    ({
      app: { selectedNetwork: DEFAULT_APP_ENVIRONMENT },
      raw: { network: { [DEFAULT_APP_ENVIRONMENT]: { indexerClientReady: indexerReady } } },
      wallet: {
        sourceAccount: { walletInfo: { name: walletType } },
        localWallet: dydxAddress == null ? undefined : { address: dydxAddress },
        turnkeyPrimaryWallet: hasTurnkeyWallet
          ? { accounts: [{ addressFormat: AddressFormat.Ethereum, address: EVM_ADDRESS }] }
          : undefined,
      },
      walletEphemeral,
    }) as unknown as RootState;

  const notify = () => listeners.forEach((listener) => listener());
  state = build(initial);

  const store = {
    getState: () => state,
    dispatch: (action: any) => {
      state = {
        ...state,
        walletEphemeral: walletEphemeralSlice.reducer(state.walletEphemeral, action),
      };
      notify();
      return action;
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  } as unknown as RootStore;

  return {
    store,
    setAccount: (account: AccountState) => {
      state = build(account, state.walletEphemeral);
      notify();
    },
    needsSignIn: () => state.walletEphemeral.turnkeyDepositPolicyNeedsSignIn,
  };
}

// Lets the promises of a run that has been started settle.
const settle = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

describe('enforceDepositPolicy', () => {
  const account = {
    dydxAddress: DYDX_ADDRESS,
    indexerUrl: INDEXER_URL,
    turnkeyEvmAddress: EVM_ADDRESS,
  };

  it('syncs a policy that is out of date', async () => {
    const policy = getPolicy();
    const deps = createDeps(policy);
    expect(await enforceDepositPolicy(account, deps)).toBe('synced');
    expect(deps.fetchDepositPolicy).toHaveBeenCalledWith({
      indexerUrl: INDEXER_URL,
      dydxAddress: DYDX_ADDRESS,
    });
    expect(deps.syncDepositPolicy).toHaveBeenCalledWith({
      indexerUrl: INDEXER_URL,
      dydxAddress: DYDX_ADDRESS,
      policy,
      turnkey: TURNKEY,
      expectedEvmAddress: EVM_ADDRESS,
    });
  });

  it('syncs when only one side is out of date', async () => {
    const onlySolana = createDeps(getPolicy({ evm: DepositPolicyStatus.UP_TO_DATE }));
    expect(await enforceDepositPolicy(account, onlySolana)).toBe('synced');

    const onlyEvm = createDeps(getPolicy({ solana: DepositPolicyStatus.UP_TO_DATE }));
    expect(await enforceDepositPolicy(account, onlyEvm)).toBe('synced');
  });

  it('does nothing for a policy that is up to date, without touching Turnkey', async () => {
    const deps = createDeps(UP_TO_DATE);
    expect(await enforceDepositPolicy(account, deps)).toBe('up-to-date');
    expect(deps.getTurnkeyUserSession).not.toHaveBeenCalled();
    expect(deps.syncDepositPolicy).not.toHaveBeenCalled();
  });

  it('does nothing for an account the indexer does not know', async () => {
    const deps = createDeps(undefined);
    expect(await enforceDepositPolicy(account, deps)).toBe('not-found');
    expect(deps.getTurnkeyUserSession).not.toHaveBeenCalled();
    expect(deps.syncDepositPolicy).not.toHaveBeenCalled();
  });

  it('needs the user to sign in when the policy is out of date and the session is over', async () => {
    const deps = createDeps(getPolicy(), false);
    expect(await enforceDepositPolicy(account, deps)).toBe('needs-sign-in');
    expect(deps.syncDepositPolicy).not.toHaveBeenCalled();
  });

  it('removes leftover policies when there is a session, and does not ask for one', async () => {
    const leftover = getPolicy({
      evm: DepositPolicyStatus.UP_TO_DATE,
      solana: DepositPolicyStatus.UP_TO_DATE,
      obsoletePolicyIds: ['33333333-3333-4333-8333-333333333333'],
    });
    const withSession = createDeps(leftover);
    expect(await enforceDepositPolicy(account, withSession)).toBe('synced');
    expect(withSession.syncDepositPolicy).toHaveBeenCalledTimes(1);

    const withoutSession = createDeps(leftover, false);
    expect(await enforceDepositPolicy(account, withoutSession)).toBe('up-to-date');
    expect(withoutSession.syncDepositPolicy).not.toHaveBeenCalled();
  });

  it('does not ask the user to sign in for chains the indexer cannot check', async () => {
    const deps = createDeps(
      getPolicy({ evm: DepositPolicyStatus.UNAVAILABLE, solana: DepositPolicyStatus.UNAVAILABLE }),
      false
    );
    expect(await enforceDepositPolicy(account, deps)).toBe('up-to-date');
  });

  it('reports a failure instead of throwing', async () => {
    const failsToFetch = createDeps(getPolicy());
    failsToFetch.fetchDepositPolicy.mockRejectedValue(new Error('offline'));
    expect(await enforceDepositPolicy(account, failsToFetch)).toBe('failed');

    const failsToSync = createDeps(getPolicy());
    failsToSync.syncDepositPolicy.mockRejectedValue(new Error('unexpected permissions'));
    expect(await enforceDepositPolicy(account, failsToSync)).toBe('failed');
  });
});

describe('setUpDepositPolicyEnforceLifecycle', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('syncs the policy of a Turnkey user who enters with the earlier one', async () => {
    const { store, needsSignIn } = createStore();
    const deps = createDeps(getPolicy());
    setUpDepositPolicyEnforceLifecycle(store, deps);
    await settle();

    expect(deps.syncDepositPolicy).toHaveBeenCalledTimes(1);
    expect(deps.syncDepositPolicy.mock.calls[0]![0]).toMatchObject({
      indexerUrl: INDEXER_URL,
      dydxAddress: DYDX_ADDRESS,
      expectedEvmAddress: EVM_ADDRESS,
    });
    expect(needsSignIn()).toBe(false);
  });

  it('waits for the account and the indexer', async () => {
    const { store, setAccount } = createStore({ dydxAddress: null, indexerReady: false });
    const deps = createDeps(getPolicy());
    setUpDepositPolicyEnforceLifecycle(store, deps);
    await settle();
    expect(deps.fetchDepositPolicy).not.toHaveBeenCalled();

    setAccount({ indexerReady: false });
    await settle();
    expect(deps.fetchDepositPolicy).not.toHaveBeenCalled();

    setAccount({});
    await settle();
    expect(deps.syncDepositPolicy).toHaveBeenCalledTimes(1);
  });

  it('leaves other kinds of wallets alone', async () => {
    const { store } = createStore({ walletType: WalletType.MetaMask });
    const deps = createDeps(getPolicy());
    setUpDepositPolicyEnforceLifecycle(store, deps);
    await settle();
    expect(deps.fetchDepositPolicy).not.toHaveBeenCalled();
  });

  it('checks an account once, however the state around it changes', async () => {
    const { store, setAccount } = createStore({ hasTurnkeyWallet: false });
    const deps = createDeps(getPolicy());
    setUpDepositPolicyEnforceLifecycle(store, deps);
    // The Turnkey wallet arrives while the first check is still running, and again after it.
    setAccount({});
    await settle();
    setAccount({ hasTurnkeyWallet: false });
    setAccount({});
    await settle();

    expect(deps.fetchDepositPolicy).toHaveBeenCalledTimes(1);
    expect(deps.syncDepositPolicy).toHaveBeenCalledTimes(1);
  });

  it('asks the user to sign in when there is no session, and syncs once they have', async () => {
    const { store, setAccount, needsSignIn } = createStore();
    const deps = createDeps(getPolicy(), false);
    setUpDepositPolicyEnforceLifecycle(store, deps);
    await settle();
    expect(needsSignIn()).toBe(true);
    expect(deps.syncDepositPolicy).not.toHaveBeenCalled();

    // Signing in again starts with signing out.
    setAccount({ dydxAddress: null, hasTurnkeyWallet: false });
    expect(needsSignIn()).toBe(false);

    deps.getTurnkeyUserSession.mockResolvedValue(TURNKEY);
    setAccount({});
    await settle();
    expect(deps.syncDepositPolicy).toHaveBeenCalledTimes(1);
    expect(needsSignIn()).toBe(false);
  });

  it('does not ask the user to sign in when the sync fails', async () => {
    const { store, setAccount, needsSignIn } = createStore();
    const deps = createDeps(getPolicy());
    deps.syncDepositPolicy.mockRejectedValueOnce(new Error('unexpected permissions'));
    setUpDepositPolicyEnforceLifecycle(store, deps);
    await settle();
    expect(needsSignIn()).toBe(false);

    // It is tried again the next time the user enters.
    setAccount({ dydxAddress: null });
    setAccount({});
    await settle();
    expect(deps.syncDepositPolicy).toHaveBeenCalledTimes(2);
  });

  it('does not carry the request to sign in over to another account', async () => {
    const { store, setAccount, needsSignIn } = createStore();
    const deps = createDeps(getPolicy(), false);
    setUpDepositPolicyEnforceLifecycle(store, deps);
    await settle();
    expect(needsSignIn()).toBe(true);

    deps.fetchDepositPolicy.mockResolvedValue(UP_TO_DATE);
    setAccount({ dydxAddress: OTHER_DYDX_ADDRESS });
    expect(needsSignIn()).toBe(false);
    await settle();
    expect(needsSignIn()).toBe(false);
  });

  it('ignores the result for an account the user has left', async () => {
    const { store, setAccount, needsSignIn } = createStore();
    const deps = createDeps(getPolicy(), false);
    setUpDepositPolicyEnforceLifecycle(store, deps);
    // The user signs out before the check of their policy has finished.
    setAccount({ dydxAddress: null });
    await settle();
    expect(needsSignIn()).toBe(false);
  });

  it('stops when it is torn down', async () => {
    const { store, setAccount } = createStore({ dydxAddress: null });
    const deps = createDeps(getPolicy());
    const tearDown = setUpDepositPolicyEnforceLifecycle(store, deps);
    tearDown();
    setAccount({});
    await settle();
    expect(deps.fetchDepositPolicy).not.toHaveBeenCalled();
  });
});
