import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMatch, useNavigate } from 'react-router-dom';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_MARKETID } from '@/constants/markets';
import { AppRoute, DEFAULT_TRADE_ROUTE } from '@/constants/routes';

import { getSelectedNetwork } from '@/state/appSelectors';
import { closeDialogInTradeBox } from '@/state/dialogs';
import { setCurrentMarketId } from '@/state/perpetuals';

import abacusStateManager from '@/lib/abacus';

import { useLocalStorage } from './useLocalStorage';

export const useCurrentMarketId = () => {
  const navigate = useNavigate();
  const match = useMatch(`/${AppRoute.Trade}/:marketId`);
  const { marketId } = match?.params ?? {};
  const dispatch = useDispatch();
  const selectedNetwork = useSelector(getSelectedNetwork);
  const [lastViewedMarket, setLastViewedMarket] = useLocalStorage({
    key: LocalStorageKey.LastViewedMarket,
    defaultValue: DEFAULT_MARKETID,
  });

  useEffect(() => {
    setLastViewedMarket(marketId ?? DEFAULT_MARKETID);
    dispatch(setCurrentMarketId(marketId ?? DEFAULT_MARKETID));
    dispatch(closeDialogInTradeBox());

    if (!marketId) {
      navigate(lastViewedMarket ? `${AppRoute.Trade}/${lastViewedMarket}` : DEFAULT_TRADE_ROUTE, {
        replace: true,
      });
    } else {
      navigate(`${AppRoute.Trade}/${marketId}`, {
        replace: true,
      });
    }
  }, [marketId]);

  useEffect(() => {
    abacusStateManager.setMarket(marketId ?? DEFAULT_MARKETID);
  }, [selectedNetwork, marketId]);
};
