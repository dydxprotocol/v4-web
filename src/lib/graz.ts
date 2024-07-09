import { BECH32_PREFIX, NOBLE_BECH32_PREFIX } from '@dydxprotocol/v4-client-js';
import { type ConfigureGrazArgs } from 'graz';

import { isMainnet } from '@/constants/networks';

import { getNobleChainId, getOsmosisChainId } from './squid';

export const config: ConfigureGrazArgs = {
  walletDefaultOptions: {
    // sign: {
    //   preferNoSetFee: true,
    //   preferNoSetMemo: true,
    // },
  },
  chains: [
    // dYdX
    {
      chainId: isMainnet ? 'dydx-mainnet-1' : 'dydx-testnet-4',
      bech32Config: {
        bech32PrefixAccAddr: BECH32_PREFIX,
      },
    },
    // Noble
    { chainId: getNobleChainId(), bech32Config: { bech32PrefixAccAddr: NOBLE_BECH32_PREFIX } },
    // Osmosis
    { chainId: getOsmosisChainId(), bech32Config: { bech32PrefixAccAddr: 'osmo' } },
  ] as ConfigureGrazArgs['chains'],
};
