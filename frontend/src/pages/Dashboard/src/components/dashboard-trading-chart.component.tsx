import { type FC, useCallback } from 'react';
import type { Candle, CandleInterval } from 'fuel-ts-sdk/trading';
import { TradingChart } from '@/components/TradingChart';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';

export const DashboardTradingChart: FC = () => {
  const tradingSdk = useTradingSdk();
  const asset = useSdkQuery(() => tradingSdk.getWatchedAsset());

  const getOrFetchCandles = useCallback(
    async (interval: CandleInterval): Promise<Candle[]> => {
      if (!asset) return [];
      const status = tradingSdk.getCandlesStatus(asset.assetId, interval);

      if (status === 'uninitialized') {
        await tradingSdk.fetchCandles(asset.assetId, interval);
      }

      return tradingSdk.getCandles(asset.assetId, interval);
    },
    [asset, tradingSdk]
  );

  return <TradingChart symbol={asset?.symbol ?? '?'} candlesGetter={getOrFetchCandles} />;
};
