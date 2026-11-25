import { AddressFormat } from '@/types/turnkey';

import { type RootStore } from '@/state/_store';
import { getUserWalletAddress } from '@/state/accountInfoSelectors';
import { createAppSelector } from '@/state/appTypes';
import { setTurnkeyDepositPolicyNeedsSignIn } from '@/state/wallet';
import {
  getLocalWalletNonce,
  getTurnkeyDepositPolicyNeedsSignIn,
  getTurnkeyPrimaryWallet,
  selectIsTurnkeyConnected,
} from '@/state/walletSelectors';

import { localWalletManager } from '@/lib/hdKeyManager';
import {
  assertExpectedDepositPolicy,
  type DepositPolicyTurnkeySession,
  fetchDepositPolicy,
  getPendingDepositPolicyActions,
  syncDepositPolicy,
} from '@/lib/turnkey/depositPolicy';
import { DepositPolicyValidationError } from '@/lib/turnkey/depositPolicyExpectations';
import { getTurnkeyUserSession } from '@/lib/turnkey/turnkeySession';

import { createStoreEffect } from '../lib/createStoreEffect';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { selectIndexerReady, selectIndexerUrl } from '../socketSelectors';

const LOG_SOURCE = 'depositPolicyEnforceLifecycle';

// How long to wait before looking again at an account that could not be checked. A new account
// is one of these for a moment: the indexer does not know it until its address is uploaded,
// right after sign-up.
const RETRY_DELAYS_MS = [5_000, 15_000, 60_000];

type DepositPolicyAccount = {
  dydxAddress: string;
  // The Injective account whose key the app holds. Deposits are bridged to it, and sent on to
  // dYdX from it.
  injectiveAddress: string;
  indexerUrl: string;
  // The address of the account's EVM key in Turnkey, once the wallet has been loaded
  turnkeyEvmAddress: string | undefined;
};

export type DepositPolicyEnforceDeps = {
  fetchDepositPolicy: typeof fetchDepositPolicy;
  syncDepositPolicy: typeof syncDepositPolicy;
  getTurnkeyUserSession: () => Promise<DepositPolicyTurnkeySession | undefined>;
};

const defaultDeps: DepositPolicyEnforceDeps = {
  fetchDepositPolicy,
  syncDepositPolicy,
  getTurnkeyUserSession,
};

export type DepositPolicyEnforcementOutcome =
  // The indexer has no Turnkey account for the address, or does not serve deposit policies
  | 'not-found'
  | 'up-to-date'
  | 'synced'
  // The policy is out of date and there is no Turnkey session to update it with
  | 'needs-sign-in'
  // The indexer asked for something other than the expected policy. Nothing was approved.
  | 'refused'
  | 'failed';

/**
 * Checks, once, that the deposits of a Turnkey account are bridged to the Injective account the
 * app holds the key for, and has the user's Turnkey session approve that if they are not.
 * Approving needs the session, which only lasts a few minutes after sign-in.
 */
export async function enforceDepositPolicy(
  { dydxAddress, injectiveAddress, indexerUrl, turnkeyEvmAddress }: DepositPolicyAccount,
  deps: DepositPolicyEnforceDeps = defaultDeps
): Promise<DepositPolicyEnforcementOutcome> {
  try {
    const policy = await deps.fetchDepositPolicy({ indexerUrl, dydxAddress, injectiveAddress });
    if (policy == null) {
      return 'not-found';
    }

    // Before anything else, and before the user is asked for anything: what the indexer wants
    // approved has to be exactly the policy for this account and this Injective address.
    assertExpectedDepositPolicy({
      policy,
      dydxAddress,
      injectiveAddress,
      expectedEvmAddress: turnkeyEvmAddress,
    });

    const { isActionRequired, hasObsoletePolicies } = getPendingDepositPolicyActions(policy);
    if (!isActionRequired && !hasObsoletePolicies) {
      return 'up-to-date';
    }

    const turnkey = await deps.getTurnkeyUserSession();
    if (turnkey == null) {
      // Leftover policies are only tidied up when there is a session anyway.
      return isActionRequired ? 'needs-sign-in' : 'up-to-date';
    }

    const result = await deps.syncDepositPolicy({
      indexerUrl,
      dydxAddress,
      injectiveAddress,
      policy,
      turnkey,
      expectedEvmAddress: turnkeyEvmAddress,
    });
    logBonsaiInfo(LOG_SOURCE, 'deposit policy synced', { dydxAddress, ...result });
    return 'synced';
  } catch (error) {
    logBonsaiError(LOG_SOURCE, 'failed to sync deposit policy', { error, dydxAddress });
    return error instanceof DepositPolicyValidationError ? 'refused' : 'failed';
  }
}

