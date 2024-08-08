import { useState } from 'react';

export const useTradingViewToggles = () => {
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
