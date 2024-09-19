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

import abacusStateManager from '@/lib/abacus';
import { track } from '@/lib/analytics/analytics';

import { useStringGetter } from '../useStringGetter';

export function useTradingViewLimitOrder(
  marketId?: string,
  tickSizeDecimals?: number | null
): (unixTime: number, price: number) => ContextMenuItem[] {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const isUserConnected = useAppSelector(getIsAccountConnected);

  const canDraftLimitOrders = true; // useStatsigGateValue(StatsigFlags.ffLimitOrdersFromChart);

  // Every time we call tvChartWidget.onContextMenu, a new callback is _added_ and there is no way to remove previously
  // added menu options. So, instead of creating a new callback and calling .onContextMenu every time these state variable
  // change, only pass in one stable callback on chart load that refers to updated state values through a ref
  const userConnectedRef = useRef(isUserConnected);
  const marketIdRef = useRef(marketId);
  const tickSizeDecimalsRef = useRef(tickSizeDecimals);

  useEffect(() => {
    userConnectedRef.current = isUserConnected;
    marketIdRef.current = marketId;
    tickSizeDecimalsRef.current = tickSizeDecimals;
  }, [isUserConnected, marketId, tickSizeDecimals]);

  return useCallback(
    (_: number, price: number) => {
      if (!canDraftLimitOrders || !userConnectedRef.current || price < 0 || !marketIdRef.current) {
        return [];
      }

      const bookPrice = abacusStateManager.stateManager.state?.marketOrderbook(
        marketIdRef.current
      )?.midPrice;
      if (!bookPrice) return [];

      const [side, textKey] =
        bookPrice < price
          ? [AbacusOrderSide.Sell, STRING_KEYS.DRAFT_LIMIT_SELL]
          : [AbacusOrderSide.Buy, STRING_KEYS.DRAFT_LIMIT_BUY];

      const formattedPrice = BigNumber(price).toFixed(tickSizeDecimalsRef.current ?? USD_DECIMALS);

      const onDraftLimitOrder = () => {
        // Allow user to keep their previous size input
        abacusStateManager.clearTradeInputValues({ shouldResetSize: false });
        abacusStateManager.setTradeValue({ field: TradeInputField.type, value: TradeTypes.LIMIT });
        abacusStateManager.setTradeValue({ field: TradeInputField.side, value: side.rawValue });

        dispatch(setTradeFormInputs({ limitPriceInput: formattedPrice }));

        track(
          AnalyticsEvents.TradingViewLimitOrderDrafted({
            marketId: marketIdRef.current,
            price: formattedPrice,
          })
        );
      };

      return [
        {
          position: 'top',
          text: stringGetter({ key: textKey, params: { PRICE: formattedPrice } }),
          click: onDraftLimitOrder,
        },
      ];
    },
    [canDraftLimitOrders, dispatch, stringGetter]
  );
}
