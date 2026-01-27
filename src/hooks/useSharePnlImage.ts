import { logBonsaiError } from '@/bonsai/logs';
import { useQuery } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useAccounts } from '@/hooks/useAccounts';

import { getOpenPositions } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { Nullable } from '@/lib/typeUtils';
import { truncateAddress } from '@/lib/wallet';

import { useEndpointsConfig } from './useEndpointsConfig';

export type SharePnlImageParams = {
  marketId: string;
  side: Nullable<IndexerPositionSide>;
  leverage: Nullable<number>;
  oraclePrice: Nullable<number>;
  entryPrice: Nullable<number>;
  unrealizedPnl: Nullable<number>;
  type?: 'open' | 'closed' | 'liquidated' | undefined;
};

export const useSharePnlImage = ({
  marketId,
  side,
  leverage,
  oraclePrice,
  entryPrice,
  unrealizedPnl,
  type = 'open',
}: SharePnlImageParams) => {
  const { pnlImageApi } = useEndpointsConfig();

  // Get user wallet address for username
  const { dydxAddress } = useAccounts();

  // Get full position data from state
  const openPositions = useAppSelector(getOpenPositions);
  const position = openPositions?.find((p) => p.market === marketId);

  const queryFn = async (): Promise<Blob | undefined> => {
    if (!dydxAddress) {
      return undefined;
    }

    // Build the request body matching the API's zod schema
    const requestBody = {
      brand: 'dydx',
      ticker: marketId,
      type,
      leverage: leverage ?? 0,
      username: truncateAddress(dydxAddress),
      isLong: side === IndexerPositionSide.LONG,
      isCross: position?.marginMode === 'CROSS',
      // Optional fields - include if available
      size: position?.unsignedSize.toNumber(),
      userImage: 'https://dydx.trade/hedgie-profile.png',
      pnl: position?.realizedPnl.toNumber(),
      uPnl: unrealizedPnl ?? undefined,
      pnlPercentage: position?.updatedUnrealizedPnlPercent?.toNumber(),
      entryPx: entryPrice ?? undefined,
      liquidationPx: position?.liquidationPrice?.toNumber(),
      markPx: oraclePrice ?? undefined,
    };

    const response = await fetch(pnlImageApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      logBonsaiError('useSharePnlImage', 'Failed to fetch share image', { response });
      throw new Error(`Failed to fetch share image: ${response.status}`);
    }

    return response.blob();
  };

  return useQuery({
    queryKey: [
      'sharePnlImage',
      marketId,
      dydxAddress,
      side,
      leverage,
      oraclePrice,
      entryPrice,
      unrealizedPnl,
      type,
      position?.marginMode,
      position?.unsignedSize.toString(),
      position?.liquidationPrice?.toString(),
    ],
    queryFn,
    enabled: Boolean(dydxAddress),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 2 * timeUnits.minute, // 2 minutes
    retry: 2,
    retryDelay: 1 * timeUnits.second,
    retryOnMount: true,
  });
};
