import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { EndpointsConfig } from '@/hooks/useEndpointsConfig';

import { getUserSubaccountNumber, getUserWalletAddress } from '@/state/accountSelectors';
import { getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';

const suffix = '/v4/ws';
export const selectWebsocketUrl = createAppSelector(getSelectedNetwork, (network) => {
  const endpointsConfig: EndpointsConfig = ENVIRONMENT_CONFIG_MAP[network].endpoints;
  return `${endpointsConfig.indexers[0]!.socket}${suffix}`;
});

export const selectIndexerUrl = createAppSelector(getSelectedNetwork, (network) => {
  const endpointsConfig: EndpointsConfig = ENVIRONMENT_CONFIG_MAP[network].endpoints;
  return `${endpointsConfig.indexers[0]!.api}`;
});

export const selectParentSubaccountInfo = createAppSelector(
  getUserWalletAddress,
  getUserSubaccountNumber,
  (wallet, subaccount) => ({ wallet, subaccount })
);
