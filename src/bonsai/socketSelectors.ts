import { DydxNetwork, ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { EndpointsConfig } from '@/hooks/useEndpointsConfig';

import { type RootState } from '@/state/_store';
import { getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';

const suffix = '/v4/ws';
export function getWebsocketUrlForNetwork(network: DydxNetwork) {
  const endpointsConfig: EndpointsConfig = ENVIRONMENT_CONFIG_MAP[network].endpoints;
  return `${endpointsConfig.indexers[0]!.socket}${suffix}`;
}

export const selectWebsocketUrl = createAppSelector([getSelectedNetwork], (network) => {
  return getWebsocketUrlForNetwork(network);
});

export const selectIndexerUrl = createAppSelector([getSelectedNetwork], (network) => {
  const endpointsConfig: EndpointsConfig = ENVIRONMENT_CONFIG_MAP[network].endpoints;
  return `${endpointsConfig.indexers[0]!.api}`;
});

// TODO allow configurable parent subaccount number
export const selectParentSubaccountInfo = createAppSelector(
  [(state) => state.wallet.localWallet?.address],
  (wallet) => ({ wallet, subaccount: 0 })
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

export const selectNobleClientReady = createAppSelector(
  [getSelectedNetwork, (state: RootState) => state.raw.network],
  (network, networks) => {
    return !!networks[network]?.nobleClientReady;
  }
);
