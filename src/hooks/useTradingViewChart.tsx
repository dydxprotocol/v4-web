import { createContext, useContext, useState } from 'react';

const TradingViewChartContext = createContext<
  ReturnType<typeof useTradingViewChartContext> | undefined
>(undefined);

TradingViewChartContext.displayName = 'TradingView';

export const TradingViewChartProvider = ({ ...props }) => (
  <TradingViewChartContext.Provider value={useTradingViewChartContext()} {...props} />
);

export const useTradingViewChart = () => useContext(TradingViewChartContext)!;

const useTradingViewChartContext = () => {
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
