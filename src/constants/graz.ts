import { BECH32_PREFIX } from '@dydxprotocol/v4-client-js';
import { type ConfigureGrazArgs, type WalletType as GrazWalletType } from 'graz';

import { getLocalStorage } from '@/lib/localStorage';
import { validateAgainstAvailableEnvironments } from '@/lib/network';

import { LocalStorageKey } from './localStorage';
import { DEFAULT_APP_ENVIRONMENT, ENVIRONMENT_CONFIG_MAP, isMainnet } from './networks';

export enum CosmosChainId {
  Injective = 'injective-1',
  InjectiveTestnet = 'injective-888',
  Osmosis = 'osmosis-1',
  Neutron = 'neutron-1',
  OsmosisTestnet = 'osmo-test-5',
  NobleTestnet = 'grand-1',
  NeutronTestnet = 'pion-1',
}

export const OSMO_BECH32_PREFIX = 'osmo';
export const NEUTRON_BECH32_PREFIX = 'neutron';
export const INJECTIVE_BECH32_PREFIX = 'inj';

const selectedNetwork = getLocalStorage({
  key: LocalStorageKey.SelectedNetwork,
  defaultValue: DEFAULT_APP_ENVIRONMENT,
  validateFn: validateAgainstAvailableEnvironments,
});
const dydxChainId = ENVIRONMENT_CONFIG_MAP[selectedNetwork].dydxChainId;

export const getInjectiveChainId = () => {
  return isMainnet ? CosmosChainId.Injective : CosmosChainId.InjectiveTestnet;
};

export const getOsmosisChainId = () => {
  return isMainnet ? CosmosChainId.Osmosis : CosmosChainId.OsmosisTestnet;
};

export const getNeutronChainId = () => {
  return isMainnet ? CosmosChainId.Neutron : CosmosChainId.NeutronTestnet;
};

const osmosisChainId = getOsmosisChainId();
const injectiveChainId = getInjectiveChainId();
const neutronChainId = getNeutronChainId();

export const SUPPORTED_COSMOS_CHAINS = [
  dydxChainId,
  osmosisChainId,
  injectiveChainId,
  neutronChainId,
];

export const GRAZ_CHAINS = [
  // dYdX
  {
    chainId: dydxChainId,
    rpc: ENVIRONMENT_CONFIG_MAP[selectedNetwork].endpoints.validators[0],
    bech32Config: {
      bech32PrefixAccAddr: BECH32_PREFIX,
    },
  },
  // Injective
  {
    chainId: injectiveChainId,
    rpc: ENVIRONMENT_CONFIG_MAP[selectedNetwork].endpoints.nobleValidator, // TODO: Replace with actual Injective validator
    bech32Config: { bech32PrefixAccAddr: INJECTIVE_BECH32_PREFIX },
  },
  // Osmosis
  {
    chainId: osmosisChainId,
    rpc: ENVIRONMENT_CONFIG_MAP[selectedNetwork].endpoints.osmosisValidator,
    bech32Config: { bech32PrefixAccAddr: OSMO_BECH32_PREFIX },
  },
  // Neutron
  {
    chainId: neutronChainId,
    rpc: ENVIRONMENT_CONFIG_MAP[selectedNetwork].endpoints.neutronValidator,
    bech32Config: { bech32PrefixAccAddr: NEUTRON_BECH32_PREFIX },
  },
];

export const config: ConfigureGrazArgs = {
  autoReconnect: false,
  defaultWallet: 'keplr' as GrazWalletType,
  chains: GRAZ_CHAINS as ConfigureGrazArgs['chains'],
};
