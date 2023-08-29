import { ENDPOINTS, DEV_ENDPOINTS } from '@dydxprotocol/v4-localization';

export const NETWORK_ENDPOINTS = import.meta.env.MODE === 'production' ? ENDPOINTS : DEV_ENDPOINTS;

export const CLIENT_NETWORK_CONFIGS: Record<
  string,
  (typeof NETWORK_ENDPOINTS.environments)[number]
> = Object.fromEntries(
  NETWORK_ENDPOINTS.environments.map((environment) => [environment.environment, environment])
);

export const DEFAULT_APP_ENVIRONMENT = NETWORK_ENDPOINTS.defaultEnvironment;

export enum DydxV4Network {
  V4Mainnet = 'dydxprotocol-mainnet',
  V4Staging = 'dydxprotocol-staging',
  V4Testnet2 = 'dydxprotocol-testnet',
  V4Local = 'dydxprotocol-dev',
}

export type DydxNetwork = keyof typeof CLIENT_NETWORK_CONFIGS;

export function isDydxV4Network(network: any): boolean {
  return CLIENT_NETWORK_CONFIGS[network]?.version === 'v4';
}

export function isValidDydxNetwork(network: any): boolean {
  return Object.keys(CLIENT_NETWORK_CONFIGS).includes(network);
}
