import { logBonsaiError } from '@/bonsai/logs';
import { useQuery } from '@tanstack/react-query';

import { SharePNLAnalyticsDialogProps } from '@/constants/dialogs';
import { timeUnits } from '@/constants/time';

import { useAccounts } from '@/hooks/useAccounts';
import { useEndpointsConfig } from '@/hooks/useEndpointsConfig';

import { truncateAddress } from '@/lib/wallet';

export const useSharePnlImage = (data: SharePNLAnalyticsDialogProps) => {
  const { pnlImageApi } = useEndpointsConfig();
  const { dydxAddress } = useAccounts();

  const queryFn = async (): Promise<Blob | undefined> => {
    if (!dydxAddress || !data.marketId) {
      return undefined;
    }

    const totalPnl = (data.pnl ?? 0) + (data.unrealizedPnl ?? 0);

    const requestBody = {
      ticker: data.assetId,
      type: data.shareType,
      leverage: data.leverage,
      username: truncateAddress(dydxAddress),
      isLong: data.isLong,
      isCross: data.isCross,
      // Optional fields
      size: data.size ?? undefined,
      prevSize: data.prevSize ?? undefined,
      pnl: totalPnl || undefined,
      uPnl: data.unrealizedPnl ?? undefined,
      pnlPercentage: data.pnlPercentage ?? undefined,
      entryPx: data.entryPrice ?? undefined,
      exitPx: data.exitPrice ?? undefined,
      liquidationPx: data.liquidationPrice ?? undefined,
      markPx: data.oraclePrice ?? undefined,
      closeType: data.closeType ?? undefined,
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
      data.marketId,
      dydxAddress,
      data.isLong,
      data.isCross,
      data.shareType,
      data.leverage,
      data.size,
      data.pnl,
      data.unrealizedPnl,
      data.entryPrice,
      data.exitPrice,
      data.oraclePrice,
    ],
    queryFn,
    enabled: Boolean(dydxAddress),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 2 * timeUnits.minute,
    retry: 2,
    retryDelay: 1 * timeUnits.second,
    retryOnMount: true,
  });
};
