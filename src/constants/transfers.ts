import { WalletNetworkType } from '@/constants/wallets';

import { timeUnits } from './time';

export enum TransferType {
  Deposit = 'DEPOSIT',
  Withdraw = 'WITHDRAW',
}

export type NetworkType = 'evm' | 'svm' | 'cosmos';

// TODO [onboarding-rewrite]: followup with skip about making logoUri an optional property
const DUMMY_LOGO_URI = 'dummy-logo-uri';

// TODO [onboarding-rewrite]: maybe unhardcode this. we can retrieve this via the skipclient and filter ourselves
// but we don't have to? may be worth hardcoding to reduce an extra network call since this isn't going to change much
// and we should have decent visibility into when this changes. TBD
export const UNISWAP_VENUES = [
  {
    name: 'ethereum-uniswap',
    chainID: '1',
  },
  {
    name: 'polygon-uniswap',
    chainID: '137',
  },
  {
    name: 'optimism-uniswap',
    chainID: '10',
  },
  {
    name: 'arbitrum-uniswap',
    chainID: '42161',
  },
  {
    name: 'base-uniswap',
    chainID: '8453',
  },
  {
    name: 'avalanche-uniswap',
    chainID: '43114',
  },
  {
    name: 'binance-uniswap',
    chainID: '56',
  },
  {
    name: 'celo-uniswap',
    chainID: '42220',
  },
  {
    name: 'blast-uniswap',
    chainID: '81457',
  },
].map((x) => ({ ...x, logoUri: DUMMY_LOGO_URI }));

// TODO [onboarding-rewrite]: maybe unhardcode this. same as above.
export const COSMOS_SWAP_VENUES = [
  {
    name: 'osmosis-poolmanager',
    chainID: 'osmosis-1',
    logoUri: DUMMY_LOGO_URI,
  },
  {
    name: 'neutron-astroport',
    chainID: 'neutron-1',
    logoUri: DUMMY_LOGO_URI,
  },
];

export const SWAP_VENUES = [...UNISWAP_VENUES, ...COSMOS_SWAP_VENUES];

export const getNetworkTypeFromWalletNetworkType = (
  walletNetworkType?: WalletNetworkType
): NetworkType => {
  if (walletNetworkType === WalletNetworkType.Evm) {
    return 'evm';
  }
  if (walletNetworkType === WalletNetworkType.Solana) {
    return 'svm';
  }
  if (walletNetworkType === WalletNetworkType.Cosmos) {
    return 'cosmos';
  }
  return 'evm';
};

export const TIME_UNTIL_IDLE_WITHDRAW_IS_CONSIDERED_EXPIRED = 10 * timeUnits.minute;
