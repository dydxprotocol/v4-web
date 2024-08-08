import { useState } from 'react';

export const useTradingViewToggles = () => {
  // When the OHLC toggle is on, empty (0 trade) candles in markets will show O(pen) H(igh) L(ow) C(lose) data via mid-price.
  // Otherwise, candles display OHLC data from historical trades.
  const [ohlcToggleOn, setOhlcToggleOn] = useState(true);

  const [orderLinesToggleOn, setOrderLinesToggleOn] = useState(true);

  return {
    // OHLC
    ohlcToggleOn,
    setOhlcToggleOn,
    // Chart Order Lines
    orderLinesToggleOn,
    setOrderLinesToggleOn,
  };
};
