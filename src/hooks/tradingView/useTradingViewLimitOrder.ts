import { useCallback, useEffect, useRef } from 'react';

import BigNumber from 'bignumber.js';
import { ContextMenuItem } from 'public/tradingview/charting_library';

import { AbacusOrderSide, TradeInputField } from '@/constants/abacus';
import { USD_DECIMALS } from '@/constants/numbers';
import { TradeTypes } from '@/constants/trade';

import { getIsAccountConnected } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setTradeFormInputs } from '@/state/inputs';

import { AnalyticsEvents } from '@/constants/analytics';
import abacusStateManager from '@/lib/abacus';
import { track } from '@/lib/analytics/analytics';

export function useTradingViewLimitOrder(
  marketId?: string
): (unixTime: number, price: number) => ContextMenuItem[] {
  const dispatch = useAppDispatch();
  const canDraftLimitOrders = true; // useStatsigGateValue(StatsigFlags.ffLimitOrdersFromChart);

  // Every time we call tvChartWidget.onContextMenu, a new callback is _added_ and there is no way to remove previously
  // added menu options. So, instead of creating a new callback and calling .onContextMenu every time `isUserConnected` changes,
  // only pass in one stable callback on chart load that refers to changing `isUserConnected` values through a ref
  const isUserConnected = useAppSelector(getIsAccountConnected);
  const userConnectedRef = useRef(isUserConnected);

  useEffect(() => {
    userConnectedRef.current = isUserConnected;
  }, [isUserConnected]);

  return useCallback(
    (_: number, price: number) => {
      if (!canDraftLimitOrders || !userConnectedRef.current || price < 0) return [];

      const bookPrice =
        marketId && abacusStateManager.stateManager.state?.marketOrderbook(marketId)?.midPrice;
      if (!bookPrice) return [];

      const side = bookPrice < price ? AbacusOrderSide.Sell : AbacusOrderSide.Buy;
      const formattedPrice = BigNumber(price).toFixed(USD_DECIMALS);

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
          text: `Draft Limit ${side.name} at ${formattedPrice}`,
          click: onDraftLimitOrder,
        },
      ];
    },
    [canDraftLimitOrders, dispatch, marketId]
  );
}
