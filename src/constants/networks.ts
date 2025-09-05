import environments from '../../public/configs/v1/env.json';

// NOTE: This logic will be replaced by wt-xyz#21
// https://github.com/wt-xyz/starboard/pull/21
// It is a temporary config to test prod and staging builds :/
export const CURRENT_MODE = 'DEV' as 'MAINNET' | 'TESTNET' | 'DEV';

// Muted for now to allow local dev with the new config
export const __CURRENT_MODE =
  {
    production: 'MAINNET',
    testnet: 'TESTNET',
    staging: 'DEV',
    development: 'DEV',
  }[import.meta.env.MODE] ?? 'MAINNET';

export const isMainnet = CURRENT_MODE === 'MAINNET';
export const isTestnet = CURRENT_MODE === 'TESTNET';
export const isDev = CURRENT_MODE === 'DEV';

export const AVAILABLE_ENVIRONMENTS = environments.deployments[CURRENT_MODE];
export const ENVIRONMENT_CONFIG_MAP = environments.environments;
export const TOKEN_CONFIG_MAP = environments.tokens;
export const LINKS_CONFIG_MAP = environments.links;
export const WALLETS_CONFIG_MAP = environments.wallets;
export type DydxNetwork = keyof typeof ENVIRONMENT_CONFIG_MAP;
export type DydxChainId = keyof typeof TOKEN_CONFIG_MAP;
export const DEFAULT_APP_ENVIRONMENT = AVAILABLE_ENVIRONMENTS.default as DydxNetwork;

export const STATSIG_ENVIRONMENT_TIER = ({
  production: 'production',
  testnet: 'staging',
  staging: 'development',
  development: 'development',
}[import.meta.env.MODE] ?? 'production') as 'production' | 'staging' | 'development';
