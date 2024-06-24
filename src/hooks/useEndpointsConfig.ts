import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

interface EndpointsConfig {
  indexers: {
    api: string;
    socket: string;
  }[];
  validators: string[];
  '0xsquid': string;
  nobleValidator: string;
  faucet?: string;
  stakingAPR?: string;
}

export const useEndpointsConfig = () => {
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const endpointsConfig: EndpointsConfig = ENVIRONMENT_CONFIG_MAP[selectedNetwork].endpoints;

  return {
    indexer: endpointsConfig.indexers[0], // assume there's only one option for indexer endpoints
    validators: endpointsConfig.validators,
    '0xsquid': endpointsConfig['0xsquid'],
    nobleValidator: endpointsConfig.nobleValidator,
    faucet: endpointsConfig.faucet,
    stakingAPR: endpointsConfig.stakingAPR,
  };
};
