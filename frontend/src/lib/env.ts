import { NETWORKS, type Network, type NetworkConfig } from '@/models/Network';

export function getEnv<K extends keyof ImportMetaEnv>(key: K): ImportMetaEnv[K] {
  const value = import.meta.env[key];
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

export function getAllNetworkConfigs(): NetworkConfig {
  return parseNetworkUrls(getEnv('VITE_INDEXER_URLS'));
}

export function getDefaultNetwork(): Network {
  const defaultNetwork = getEnv('VITE_DEFAULT_ENVIRONMENT');
  if (!NETWORKS.includes(defaultNetwork as Network)) {
    throw new Error(`Invalid VITE_DEFAULT_ENVIRONMENT: ${defaultNetwork}`);
  }
  return defaultNetwork as Network;
}

export function getIndexerUrl(network: Network): string {
  const networks = getAllNetworkConfigs();
  const url = networks[network];
  if (!url) {
    throw new Error(`No indexer URL found for network: ${network}`);
  }
  return url;
}

function parseNetworkUrls(jsonString: string): NetworkConfig {
  try {
    return JSON.parse(jsonString) as NetworkConfig;
  } catch (error) {
    throw new Error(`Failed to parse VITE_INDEXER_URLS: ${error}`);
  }
}
