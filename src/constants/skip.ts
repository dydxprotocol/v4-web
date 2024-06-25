export type RouteStatus = {
  chainId: string | undefined;
  txHash: string | undefined;
  status: 'success' | 'ongoing' | undefined;
};
export type SkipTransactionStatus = {
  chainData: {
    chainId: string | undefined;
    chainName: string | undefined;
    estimatedRouteDuration: string;
  };
  transactionId: string | undefined;
  transactionUrl: string | undefined;
};

export type TransactionDataParams = {
  chainId: string | undefined;
  txHash: string | undefined;
  status: string | undefined;
  txUrl: string | undefined;
  transferDirection: TransferDirection;
};

export type TransferDirection = 'from' | 'to';

export type SkipStatusResponse = {
  axelarTransactionUrl: string | undefined;
  squidTransactionStatus: string | undefined;
  routeStatus: RouteStatus[];
  toChain: SkipTransactionStatus | undefined;
  fromChain: SkipTransactionStatus | undefined;
  error: string | undefined;
};
