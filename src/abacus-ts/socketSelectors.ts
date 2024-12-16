import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { EndpointsConfig } from '@/hooks/useEndpointsConfig';

import { type RootState } from '@/state/_store';
import { getUserSubaccountNumber, getUserWalletAddress } from '@/state/accountSelectors';
import { getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';

const suffix = '/v4/ws';
export const selectWebsocketUrl = createAppSelector([getSelectedNetwork], (network) => {
  const endpointsConfig: EndpointsConfig = ENVIRONMENT_CONFIG_MAP[network].endpoints;
  return `${endpointsConfig.indexers[0]!.socket}${suffix}`;
});

export const selectIndexerUrl = createAppSelector([getSelectedNetwork], (network) => {
  const endpointsConfig: EndpointsConfig = ENVIRONMENT_CONFIG_MAP[network].endpoints;
  return `${endpointsConfig.indexers[0]!.api}`;
});

export const selectParentSubaccountInfo = createAppSelector(
  [getUserWalletAddress, getUserSubaccountNumber],
  (wallet, subaccount) => ({ wallet, subaccount })
);

export const selectIndexerReady = createAppSelector(
  [getSelectedNetwork, (state: RootState) => state.raw.network],
  (network, networks) => {
    return !!networks[network]?.indexerClientReady;
  }
);

export const selectCompositeClientReady = createAppSelector(
  [getSelectedNetwork, (state: RootState) => state.raw.network],
  (network, networks) => {
    return !!networks[network]?.compositeClientReady;
  }
);
