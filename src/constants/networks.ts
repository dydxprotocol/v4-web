import environments from '../../public/configs/v1/env.json';

// Whether we are in local or dev environment
export const isDev = process.env.NODE_ENV !== 'production';

const NETWORK_MODES = Object.keys(environments.deployments) as Array<
  keyof typeof environments.deployments
>;

const VITE_NETWORK_MODE = process.env.VITE_NETWORK_MODE;

// Get network mode from environment variable
const NETWORK_MODE = NETWORK_MODES.find((mode) => mode === VITE_NETWORK_MODE);

if (VITE_NETWORK_MODE && !NETWORK_MODE) {
  // If an invalid mode is set, throw an error
  throw new Error(
    `Invalid VITE_NETWORK_MODE: ${VITE_NETWORK_MODE}. Available modes: ${NETWORK_MODES.join(', ')}`
  );
}

// If no mode is set and we are in dev, default to TESTNET
const finalNetworkMode = NETWORK_MODE ?? (isDev ? 'TESTNET' : 'MAINNET');

// Select the appropriate deployment based on network mode
export const AVAILABLE_ENVIRONMENTS = environments.deployments[finalNetworkMode];
export const ENVIRONMENT_CONFIG_MAP = environments.environments;
export const TOKEN_CONFIG_MAP = environments.tokens;
export const LINKS_CONFIG_MAP = environments.links;
export const WALLETS_CONFIG_MAP = environments.wallets;
export type DydxNetwork = keyof typeof ENVIRONMENT_CONFIG_MAP;
export type DydxChainId = keyof typeof TOKEN_CONFIG_MAP;
export const DEFAULT_APP_ENVIRONMENT = AVAILABLE_ENVIRONMENTS.default as DydxNetwork;
