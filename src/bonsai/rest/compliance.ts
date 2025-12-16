import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { getUserSourceWalletAddress, getUserWalletAddress } from '@/state/accountInfoSelectors';
import { getSelectedDydxChainId, getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';
import { setLocalAddressScreenV2Raw, setSourceAddressScreenV2Raw } from '@/state/raw';
import { getHdKeyNonce } from '@/state/walletSelectors';

import { loadableIdle } from '../lib/loadable';
import { ComplianceResponse, ComplianceStatus } from '../types/summaryTypes';
import { createIndexerQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

// fetch successfully exactly once then never again
const pollingOptions = {
  refetchInterval: false,
  refetchIntervalInBackground: false,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  staleTime: Number.POSITIVE_INFINITY,
  retry: 3,
  retryDelay: timeUnits.second * 15,
} as const;

export function setUpIndexerSourceAddressScreenV2Query(store: RootStore) {
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    name: 'sourceAddressScreenV2',
    selector: getUserSourceWalletAddress,
    getQueryKey: (address) => ['screenSourceWalletV2', address],
    getQueryFn: (indexerClient, address) => {
      if (address == null) {
        return null;
      }
      return () => indexerClient.utility.complianceScreen(address);
    },
    onResult: (screen) => {
      store.dispatch(setSourceAddressScreenV2Raw(queryResultToLoadable(screen)));
    },
    onNoQuery: () => store.dispatch(setSourceAddressScreenV2Raw(loadableIdle())),
    ...pollingOptions,
  });
  return () => {
    cleanupEffect();
    store.dispatch(setSourceAddressScreenV2Raw(loadableIdle()));
  };
}

const selectChainIdAndLocalAddress = createAppSelector(
  [getSelectedDydxChainId, getUserWalletAddress, getSelectedNetwork, getHdKeyNonce],
  (chainId, address, network, hdKeyNonce) => ({
    chainId,
    hdKeyNonce,
    address,
    network,
  })
);

export enum ComplianceAction {
  CONNECT = 'CONNECT',
  VALID_SURVEY = 'VALID_SURVEY',
  INVALID_SURVEY = 'INVALID_SURVEY',
}

export function setUpIndexerLocalAddressScreenV2Query(store: RootStore) {
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    name: 'localAddressScreenV2',
    selector: selectChainIdAndLocalAddress,
    getQueryKey: ({ address, chainId, network }) => [
      'screenLocalWalletV2',
      chainId,
      address,
      network,
    ],
    getQueryFn: (indexerClient, { address, hdKeyNonce }) => {
      if (address == null || hdKeyNonce == null) {
        return null;
      }
      return async (): Promise<ComplianceResponse> => {
        // First get the initial screen result
        const firstScreenResult = await indexerClient.utility.complianceScreen(address);

        // this sometimes isn't the correct type, instead an object with errors
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (firstScreenResult?.status == null) {
          return { status: ComplianceStatus.UNKNOWN };
        }

        return {
          ...firstScreenResult,
        };
      };
    },
    onResult: (screen) => {
      store.dispatch(setLocalAddressScreenV2Raw(queryResultToLoadable(screen)));
    },
    onNoQuery: () => store.dispatch(setLocalAddressScreenV2Raw(loadableIdle())),
    ...pollingOptions,
  });
  return () => {
    cleanupEffect();
    store.dispatch(setLocalAddressScreenV2Raw(loadableIdle()));
  };
}
