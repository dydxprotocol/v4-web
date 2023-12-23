import environments from '../../public/configs/env.json';

const CURRENT_MODE = ({
  production: 'MAINNET',
  testnet: 'TESTNET',
  staging: 'DEV',
  development: 'DEV',
}[import.meta.env.MODE] ?? 'MAINNET') as 'MAINNET' | 'TESTNET' | 'DEV';

export const isMainnet = CURRENT_MODE === 'MAINNET';
export const isTestnet = CURRENT_MODE === 'TESTNET';
export const isDev = CURRENT_MODE === 'DEV';

export const AVAILABLE_ENVIRONMENTS = environments.deployments[CURRENT_MODE];
export const CURRENT_ABACUS_DEPLOYMENT = CURRENT_MODE;
export const ENVIRONMENT_CONFIG_MAP = environments.environments;
export type DydxNetwork = keyof typeof ENVIRONMENT_CONFIG_MAP;
export const DEFAULT_APP_ENVIRONMENT = AVAILABLE_ENVIRONMENTS.default as DydxNetwork;
