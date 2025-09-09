import environments from '../../public/configs/v1/env.json';

// Whether we are in local or dev environment
export const isDev = process.env.NODE_ENV !== 'production';

// For now we only support one environment at a time (TESTNET)
export const AVAILABLE_ENVIRONMENTS = environments.deployments.TESTNET;
export const ENVIRONMENT_CONFIG_MAP = environments.environments;
export const TOKEN_CONFIG_MAP = environments.tokens;
export const LINKS_CONFIG_MAP = environments.links;
export const WALLETS_CONFIG_MAP = environments.wallets;
export type DydxNetwork = keyof typeof ENVIRONMENT_CONFIG_MAP;
export type DydxChainId = keyof typeof TOKEN_CONFIG_MAP;
export const DEFAULT_APP_ENVIRONMENT = AVAILABLE_ENVIRONMENTS.default as DydxNetwork;
