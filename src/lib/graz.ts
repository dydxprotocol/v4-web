import { BECH32_PREFIX, NOBLE_BECH32_PREFIX } from '@dydxprotocol/v4-client-js';
import { type ConfigureGrazArgs } from 'graz';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_APP_ENVIRONMENT, ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { getLocalStorage } from './localStorage';
import { validateAgainstAvailableEnvironments } from './network';
import { getNobleChainId, getOsmosisChainId } from './squid';

const selectedNetwork = getLocalStorage({
  key: LocalStorageKey.SelectedNetwork,
  defaultValue: DEFAULT_APP_ENVIRONMENT,
  validateFn: validateAgainstAvailableEnvironments,
});
const dydxChainId = ENVIRONMENT_CONFIG_MAP[selectedNetwork].dydxChainId;
const osmosisChainId = getOsmosisChainId();
const nobleChainId = getNobleChainId();

export const SUPPORTED_COSMOS_CHAINS = [dydxChainId, osmosisChainId, nobleChainId];

export const config: ConfigureGrazArgs = {
  chains: [
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
      bech32Config: { bech32PrefixAccAddr: 'osmo' },
    },
  ] as ConfigureGrazArgs['chains'],
};