const selectDepositPolicyAccount = createAppSelector(
  [
    selectIsTurnkeyConnected,
    getUserWalletAddress,
    getLocalWalletNonce,
    selectIndexerUrl,
    selectIndexerReady,
    getTurnkeyPrimaryWallet,
  ],
  (
    isTurnkeyConnected,
    dydxAddress,
    localWalletNonce,
    indexerUrl,
    indexerReady,
    primaryTurnkeyWallet
  ): DepositPolicyAccount | undefined => {
    if (!isTurnkeyConnected || dydxAddress == null || localWalletNonce == null || !indexerReady) {
      return undefined;
    }

    // The account shown has to be the one whose wallets the app holds. It is not while another
    // account is being viewed, and then there is nothing here to approve for it.
    const localDydxWallet = localWalletManager.getLocalWallet(localWalletNonce);
    const injectiveAddress = localWalletManager.getLocalInjectiveWallet(localWalletNonce)?.address;
    if (localDydxWallet?.address !== dydxAddress || injectiveAddress == null) {
      return undefined;
    }

    return {
      dydxAddress,
      injectiveAddress,
      indexerUrl,
      turnkeyEvmAddress: primaryTurnkeyWallet?.accounts.find(
        (account) => account.addressFormat === AddressFormat.Ethereum
      )?.address,
    };
  }
);

/**
 * @description Lifecycle that keeps the deposit policy of a Turnkey account up to date.
 *
 * Deposits to a Turnkey account's deposit addresses are bridged by the indexer to the Injective
 * account the app holds the key for, from where the app sends them on to dYdX. The indexer can
 * only do that within a policy the account has approved for that Injective address, and cannot
 * work the address out itself. So whenever a Turnkey user is in the app, this tells the indexer
 * the address and checks that the account permits bridging to it. A new account does not yet,
 * and neither does one set up for an earlier route; this then approves it for them.
 *
 * It asks nothing of the user while they have a Turnkey session. Without one it flags that they
 * need to sign in again, which the notification for it prompts them to do.
 */
export function setUpDepositPolicyEnforceLifecycle(
  store: RootStore,
  deps: DepositPolicyEnforceDeps = defaultDeps
) {
  // Accounts already dealt with since the page loaded, and those being dealt with now.
  const settled = new Set<string>();
  const inFlight = new Set<string>();
  // The account the app is showing, which is the only one the sign-in flag may speak for.
  let current: { key: string; account: DepositPolicyAccount } | undefined;
  let retryTimeout: ReturnType<typeof setTimeout> | undefined;

  const setNeedsSignIn = (needsSignIn: boolean) => {
    if (getTurnkeyDepositPolicyNeedsSignIn(store.getState()) !== needsSignIn) {
      store.dispatch(setTurnkeyDepositPolicyNeedsSignIn(needsSignIn));
    }
  };

  const enforce = (key: string, attempt: number) => {
    const account = current?.key === key ? current.account : undefined;
    if (account == null || settled.has(key) || inFlight.has(key)) {
      return;
    }

    inFlight.add(key);
    enforceDepositPolicy(account, deps)
      .then((outcome) => {
        inFlight.delete(key);
        if (outcome === 'up-to-date' || outcome === 'synced') {
          settled.add(key);
        }
        if (current?.key !== key) {
          return;
        }
        setNeedsSignIn(outcome === 'needs-sign-in');

        // An account the indexer does not know yet, or a request that failed, is looked at
        // again shortly. A missing session waits for the user to sign in, and a refusal is not
        // going to change.
        const retryDelay = RETRY_DELAYS_MS[attempt];
        if ((outcome === 'not-found' || outcome === 'failed') && retryDelay != null) {
          retryTimeout = setTimeout(() => enforce(key, attempt + 1), retryDelay);
        }
      })
      .catch(() => {
        inFlight.delete(key);
      });
  };

  const stopWatching = createStoreEffect(store, selectDepositPolicyAccount, (account) => {
    clearTimeout(retryTimeout);
    if (account == null) {
      current = undefined;
      setNeedsSignIn(false);
      return undefined;
    }

    const key = [account.indexerUrl, account.dydxAddress, account.injectiveAddress].join('|');
    if (key !== current?.key) {
      setNeedsSignIn(false);
    }
    current = { key, account };
    enforce(key, 0);
    return undefined;
  });

  return () => {
    clearTimeout(retryTimeout);
    current = undefined;
    stopWatching();
  };
}
