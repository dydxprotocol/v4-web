import { useState } from 'react';

export const useTradingViewToggles = () => {
  // When the orderbook candles (displayed as OHLC) toggle is on, empty (0 trade) candles in markets will show
  // O(pen) H(igh) L(ow) C(lose) data via orderbook mid-price.
  // Otherwise, candles calculate OHLC data from historical trades.
  const [orderbookCandlesToggleOn, setOrderbookCandlesToggleOn] = useState(true);
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
