import { BECH32_PREFIX, NOBLE_BECH32_PREFIX } from '@dydxprotocol/v4-client-js';
import { type ConfigureGrazArgs } from 'graz';

import { isMainnet } from '@/constants/networks';

import { getNobleChainId } from './squid';

export const config: ConfigureGrazArgs = {
  chains: [
    {
      chainId: isMainnet ? 'dydx-mainnet-1' : 'dydx-testnet-4',
      bech32Config: {
        bech32PrefixAccAddr: BECH32_PREFIX,
      },
    },
    { chainId: getNobleChainId(), bech32Config: { bech32PrefixAccAddr: NOBLE_BECH32_PREFIX } },
  ] as ConfigureGrazArgs['chains'],
};
