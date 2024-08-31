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
  skip: string;
  nobleValidator: string;
  osmosisValidator: string;
  neutronValidator: string;
  faucet?: string;
  stakingAPR?: string;
  solanaRpcUrl: string;
}

export const useEndpointsConfig = () => {
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const endpointsConfig: EndpointsConfig = ENVIRONMENT_CONFIG_MAP[selectedNetwork].endpoints;

  return {
    indexer: endpointsConfig.indexers[0], // assume there's only one option for indexer endpoints
    validators: endpointsConfig.validators,
    '0xsquid': endpointsConfig['0xsquid'],
    skip: endpointsConfig.skip,
    nobleValidator: endpointsConfig.nobleValidator,
    osmosisValidator: endpointsConfig.osmosisValidator,
    neutronValidator: endpointsConfig.neutronValidator,
    faucet: endpointsConfig.faucet,
    stakingAPR: endpointsConfig.stakingAPR,
    solanaRpcUrl: endpointsConfig.solanaRpcUrl,
  };
};
