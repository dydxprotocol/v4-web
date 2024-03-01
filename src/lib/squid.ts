import { GetStatus, StatusResponse } from '@0xsquid/sdk';

import { isMainnet } from '@/constants/networks';

export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const STATUS_ERROR_GRACE_PERIOD = 300_000;

const getSquidStatusUrl = (isV2: boolean) => {
  if (isV2) {
    return isMainnet
      ? 'https://v2.api.squidrouter.com/v2/status'
      : 'https://testnet.v2.api.squidrouter.com/v2/status';
  }
  return isMainnet
    ? 'https://api.squidrouter.com/v1/status'
    : 'https://testnet.api.squidrouter.com/v1/status';
};

export const fetchSquidStatus = async (
  params: GetStatus,
  isV2?: boolean,
  integratorId?: string
): Promise<StatusResponse> => {
  const parsedParams: { [key: string]: string } = {
    transactionId: params.transactionId,
    fromChainId: String(params.fromChainId),
    toChainId: String(params.toChainId),
  };
  if (isV2) parsedParams.bridgeType = 'cctp';
  const url = `${getSquidStatusUrl(!!isV2)}?${new URLSearchParams(parsedParams).toString()}`;

  const response = await fetch(url, {
    headers: {
      'x-integrator-id': integratorId || 'dYdX-api',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
};

export const getNobleChainId = () => {
  return isMainnet ? 'noble-1' : 'grand-1';
};
