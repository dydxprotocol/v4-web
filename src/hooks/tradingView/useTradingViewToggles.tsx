import { useState } from 'react';

import { StatsigFlags } from '@/constants/statsig';

import { useStatsigGateValue } from '../useStatsig';

export const useTradingViewToggles = () => {
  const ffEnableOrderbookCandles = useStatsigGateValue(StatsigFlags.ffEnableOhlc);
  // When the orderbook candles (displayed as OHLC) toggle is on, empty (0 trade) candles in markets will show
  // O(pen) H(igh) L(ow) C(lose) data via orderbook mid-price.
  // Otherwise, candles calculate OHLC data from historical trades.
  const [orderbookCandlesToggleOn, setOrderbookCandlesToggleOn] =
    useState(ffEnableOrderbookCandles);
  const [orderLinesToggleOn, setOrderLinesToggleOn] = useState(true);
  const [buySellMarksToggleOn, setBuySellMarksToggleOn] = useState(true);

  return {
    // Orderbook Candles
    orderbookCandlesToggleOn,
    setOrderbookCandlesToggleOn,
    // Chart Order Lines
    orderLinesToggleOn,
    setOrderLinesToggleOn,
    // Buy Sell Marks
    buySellMarksToggleOn,
    setBuySellMarksToggleOn,
  };
};
