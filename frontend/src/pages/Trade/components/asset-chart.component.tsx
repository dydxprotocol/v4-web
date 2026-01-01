import { type FC, useCallback } from 'react';
import type { AssetId } from 'fuel-ts-sdk';
import type { Candle, CandleInterval } from 'fuel-ts-sdk/trading';
import { TradingChart } from '@/components/TradingChart';
import { useTradingSdk } from '@/lib/fuel-ts-sdk';

type AssetChartProps = { assetId: AssetId };

export const AssetChart: FC<AssetChartProps> = ({ assetId }) => {
  const tradingSdk = useTradingSdk();

  const getOrFetchCandles = useCallback(
    async (interval: CandleInterval): Promise<Candle[]> => {
      if (!assetId) return [];

      const status = tradingSdk.getCandlesStatus(assetId, interval);

      if (status === 'uninitialized') {
        await tradingSdk.fetchCandles(assetId, interval);
      }

      return tradingSdk.getCandles(assetId, interval);
    },
    [tradingSdk, assetId]
  );

  return <TradingChart symbol="BTC-USD" candlesGetter={getOrFetchCandles} />;
};
