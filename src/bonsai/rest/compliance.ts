import { ComplianceV2Response } from '@dydxprotocol/v4-client-js';

import { DydxChainId, DydxNetwork, ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { timeUnits } from '@/constants/time';

import { type AppDispatch, type RootState, type RootStore } from '@/state/_store';
import { getUserSourceWalletAddress, getUserWalletAddress } from '@/state/accountInfoSelectors';
import { appQueryClient } from '@/state/appQueryClient';
import { getSelectedDydxChainId, getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';
import {
  ComplianceErrors,
  setLocalAddressScreenV2Raw,
  setSourceAddressScreenV2Raw,
} from '@/state/raw';

import { signCompliancePayload } from '@/lib/compliance';
import { mapIfPresent } from '@/lib/do';

import { loadableIdle, loadableLoaded } from '../lib/loadable';
import { logBonsaiError } from '../logs';
import { selectRawLocalAddressScreenV2 } from '../selectors/base';
import { ComplianceResponse, ComplianceStatus } from '../types/summaryTypes';
import { IndexerWebsocketManager } from '../websocket/lib/indexerWebsocketManager';
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

export enum ComplianceAction {
  CONNECT = 'CONNECT',
  VALID_SURVEY = 'VALID_SURVEY',
  INVALID_SURVEY = 'INVALID_SURVEY',
}

const COMPLIANCE_PAYLOAD_MESSAGE = 'Verify account ownership';

async function updateCompliance({
  chainId,
  address,
  network,
  status,
  action,
}: {
  chainId: DydxChainId;
  address: string;
  network: DydxNetwork;
  status: ComplianceStatus;
  action: ComplianceAction;
}) {
  const networkConfig = ENVIRONMENT_CONFIG_MAP[network];
  const indexerUrl = mapIfPresent(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    networkConfig?.endpoints.indexers[0]?.api,
    removeTrailingSlash
  );
  const payload = {
    message: COMPLIANCE_PAYLOAD_MESSAGE,
    action,
    status,
    chainId,
  };

  const signingResponse = await signCompliancePayload(address, payload);
  if (!signingResponse) {
    return { status: ComplianceStatus.UNKNOWN };
  }

  const parsedSigningResponse = JSON.parse(signingResponse);
  if (parsedSigningResponse.error != null) {
    return { status: ComplianceStatus.UNKNOWN };
  }

  const { signedMessage, publicKey, timestamp, isKeplr } = parsedSigningResponse;

  const urlAddition = isKeplr ? '/v4/compliance/geoblock-keplr' : '/v4/compliance/geoblock';
  const hasMessageAndKey = signedMessage !== null && publicKey !== null;
  const isKeplrOrHasTimestamp = timestamp !== null || isKeplr === true;

  if (!hasMessageAndKey || !isKeplrOrHasTimestamp || !indexerUrl) {
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
  return data as ComplianceV2Response & ComplianceErrors;
}

export function setUpIndexerLocalAddressScreenV2Query(store: RootStore) {
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    selector: selectChainIdAndLocalAddress,
    getQueryKey: ({ address, chainId, network }) => [
      'screenLocalWalletV2',
      chainId,
      address,
      network,
    ],
    getQueryFn: (indexerClient, { chainId, address, network }) => {
      if (address == null) {
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

        const updateResult = updateCompliance({
          address,
          chainId,
          network,
          status: firstScreenResult.status,
          action: ComplianceAction.CONNECT,
        });

        return {
          ...firstScreenResult,
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          ...(updateResult ?? {}),
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

export const triggerCompliance = (action: ComplianceAction) => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
      const state = getState();
      const currentLocalScreenStatus = selectRawLocalAddressScreenV2(state).data?.status;
      const chainId = getSelectedDydxChainId(state);
      const address = getUserWalletAddress(state);
      const network = getSelectedNetwork(state);

      if (!address || !currentLocalScreenStatus) {
        throw new Error('TriggerCompliance: No account connected or screen status not loaded');
      }

      const result = await updateCompliance({
        chainId,
        address,
        network,
        status: currentLocalScreenStatus,
        action,
      });

      dispatch(setLocalAddressScreenV2Raw(loadableLoaded(result)));

      // force refresh all account information from indexer
      IndexerWebsocketManager.getActiveResources().forEach((r) => r.restart());
      appQueryClient.invalidateQueries({
        queryKey: ['indexer', 'account'],
      });

      return true;
    } catch (e) {
      logBonsaiError('TriggerCompliance', 'failed to update compliance', { error: e });
      return false;
    }
  };
};
