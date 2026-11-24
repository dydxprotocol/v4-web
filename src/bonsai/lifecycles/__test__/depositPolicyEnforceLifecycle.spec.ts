import { fromBech32, toBech32 } from '@cosmjs/encoding';
import type { LocalWallet } from '@dydxprotocol/v4-client-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_APP_ENVIRONMENT, ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { WalletType } from '@/constants/wallets';
import { AddressFormat } from '@/types/turnkey';

import type { RootState, RootStore } from '@/state/_store';
import { walletEphemeralSlice } from '@/state/wallet';

import { localWalletManager } from '@/lib/hdKeyManager';
import response from '@/lib/turnkey/__test__/depositPolicyResponse.fixture.json';
import {
  type DepositPolicy,
  DepositPolicyStatus,
  type DepositPolicyTurnkeyClient,
  type fetchDepositPolicy,
  type syncDepositPolicy,
} from '@/lib/turnkey/depositPolicy';
import { DepositPolicyValidationError } from '@/lib/turnkey/depositPolicyExpectations';

import {
  type DepositPolicyEnforceDeps,
  enforceDepositPolicy,
  setUpDepositPolicyEnforceLifecycle,
} from '../depositPolicyEnforceLifecycle';

// A response of the indexer for an account that has everything left to approve, generated with
// the indexer's own code for the Injective address below.
const DYDX_ADDRESS = response.dydxAddress;
const INJECTIVE_ADDRESS = response.injectiveAddress;
const EVM_ADDRESS = response.evm.address;
const OTHER_DYDX_ADDRESS = 'dydx199tqg4wdlnu4qjlxchpd7seg454937hjrknju4';
// What an indexer that derived the address from the dYdX address would bridge to.
const INJECTIVE_ADDRESS_WITH_DYDX_BYTES = toBech32('inj', fromBech32(DYDX_ADDRESS).data);
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
  const policy = structuredClone(response) as DepositPolicy;
  if (evm !== DepositPolicyStatus.ACTION_REQUIRED) {
    policy.evm.approvals = policy.evm.approvals.map(({ chainId }) => ({ chainId, status: evm }));
  }
  policy.solana =
    solana === DepositPolicyStatus.ACTION_REQUIRED
      ? { ...policy.solana, obsoletePolicyIds }
      : { status: solana, obsoletePolicyIds };
  return policy;
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
  // The account shown. null for a user who is not signed in.
  dydxAddress?: string | null;
  indexerReady?: boolean;
  hasTurnkeyWallet?: boolean;
};

/** A store with just the state the lifecycle reads and the part it writes. */
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
  localWalletManager.setStore(store);

  return {
    store,
    setAccount: (account: AccountState) => {
      state = build(account, state.walletEphemeral);
      notify();
    },
    needsSignIn: () => state.walletEphemeral.turnkeyDepositPolicyNeedsSignIn,
  };
}

/** Has the app hold the wallets of an account, as it does once the user has signed in. */
function holdWallets(dydxAddress = DYDX_ADDRESS, injectiveAddress = INJECTIVE_ADDRESS) {
  localWalletManager.setLocalWallet(
    { address: dydxAddress } as LocalWallet,
    { address: injectiveAddress } as LocalWallet
  );
}

