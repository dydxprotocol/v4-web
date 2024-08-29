import { BECH32_PREFIX, NOBLE_BECH32_PREFIX } from '@dydxprotocol/v4-client-js';
import { WalletType as GrazWalletType, type ConfigureGrazArgs } from 'graz';

import { getLocalStorage } from '@/lib/localStorage';
import { validateAgainstAvailableEnvironments } from '@/lib/network';

import { LocalStorageKey } from './localStorage';
import { DEFAULT_APP_ENVIRONMENT, ENVIRONMENT_CONFIG_MAP, isMainnet } from './networks';

export enum CosmosChainId {
  Osmosis = 'osmosis-1',
  Noble = 'noble-1',
  Neutron = 'neutron-1',
  OsmosisTestnet = 'osmo-test-5',
  NobleTestnet = 'grand-1',
  NeutronTestnet = 'pion-1',
}

export const OSMO_BECH32_PREFIX = 'osmo';
export const NEUTRON_BECH32_PREFIX = 'neutron';

export const NOBLE_GAS_PRICE = '0.1uusdc';
export const OSMO_GAS_PRICE = '0.025uosmo';
export const NEUTRON_GAS_PRICE = '0.0053untrn';

const selectedNetwork = getLocalStorage({
  key: LocalStorageKey.SelectedNetwork,
  defaultValue: DEFAULT_APP_ENVIRONMENT,
  validateFn: validateAgainstAvailableEnvironments,
});
const dydxChainId = ENVIRONMENT_CONFIG_MAP[selectedNetwork].dydxChainId;

export const getNobleChainId = () => {
  return isMainnet ? CosmosChainId.Noble : CosmosChainId.NobleTestnet;
};

export const getOsmosisChainId = () => {
  return isMainnet ? CosmosChainId.Osmosis : CosmosChainId.OsmosisTestnet;
};

export const getNeutronChainId = () => {
  return isMainnet ? CosmosChainId.Neutron : CosmosChainId.NeutronTestnet;
};

const osmosisChainId = getOsmosisChainId();
const nobleChainId = getNobleChainId();
const neutronChainId = getNeutronChainId();

export const SUPPORTED_COSMOS_CHAINS = [dydxChainId, osmosisChainId, nobleChainId, neutronChainId];

export const GRAZ_CHAINS = [
  // dYdX
  {
    chainId: dydxChainId,
    rpc: ENVIRONMENT_CONFIG_MAP[selectedNetwork].endpoints.validators[0],
    bech32Config: {
      bech32PrefixAccAddr: BECH32_PREFIX,
    },
  },
  // Noble
  {
    chainId: nobleChainId,
    rpc: ENVIRONMENT_CONFIG_MAP[selectedNetwork].endpoints.nobleValidator,
    bech32Config: { bech32PrefixAccAddr: NOBLE_BECH32_PREFIX },
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
  defaultWallet: GrazWalletType.KEPLR,
  chains: GRAZ_CHAINS as ConfigureGrazArgs['chains'],
};
