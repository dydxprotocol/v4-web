import { type ConfigureGrazArgs, type WalletType as GrazWalletType } from 'graz';
import { BECH32_PREFIX } from 'starboard-client-js';

import { getLocalStorage } from '@/lib/localStorage';
import { validateAgainstAvailableEnvironments } from '@/lib/network';

import { LocalStorageKey } from './localStorage';
import { DEFAULT_APP_ENVIRONMENT, ENVIRONMENT_CONFIG_MAP } from './networks';

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

const selectedNetwork = getLocalStorage({
  key: LocalStorageKey.SelectedNetwork,
  defaultValue: DEFAULT_APP_ENVIRONMENT,
  validateFn: validateAgainstAvailableEnvironments,
});
const dydxChainId = ENVIRONMENT_CONFIG_MAP[selectedNetwork].dydxChainId;

export const SUPPORTED_COSMOS_CHAINS = [dydxChainId];

export const GRAZ_CHAINS = [
  // dYdX
  {
    chainId: dydxChainId,
    rpc: ENVIRONMENT_CONFIG_MAP[selectedNetwork].endpoints.validators[0],
    bech32Config: {
      bech32PrefixAccAddr: BECH32_PREFIX,
    },
  },
];

export const config: ConfigureGrazArgs = {
  autoReconnect: false,
  defaultWallet: 'keplr' as GrazWalletType,
  chains: GRAZ_CHAINS as ConfigureGrazArgs['chains'],
};
