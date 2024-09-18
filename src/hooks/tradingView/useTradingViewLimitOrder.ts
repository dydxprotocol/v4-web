import { useCallback, useEffect, useRef } from 'react';

import BigNumber from 'bignumber.js';
import { ContextMenuItem } from 'public/tradingview/charting_library';

import { AbacusOrderSide, TradeInputField } from '@/constants/abacus';
import { AnalyticsEvents } from '@/constants/analytics';
import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';
import { TradeTypes } from '@/constants/trade';

import { getIsAccountConnected } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setTradeFormInputs } from '@/state/inputs';
import { getMarketConfig } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { track } from '@/lib/analytics/analytics';
import { orEmptyObj } from '@/lib/typeUtils';

import { useStringGetter } from '../useStringGetter';

export function useTradingViewLimitOrder(
  marketId?: string
): (unixTime: number, price: number) => ContextMenuItem[] {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const canDraftLimitOrders = true; // useStatsigGateValue(StatsigFlags.ffLimitOrdersFromChart);
  const { tickSizeDecimals } = orEmptyObj(
    useAppSelector((s) => (marketId ? getMarketConfig(s, marketId) : null))
  );

  // Every time we call tvChartWidget.onContextMenu, a new callback is _added_ and there is no way to remove previously
  // added menu options. So, instead of creating a new callback and calling .onContextMenu every time `isUserConnected`
  // or `tickSizeDecimals` changes, only pass in one stable callback on chart load that refers to updated values through a ref
  const isUserConnected = useAppSelector(getIsAccountConnected);
  const userConnectedRef = useRef(isUserConnected);
  const tickSizeDecimalsRef = useRef(tickSizeDecimals);

  useEffect(() => {
    userConnectedRef.current = isUserConnected;
    tickSizeDecimalsRef.current = tickSizeDecimals;
  }, [isUserConnected, tickSizeDecimals]);

  return useCallback(
    (_: number, price: number) => {
      if (!canDraftLimitOrders || !userConnectedRef.current || price < 0) return [];

      const bookPrice =
        marketId && abacusStateManager.stateManager.state?.marketOrderbook(marketId)?.midPrice;
      if (!bookPrice) return [];

      const [side, textKey] =
        bookPrice < price
          ? [AbacusOrderSide.Sell, STRING_KEYS.DRAFT_LIMIT_SELL]
          : [AbacusOrderSide.Buy, STRING_KEYS.DRAFT_LIMIT_BUY];

      const formattedPrice = BigNumber(price).toFixed(tickSizeDecimalsRef.current ?? USD_DECIMALS);

      const onDraftLimitOrder = () => {
        track(AnalyticsEvents.TradingViewLimitOrderDrafted({ marketId, price }));

        // Allow user to keep their previous size input
        abacusStateManager.clearTradeInputValues({ shouldResetSize: false });
        abacusStateManager.setTradeValue({ field: TradeInputField.type, value: TradeTypes.LIMIT });
        abacusStateManager.setTradeValue({ field: TradeInputField.side, value: side.rawValue });

        dispatch(setTradeFormInputs({ limitPriceInput: formattedPrice }));
      };

      return [
        {
          position: 'top',
          text: stringGetter({ key: textKey, params: { PRICE: formattedPrice } }),
          click: onDraftLimitOrder,
        },
      ];
    },
    [canDraftLimitOrders, dispatch, marketId, stringGetter]
  );
}
