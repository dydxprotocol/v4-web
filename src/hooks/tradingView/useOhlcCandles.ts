/* eslint-disable prettier/prettier */
import { useEffect } from 'react';

import { TvWidget } from '@/constants/tvchart';

import abacusStateManager from '@/lib/abacus';

import { useTradingViewChart } from '../useTradingViewChart';

/**
 * @description Hook to handle drawing candles with OHLC or orderbook price
 */

export const useOhlcCandles = ({
  ohlcToggle,
  isChartReady,
  tvWidget,
}: {
  ohlcToggle: HTMLElement | null;
  isChartReady: boolean;
  tvWidget: TvWidget | null;
}) => {
  const { ohlcToggleOn, setOhlcToggleOn } = useTradingViewChart();

  useEffect(() => {
    // Initialize onClick for ohlc toggle
    if (isChartReady && ohlcToggle) {
      ohlcToggle.onclick = () => setOhlcToggleOn((prev) => !prev);
    }
  }, [isChartReady, ohlcToggle, setOhlcToggleOn]);

  useEffect(
    // Update ohlc button on toggle
    () => {
      if (isChartReady && tvWidget) {
        tvWidget.onChartReady(() => {
          tvWidget.headerReady().then(() => {
            if (ohlcToggleOn) {
              ohlcToggle?.classList?.add('ohlc-active');
              // for (const channelId of subscriptionsByChannelId.keys()) {
              //   for (const uid of Object.values(subscriptionsByChannelId.get(channelId).handlers)) {
              // uid.onResetCacheNeededCallback(); xcxc
              //   }
              // }
              // tvWidget.chart().resetData();
            } else {
              ohlcToggle?.classList?.remove('ohlc-active');
              // for (const channelId of subscriptionsByChannelId.keys()) {
              //   for (const uid of Object.values(subscriptionsByChannelId.get(channelId).handlers)) {
              // uid.onResetCacheNeededCallback(); xcxc
              //   }
              // }
              // tvWidget.chart().resetData();
            }
            abacusStateManager.toggleOhlcCandles(ohlcToggleOn);
          });
        });
      }
    },
    [ohlcToggleOn, ohlcToggle?.classList, isChartReady, tvWidget]
  );

  return { ohlcToggleOn };
};
