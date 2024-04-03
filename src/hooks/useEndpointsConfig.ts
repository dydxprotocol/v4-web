import { useSelector } from 'react-redux';

import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { getSelectedNetwork } from '@/state/appSelectors';

interface EndpointsConfig {
  indexers: {
    api: string;
    socket: string;
  }[];
  validators: string[];
  '0xsquid': string;
  nobleValidator: string;
  faucet?: string;
}

export const useEndpointsConfig = () => {
  const selectedNetwork = useSelector(getSelectedNetwork);
  const endpointsConfig = ENVIRONMENT_CONFIG_MAP[selectedNetwork].endpoints as EndpointsConfig;

  return {
    indexer: endpointsConfig.indexers[0], // assume there's only one option for indexer endpoints
    validators: endpointsConfig.validators,
    '0xsquid': endpointsConfig['0xsquid'],
    nobleValidator: endpointsConfig.nobleValidator,
    faucet: endpointsConfig['faucet'],
  };
};
