import { GasPrice } from '@cosmjs/stargate';
import { BECH32_PREFIX, NOBLE_BECH32_PREFIX } from '@dydxprotocol/v4-client-js';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_APP_ENVIRONMENT, ENVIRONMENT_CONFIG_MAP, isMainnet } from '@/constants/networks';

import { getLocalStorage } from './localStorage';
import { validateAgainstAvailableEnvironments } from './network';

const selectedNetwork = getLocalStorage({
  key: LocalStorageKey.SelectedNetwork,
  defaultValue: DEFAULT_APP_ENVIRONMENT,
  validateFn: validateAgainstAvailableEnvironments,
});
const dydxChainId = ENVIRONMENT_CONFIG_MAP[selectedNetwork].dydxChainId;

export const getNobleChainId = () => {
  return isMainnet ? 'noble-1' : 'grand-1';
};

export const getOsmosisChainId = () => {
  return isMainnet ? 'osmosis-1' : 'osmo-test-5';
};

export const getNeutronChainId = () => {
  return isMainnet ? 'neutron-1' : 'pion-1';
};

const osmosisChainId = getOsmosisChainId();
const nobleChainId = getNobleChainId();
const neutronChainId = getNeutronChainId();

export const OSMO_USDC_IBC_DENOM = isMainnet
  ? 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4'
  : 'ibc/DE6792CF9E521F6AD6E9A4BDF6225C9571A3B74ACC0A529F92BC5122A39D2E58';

export const NEUTRON_USDC_IBC_DENOM = isMainnet
  ? 'ibc/B559A80D62249C8AA07A380E2A2BEA6E5CA9A6F079C912C3A9E9B494105E4F81'
  : '';

export const COSMOS_CHAIN_INFOS = {
  [dydxChainId]: {
    chainName: 'dYdX',
    bech32Prefix: BECH32_PREFIX,
    gasPrice: GasPrice.fromString('25000000000adydx'),
  },
  [osmosisChainId]: {
    chainName: 'Osmosis',
    bech32Prefix: 'osmo',
    gasPrice: GasPrice.fromString('0.025uosmo'),
  },
  [nobleChainId]: {
    chainName: 'Noble',
    bech32Prefix: NOBLE_BECH32_PREFIX,
    gasPrice: GasPrice.fromString('0.1uusdc'),
  },
  [neutronChainId]: {
    chainName: 'Neutron',
    bech32Prefix: 'neutron',
    gasPrice: GasPrice.fromString('0.0053untrn'),
  },
};

export const SUPPORTED_COSMOS_CHAINS = [dydxChainId, osmosisChainId, nobleChainId, neutronChainId];