describe('enforceDepositPolicy', () => {
  const account = {
    dydxAddress: DYDX_ADDRESS,
    injectiveAddress: INJECTIVE_ADDRESS,
    indexerUrl: INDEXER_URL,
    turnkeyEvmAddress: EVM_ADDRESS,
  };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('syncs a policy that is out of date, for the Injective account the app holds', async () => {
    const policy = getPolicy();
    const deps = createDeps(policy);
    expect(await enforceDepositPolicy(account, deps)).toBe('synced');
    expect(deps.fetchDepositPolicy).toHaveBeenCalledWith({
      indexerUrl: INDEXER_URL,
      dydxAddress: DYDX_ADDRESS,
      injectiveAddress: INJECTIVE_ADDRESS,
    });
    expect(deps.syncDepositPolicy).toHaveBeenCalledWith({
      indexerUrl: INDEXER_URL,
      dydxAddress: DYDX_ADDRESS,
      injectiveAddress: INJECTIVE_ADDRESS,
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

  describe('refuses, without asking the user for anything, when', () => {
    const expectRefused = async (policy: DepositPolicy) => {
      // With no session, so that anything short of a refusal would ask the user to sign in.
      const deps = createDeps(policy, false);
      expect(await enforceDepositPolicy(account, deps)).toBe('refused');
      expect(deps.getTurnkeyUserSession).not.toHaveBeenCalled();
      expect(deps.syncDepositPolicy).not.toHaveBeenCalled();
    };

    it('the indexer answers for another Injective account than the one named', async () => {
      // As an indexer does that derives the address from the dYdX address.
      const policy = getPolicy();
      policy.injectiveAddress = INJECTIVE_ADDRESS_WITH_DYDX_BYTES;
      await expectRefused(policy);
    });

    it('the indexer answers for another dYdX account', async () => {
      const policy = getPolicy();
      policy.dydxAddress = OTHER_DYDX_ADDRESS;
      await expectRefused(policy);
    });

    it('the policy is for another wallet than the one in Turnkey', async () => {
      const policy = getPolicy();
      policy.evm.address = '0x00000000000000000000000000000000DeaDBeef';
      await expectRefused(policy);
    });

    it('a chain asks for something other than the expected approval', async () => {
      const policy = getPolicy();
      (policy.evm.approvals[4]!.typedData as any).message.hook =
        '0x00000000000000000000000000000000DeaDBeef';
      await expectRefused(policy);
    });

    it('the Solana policy is not the expected one', async () => {
      const policy = getPolicy();
      (policy.solana.policy as any).condition = 'true';
      await expectRefused(policy);
    });
  });

  it('reports a refusal by the sync as one', async () => {
    const deps = createDeps(getPolicy());
    deps.syncDepositPolicy.mockRejectedValue(
      new DepositPolicyValidationError('unexpected permissions')
    );
    expect(await enforceDepositPolicy(account, deps)).toBe('refused');
  });

  it('reports a failure instead of throwing', async () => {
    const failsToFetch = createDeps(getPolicy());
    failsToFetch.fetchDepositPolicy.mockRejectedValue(new Error('offline'));
    expect(await enforceDepositPolicy(account, failsToFetch)).toBe('failed');

    const failsToSync = createDeps(getPolicy());
    failsToSync.syncDepositPolicy.mockRejectedValue(new Error('session expired'));
    expect(await enforceDepositPolicy(account, failsToSync)).toBe('failed');
  });
});

describe('setUpDepositPolicyEnforceLifecycle', () => {
  // Lets the promises of a run that has been started settle.
  const settle = async () => {
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    localWalletManager.clearLocalWallet();
    vi.useRealTimers();
  });

  it('syncs the policy of a Turnkey user who enters with the earlier one', async () => {
    const { store, needsSignIn } = createStore();
    holdWallets();
    const deps = createDeps(getPolicy());
    setUpDepositPolicyEnforceLifecycle(store, deps);
    await settle();

    expect(deps.syncDepositPolicy).toHaveBeenCalledTimes(1);
    expect(deps.syncDepositPolicy.mock.calls[0]![0]).toMatchObject({
      indexerUrl: INDEXER_URL,
      dydxAddress: DYDX_ADDRESS,
      injectiveAddress: INJECTIVE_ADDRESS,
      expectedEvmAddress: EVM_ADDRESS,
    });
    expect(needsSignIn()).toBe(false);
  });

  it('names the Injective account of the wallet the app holds', async () => {
    const { store } = createStore();
    // Not the Injective account with the address bytes of the dYdX account.
    holdWallets(DYDX_ADDRESS, INJECTIVE_ADDRESS);
    const deps = createDeps(UP_TO_DATE);
    setUpDepositPolicyEnforceLifecycle(store, deps);
    await settle();

    expect(deps.fetchDepositPolicy).toHaveBeenCalledTimes(1);
    expect(deps.fetchDepositPolicy).toHaveBeenCalledWith({
      indexerUrl: INDEXER_URL,
      dydxAddress: DYDX_ADDRESS,
      injectiveAddress: INJECTIVE_ADDRESS,
    });
    expect(INJECTIVE_ADDRESS).not.toBe(INJECTIVE_ADDRESS_WITH_DYDX_BYTES);
  });

  it('waits for the account, its wallets and the indexer', async () => {
    const { store, setAccount } = createStore({ dydxAddress: null, indexerReady: false });
    const deps = createDeps(getPolicy());
    setUpDepositPolicyEnforceLifecycle(store, deps);
    await settle();
    expect(deps.fetchDepositPolicy).not.toHaveBeenCalled();

    setAccount({ indexerReady: false });
    await settle();
    expect(deps.fetchDepositPolicy).not.toHaveBeenCalled();

    // The account is shown before the app has derived its wallets.
    setAccount({});
    await settle();
    expect(deps.fetchDepositPolicy).not.toHaveBeenCalled();

    holdWallets();
    await settle();
    expect(deps.syncDepositPolicy).toHaveBeenCalledTimes(1);
  });

  it('leaves other kinds of wallets alone', async () => {
    const { store } = createStore({ walletType: WalletType.MetaMask });
    holdWallets();
    const deps = createDeps(getPolicy());
    setUpDepositPolicyEnforceLifecycle(store, deps);
    await settle();
    expect(deps.fetchDepositPolicy).not.toHaveBeenCalled();
  });

  it('leaves an account alone that is only being viewed', async () => {
    // The app holds the wallets of one account while another is shown.
    const { store } = createStore({ dydxAddress: OTHER_DYDX_ADDRESS });
    holdWallets(DYDX_ADDRESS);
    const deps = createDeps(getPolicy());
    setUpDepositPolicyEnforceLifecycle(store, deps);
    await settle();
    expect(deps.fetchDepositPolicy).not.toHaveBeenCalled();
  });

  it('checks an account once, however the state around it changes', async () => {
    const { store, setAccount } = createStore({ hasTurnkeyWallet: false });
    holdWallets();
    const deps = createDeps(getPolicy());
    setUpDepositPolicyEnforceLifecycle(store, deps);
    // The Turnkey wallet arrives while the first check is still running, and again after it.
    setAccount({});
    await settle();
    setAccount({ hasTurnkeyWallet: false });
    setAccount({});
    // The wallets are set again, as they are when the app re-derives them.
    holdWallets();
    await settle();
    await vi.advanceTimersByTimeAsync(10 * 60_000);

    expect(deps.fetchDepositPolicy).toHaveBeenCalledTimes(1);
    expect(deps.syncDepositPolicy).toHaveBeenCalledTimes(1);
  });

  it('checks again when the app holds another Injective account', async () => {
    const { store } = createStore();
    holdWallets();
    const deps = createDeps(UP_TO_DATE);
    setUpDepositPolicyEnforceLifecycle(store, deps);
    await settle();

    holdWallets(DYDX_ADDRESS, INJECTIVE_ADDRESS_WITH_DYDX_BYTES);
    await settle();

    expect(deps.fetchDepositPolicy).toHaveBeenCalledTimes(2);
    expect(deps.fetchDepositPolicy.mock.calls[1]![0].injectiveAddress).toBe(
      INJECTIVE_ADDRESS_WITH_DYDX_BYTES
    );
  });

  it('asks the user to sign in when there is no session, and syncs once they have', async () => {
    const { store, setAccount, needsSignIn } = createStore();
    holdWallets();
    const deps = createDeps(getPolicy(), false);
    setUpDepositPolicyEnforceLifecycle(store, deps);
    await settle();
    expect(needsSignIn()).toBe(true);
    expect(deps.syncDepositPolicy).not.toHaveBeenCalled();

    // It waits for the user: nothing is tried again in the meantime.
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(deps.fetchDepositPolicy).toHaveBeenCalledTimes(1);

    // Signing in again starts with signing out.
    localWalletManager.clearLocalWallet();
    setAccount({ dydxAddress: null, hasTurnkeyWallet: false });
    expect(needsSignIn()).toBe(false);

    deps.getTurnkeyUserSession.mockResolvedValue(TURNKEY);
    setAccount({});
    holdWallets();
    await settle();
    expect(deps.syncDepositPolicy).toHaveBeenCalledTimes(1);
    expect(needsSignIn()).toBe(false);
  });

  describe('for an account that could not be checked', () => {
    it('looks again at a new account once the indexer knows it', async () => {
      const { store, needsSignIn } = createStore();
      holdWallets();
      // The indexer does not know the account until its address has been uploaded.
      const deps = createDeps(undefined);
      setUpDepositPolicyEnforceLifecycle(store, deps);
      await settle();
      expect(deps.fetchDepositPolicy).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(4_999);
      expect(deps.fetchDepositPolicy).toHaveBeenCalledTimes(1);

      deps.fetchDepositPolicy.mockResolvedValue(getPolicy());
      await vi.advanceTimersByTimeAsync(1);
      await settle();
      expect(deps.fetchDepositPolicy).toHaveBeenCalledTimes(2);
      expect(deps.syncDepositPolicy).toHaveBeenCalledTimes(1);
      expect(needsSignIn()).toBe(false);

      // And then leaves it be.
      await vi.advanceTimersByTimeAsync(10 * 60_000);
      expect(deps.fetchDepositPolicy).toHaveBeenCalledTimes(2);
    });

    it('tries a failed sync again, without asking the user to sign in', async () => {
      const { store, needsSignIn } = createStore();
      holdWallets();
      const deps = createDeps(getPolicy());
      deps.syncDepositPolicy.mockRejectedValueOnce(new Error('could not reach Turnkey'));
      setUpDepositPolicyEnforceLifecycle(store, deps);
      await settle();
      expect(deps.syncDepositPolicy).toHaveBeenCalledTimes(1);
      expect(needsSignIn()).toBe(false);

      await vi.advanceTimersByTimeAsync(5_000);
      await settle();
      expect(deps.syncDepositPolicy).toHaveBeenCalledTimes(2);
    });

    it('gives up after a few tries, until the user enters again', async () => {
      const { store, setAccount } = createStore();
      holdWallets();
      const deps = createDeps(undefined);
      setUpDepositPolicyEnforceLifecycle(store, deps);
      await vi.advanceTimersByTimeAsync(60 * 60_000);
      // Once, and again after 5, 15 and 60 seconds.
      expect(deps.fetchDepositPolicy).toHaveBeenCalledTimes(4);

      localWalletManager.clearLocalWallet();
      setAccount({ dydxAddress: null });
      setAccount({});
      holdWallets();
      await settle();
      expect(deps.fetchDepositPolicy).toHaveBeenCalledTimes(5);
    });

    it('does not try again what it has refused', async () => {
      const { store, needsSignIn } = createStore();
      holdWallets();
      const policy = getPolicy();
      policy.injectiveAddress = INJECTIVE_ADDRESS_WITH_DYDX_BYTES;
      const deps = createDeps(policy, false);
      setUpDepositPolicyEnforceLifecycle(store, deps);
      await vi.advanceTimersByTimeAsync(60 * 60_000);

      expect(deps.fetchDepositPolicy).toHaveBeenCalledTimes(1);
      expect(deps.syncDepositPolicy).not.toHaveBeenCalled();
      expect(needsSignIn()).toBe(false);
    });

    it('stops trying when the user leaves', async () => {
      const { store, setAccount } = createStore();
      holdWallets();
      const deps = createDeps(undefined);
      setUpDepositPolicyEnforceLifecycle(store, deps);
      await settle();

      localWalletManager.clearLocalWallet();
      setAccount({ dydxAddress: null });
      await vi.advanceTimersByTimeAsync(60 * 60_000);
      expect(deps.fetchDepositPolicy).toHaveBeenCalledTimes(1);
    });
  });

  it('does not carry the request to sign in over to another account', async () => {
    const { store, setAccount, needsSignIn } = createStore();
    holdWallets();
    const deps = createDeps(getPolicy(), false);
    setUpDepositPolicyEnforceLifecycle(store, deps);
    await settle();
    expect(needsSignIn()).toBe(true);

    deps.fetchDepositPolicy.mockResolvedValue(undefined);
    setAccount({ dydxAddress: OTHER_DYDX_ADDRESS });
    holdWallets(OTHER_DYDX_ADDRESS);
    expect(needsSignIn()).toBe(false);
    await settle();
    expect(needsSignIn()).toBe(false);
  });

  it('ignores the result for an account the user has left', async () => {
    const { store, setAccount, needsSignIn } = createStore();
    holdWallets();
    const deps = createDeps(getPolicy(), false);
    setUpDepositPolicyEnforceLifecycle(store, deps);
    // The user signs out before the check of their policy has finished.
    localWalletManager.clearLocalWallet();
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
    holdWallets();
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    expect(deps.fetchDepositPolicy).not.toHaveBeenCalled();
  });

  it('stops trying again when it is torn down', async () => {
    const { store } = createStore();
    holdWallets();
    const deps = createDeps(undefined);
    const tearDown = setUpDepositPolicyEnforceLifecycle(store, deps);
    await settle();
    tearDown();
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    expect(deps.fetchDepositPolicy).toHaveBeenCalledTimes(1);
  });
});
