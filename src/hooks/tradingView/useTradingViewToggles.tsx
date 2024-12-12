import { useState } from 'react';

export const useTradingViewToggles = () => {
  const [orderLinesToggleOn, setOrderLinesToggleOn] = useState(true);
  const [buySellMarksToggleOn, setBuySellMarksToggleOn] = useState(true);

  return {
    // Chart Order Lines
    orderLinesToggleOn,
    setOrderLinesToggleOn,
    // Buy Sell Marks
    buySellMarksToggleOn,
    setBuySellMarksToggleOn,
  };
};
