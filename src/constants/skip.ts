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
