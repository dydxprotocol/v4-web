import { useCallback, useEffect, useRef } from 'react';

import { OrderSide, TradeFormType } from '@/bonsai/forms/trade/types';
import { BonsaiHelpers } from '@/bonsai/ontology';
import BigNumber from 'bignumber.js';
import { ContextMenuItem } from 'public/tradingview/charting_library';

import { AnalyticsEvents } from '@/constants/analytics';
import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';

import { store } from '@/state/_store';
import { getIsAccountConnected } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';

import { track } from '@/lib/analytics/analytics';

import { useStringGetter } from '../useStringGetter';

export function useTradingViewLimitOrder(
  marketId?: string,
  tickSizeDecimals?: number | null
): (unixTime: number, price: number) => ContextMenuItem[] {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const isUserConnected = useAppSelector(getIsAccountConnected);

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
      // this must be inline because this reference must stay stable from when trading view initializes
      const bookPrice = BonsaiHelpers.currentMarket.midPrice.data(store.getState())?.toNumber();
      if (!userConnectedRef.current || price < 0 || !marketIdRef.current) {
        return [];
      }

      if (!bookPrice) return [];

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [side, textKey] =
        bookPrice < price
          ? [OrderSide.SELL, STRING_KEYS.DRAFT_LIMIT_SELL]
          : [OrderSide.BUY, STRING_KEYS.DRAFT_LIMIT_BUY];

      const formattedPrice = BigNumber(price).toFixed(tickSizeDecimalsRef.current ?? USD_DECIMALS);

      const onDraftLimitOrder = () => {
        // Allow user to keep their previous size input
        dispatch(tradeFormActions.reset(true));
        dispatch(tradeFormActions.setOrderType(TradeFormType.LIMIT));
        dispatch(tradeFormActions.setSide(side));
        dispatch(tradeFormActions.setLimitPrice(formattedPrice));

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
    [dispatch, stringGetter]
  );
}
