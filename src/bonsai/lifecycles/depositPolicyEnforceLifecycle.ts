import { AddressFormat } from '@/types/turnkey';

import { type RootStore } from '@/state/_store';
import { getUserWalletAddress } from '@/state/accountInfoSelectors';
import { createAppSelector } from '@/state/appTypes';
import { setTurnkeyDepositPolicyNeedsSignIn } from '@/state/wallet';
import {
  getTurnkeyDepositPolicyNeedsSignIn,
  getTurnkeyPrimaryWallet,
  selectIsTurnkeyConnected,
} from '@/state/walletSelectors';

import {
  type DepositPolicyTurnkeySession,
  fetchDepositPolicy,
  getPendingDepositPolicyActions,
  syncDepositPolicy,
} from '@/lib/turnkey/depositPolicy';
import { getTurnkeyUserSession } from '@/lib/turnkey/turnkeySession';

import { createStoreEffect } from '../lib/createStoreEffect';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { selectIndexerReady, selectIndexerUrl } from '../socketSelectors';

const LOG_SOURCE = 'depositPolicyEnforceLifecycle';

type DepositPolicyAccount = {
  dydxAddress: string;
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
  | 'failed';

/**
 * Checks the deposit policy of a Turnkey account once, and brings it up to date if it is not.
 * Updating needs the user's Turnkey session, which only lasts a few minutes after sign-in.
 */
export async function enforceDepositPolicy(
  { dydxAddress, indexerUrl, turnkeyEvmAddress }: DepositPolicyAccount,
  deps: DepositPolicyEnforceDeps = defaultDeps
): Promise<DepositPolicyEnforcementOutcome> {
  try {
    const policy = await deps.fetchDepositPolicy({ indexerUrl, dydxAddress });
    if (policy == null) {
      return 'not-found';
    }

    const { isActionRequired, hasObsoletePolicies } = getPendingDepositPolicyActions(policy);
    if (!isActionRequired && !hasObsoletePolicies) {
      return 'up-to-date';
    }

    const turnkey = await deps.getTurnkeyUserSession();
    if (turnkey == null) {
      // Leftover policies of the earlier route are only tidied up when there is a session anyway.
      return isActionRequired ? 'needs-sign-in' : 'up-to-date';
    }

    const result = await deps.syncDepositPolicy({
      indexerUrl,
      dydxAddress,
      policy,
      turnkey,
      expectedEvmAddress: turnkeyEvmAddress,
    });
    logBonsaiInfo(LOG_SOURCE, 'deposit policy synced', { dydxAddress, ...result });
    return 'synced';
  } catch (error) {
    logBonsaiError(LOG_SOURCE, 'failed to sync deposit policy', { error, dydxAddress });
    return 'failed';
  }
}

const selectDepositPolicyAccount = createAppSelector(
  [
    selectIsTurnkeyConnected,
    getUserWalletAddress,
    selectIndexerUrl,
    selectIndexerReady,
    getTurnkeyPrimaryWallet,
  ],
  (
    isTurnkeyConnected,
    dydxAddress,
    indexerUrl,
    indexerReady,
    primaryTurnkeyWallet
  ): DepositPolicyAccount | undefined => {
    if (!isTurnkeyConnected || dydxAddress == null || !indexerReady) {
      return undefined;
    }
    return {
      dydxAddress,
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
 * Deposits to a Turnkey account's deposit addresses are bridged by the indexer, within a policy
 * the account has approved. When the route deposits take changes, accounts set up before the
 * change still permit only the earlier route, and their deposits are not bridged until the user
 * approves the new one. Whenever a Turnkey user is in the app, this checks their policy and, if
 * it is out of date, approves the current one for them. It asks nothing of the user while they
 * have a Turnkey session; without one it flags that they need to sign in again, which the
 * notification for it prompts them to do.
 */
export function setUpDepositPolicyEnforceLifecycle(
  store: RootStore,
  deps: DepositPolicyEnforceDeps = defaultDeps
) {
  // Accounts already dealt with since the page loaded, and those being dealt with now.
  const settled = new Set<string>();
  const inFlight = new Set<string>();
  // The account the app is showing, which is the only one the sign-in flag may speak for.
  let currentKey: string | undefined;

  const setNeedsSignIn = (needsSignIn: boolean) => {
    if (getTurnkeyDepositPolicyNeedsSignIn(store.getState()) !== needsSignIn) {
      store.dispatch(setTurnkeyDepositPolicyNeedsSignIn(needsSignIn));
    }
  };

  return createStoreEffect(store, selectDepositPolicyAccount, (account) => {
    if (account == null) {
      currentKey = undefined;
      setNeedsSignIn(false);
      return undefined;
    }

    const key = `${account.indexerUrl}|${account.dydxAddress}`;
    if (key !== currentKey) {
      currentKey = key;
      setNeedsSignIn(false);
    }
    if (settled.has(key) || inFlight.has(key)) {
      return undefined;
    }

    inFlight.add(key);
    enforceDepositPolicy(account, deps)
      .then((outcome) => {
        // A failure, an account the indexer does not know yet, and a missing session are all
        // worth another look the next time the account or its session changes.
        if (outcome === 'up-to-date' || outcome === 'synced') {
          settled.add(key);
        }
        if (key === currentKey) {
          setNeedsSignIn(outcome === 'needs-sign-in');
        }
      })
      .finally(() => {
        inFlight.delete(key);
      });

    return undefined;
  });
}
