import { ComplianceV2Response } from '@dydxprotocol/v4-client-js';

import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { getUserSourceWalletAddress, getUserWalletAddress } from '@/state/accountInfoSelectors';
import { getSelectedDydxChainId, getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';
import {
  ComplianceErrors,
  setLocalAddressScreenV2Raw,
  setSourceAddressScreenV2Raw,
} from '@/state/raw';

import abacusStateManager from '@/lib/abacus';
import { mapIfPresent } from '@/lib/do';

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
    selector: getUserSourceWalletAddress,
    getQueryKey: (address) => ['screen-source-wallet-v2', address],
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
  [getSelectedDydxChainId, getUserWalletAddress, getSelectedNetwork],
  (chainId, address, network) => ({
    chainId,
    address,
    network,
  })
);

function removeTrailingSlash(str: string) {
  return str.endsWith('/') ? str.slice(0, -1) : str;
}

export function setUpIndexerLocalAddressScreenV2Query(store: RootStore) {
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    selector: selectChainIdAndLocalAddress,
    getQueryKey: ({ address, chainId }) => ['screen-local-wallet-v2', chainId, address],
    getQueryFn: (indexerClient, { chainId, address, network }) => {
      const networkConfig = ENVIRONMENT_CONFIG_MAP[network];
      const indexerUrl = mapIfPresent(
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        networkConfig?.endpoints.indexers[0]?.api,
        removeTrailingSlash
      );
      if (address == null || indexerUrl == null) {
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

        const payload = {
          message: 'Verify account ownership',
          action: 'CONNECT',
          status: firstScreenResult.status,
          chainId,
        };

        const signingResponse =
          await abacusStateManager.chainTransactions.signCompliancePayload(payload);
        if (!signingResponse) {
          return { status: ComplianceStatus.UNKNOWN };
        }

        const parsedSigningResponse = JSON.parse(signingResponse);
        if (parsedSigningResponse.error != null) {
          return { status: ComplianceStatus.UNKNOWN };
        }

        const { signedMessage, publicKey, timestamp, isKeplr } = parsedSigningResponse;

        const urlAddition = isKeplr ? '/v4/compliance/geoblock-keplr' : '/v4/compliance/geoblock';
        const isUrlAndKeysPresent = signedMessage !== null && publicKey !== null;
        const isKeplrOrHasTimestamp = timestamp !== null || isKeplr === true;

        if (!isUrlAndKeysPresent || !isKeplrOrHasTimestamp) {
          return { status: ComplianceStatus.UNKNOWN };
        }

        const body = isKeplr
          ? {
              address,
              message: payload.message,
              action: payload.action,
              signedMessage,
              pubkey: publicKey,
            }
          : {
              address,
              message: payload.message,
              currentStatus: payload.status,
              action: payload.action,
              signedMessage,
              pubkey: publicKey,
              timestamp,
            };

        const options: RequestInit = {
          method: 'POST',
          headers: new globalThis.Headers([['Content-Type', 'application/json']]),
          body: JSON.stringify(body),
        };

        const response = await fetch(`${indexerUrl}${urlAddition}`, options);
        const data = await response.json();

        // TODO - retrieve the subaccounts if it does not exist yet. It is possible that the initial
        // subaccount retrieval failed due to 403 before updating the compliance status.

        return {
          ...firstScreenResult,
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          ...((data ?? {}) as ComplianceV2Response & ComplianceErrors),
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
