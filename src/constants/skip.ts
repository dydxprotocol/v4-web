import { arbitrum, avalanche, base, mainnet, optimism, polygon } from 'viem/chains';

import { CHAIN_INFO } from './chains';

export const SKIP_EST_TIME_DEFAULT_MINUTES = 30;

/**
 * @url https://docs.skip.build/go/advanced-transfer/go-fast
 * @description The maximum amount that can be transferred using the Go Fast route. All chains currently (4/15/2025) have the same limit.
 */
export const SKIP_GO_FAST_TRANSFER_MIN_L2 = 20;
export const SKIP_GO_FAST_TRANSFER_MIN = 100;

// Only EVM Chains have a go fast transfer min
export const SKIP_GO_FAST_TRANSFER_MIN_MAP: Record<keyof typeof CHAIN_INFO, number> = {
  [mainnet.id]: SKIP_GO_FAST_TRANSFER_MIN,
  [arbitrum.id]: SKIP_GO_FAST_TRANSFER_MIN_L2,
  [base.id]: SKIP_GO_FAST_TRANSFER_MIN_L2,
  [optimism.id]: SKIP_GO_FAST_TRANSFER_MIN_L2,
  [polygon.id]: SKIP_GO_FAST_TRANSFER_MIN_L2,
  [avalanche.id]: SKIP_GO_FAST_TRANSFER_MIN,
};

export const SKIP_GO_FAST_TRANSFER_LIMIT = 100_000; // hardcoded on Skip's end

export const SKIP_GO_BPS_FEE = 0.1; // hardcoded to 10bps on Skip's end

export const SKIP_GO_DESTINATION_FEE = 0.01; // $0.01 since the only destination is Osmosis chain to fulfill the go fast route.

/**
 * @description The fee for the source chain to fulfill the go fast route.
 * @note The fee is hardcoded on Skip's end.
 */
export const SKIP_GO_FAST_SOURCE_FEE_MAP: Record<string, number> = {
  [mainnet.id]: 2.5,
  [arbitrum.id]: 0.05,
  [optimism.id]: 0.01,
  [polygon.id]: 0.01,
  [avalanche.id]: 0.1,
  [base.id]: 0.01,
};
