import { createStoreEffect } from '@/bonsai/lib/createStoreEffect';
import { loadableIdle, loadableLoaded } from '@/bonsai/lib/loadable';

import { type RootStore } from '@/state/_store';
import { getUserSolanaWalletAddress } from '@/state/accountInfoSelectors';
import { getSpotApiEndpoint } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';
import { setSpotWalletPositions } from '@/state/raw';

import { subscribeToWalletPositions } from '@/lib/streaming/walletPositionsStreaming';

const getWalletPositionsSubscriptionParams = createAppSelector(
  [getSpotApiEndpoint, getUserSolanaWalletAddress],
  (spotApiEndpoint, solanaWalletAddress) => {
    if (!spotApiEndpoint || !solanaWalletAddress) {
      return null;
    }

    return { endpoint: spotApiEndpoint, walletAddress: solanaWalletAddress };
  }
);

export function setUpSpotWalletPositions(store: RootStore) {
  return createStoreEffect(store, getWalletPositionsSubscriptionParams, (params) => {
    if (!params) {
      store.dispatch(setSpotWalletPositions(loadableIdle()));
      return () => {};
    }

    const { endpoint, walletAddress } = params;

    const unsubscribe = subscribeToWalletPositions(endpoint, walletAddress, (data) => {
      store.dispatch(setSpotWalletPositions(loadableLoaded(data)));
    });

    return () => {
      unsubscribe();
      store.dispatch(setSpotWalletPositions(loadableIdle()));
    };
  });
}
