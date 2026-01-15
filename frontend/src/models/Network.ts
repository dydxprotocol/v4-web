export const NETWORKS = ['local', 'testnet'] as const;
export type Network = (typeof NETWORKS)[number];

export type NetworkConfig = Record<Network, string>;
