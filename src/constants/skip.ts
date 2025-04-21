import { arbitrum, avalanche, base, mainnet, optimism, polygon } from 'viem/chains';

export type RouteStatusSummary = 'success' | 'ongoing' | undefined;

export type RouteStatus = {
  chainId: string | undefined;
  txHash: string | undefined;
  status: RouteStatusSummary;
};
export type SkipTransactionStatus = {
  chainData: {
    chainId: string | undefined;
    chainName: string | undefined;
    // TODO: change type to number once skip implements estimatedrouteduration
    // https://linear.app/dydx/issue/OTE-475/[web]-migration-followup-estimatedrouteduration
    estimatedRouteDuration: string;
  };
  transactionId: string | undefined;
  transactionUrl: string | undefined;
};

export type TransactionDataParams = {
  chainId: string | undefined;
  txHash: string | undefined;
  state: string | undefined;
  txUrl: string | undefined;
  transferDirection: TransferDirection;
};

export type TransferDirection = 'from' | 'to';

export type SkipStatusResponse = {
  axelarTransactionUrl?: string | undefined;
  latestRouteStatusSummary?: RouteStatusSummary;
  routeStatus?: RouteStatus[];
  toChain?: SkipTransactionStatus | undefined;
  fromChain?: SkipTransactionStatus | undefined;
  error?: string | undefined;
};

export const SKIP_EST_TIME_DEFAULT_MINUTES = 30;

/**
 * @url https://docs.skip.build/go/advanced-transfer/go-fast
 * @description The maximum amount that can be transferred using the Go Fast route. All chains currently (4/15/2025) have the same limit.
 */
export const SKIP_GO_FAST_TRANSFER_LIMIT = 17_500; // hardcoded on Skip's end

export const SKIP_GO_BPS_FEE = 0.1; // hardcoded to 10bps on Skip's end

export const SKIP_GO_DESTINATION_FEE = 0.01; // $0.01 since the only destination is Osmosis chain to fulfill the go fast route.

/**
 * @description The fee for the source chain to fulfill the go fast route.
 * @note The fee is hardcoded on Skip's end.
 */
export const SKIP_GO_FAST_SOURCE_FEE_MAP: Record<string, number> = {
  [mainnet.id]: 5,
  [arbitrum.id]: 0.05,
  [optimism.id]: 0.01,
  [polygon.id]: 0.01,
  [avalanche.id]: 0.1,
  [base.id]: 0.01,
};
