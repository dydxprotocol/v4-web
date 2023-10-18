import { useEffect, useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useMatch, useNavigate } from 'react-router-dom';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_MARKETID } from '@/constants/markets';
import { AppRoute } from '@/constants/routes';

import { getSelectedNetwork } from '@/state/appSelectors';
import { closeDialogInTradeBox } from '@/state/dialogs';
import { setCurrentMarketId } from '@/state/perpetuals';

import abacusStateManager from '@/lib/abacus';

import { useLocalStorage } from './useLocalStorage';
import { getMarketIds } from '@/state/perpetualsSelectors';

export const useCurrentMarketId = () => {
  const navigate = useNavigate();
  const match = useMatch(`/${AppRoute.Trade}/:marketId`);
  const { marketId } = match?.params ?? {};
  const dispatch = useDispatch();
  const selectedNetwork = useSelector(getSelectedNetwork);
  const marketIds = useSelector(getMarketIds, shallowEqual);
  const [lastViewedMarket, setLastViewedMarket] = useLocalStorage({
    key: LocalStorageKey.LastViewedMarket,
    defaultValue: DEFAULT_MARKETID,
  });

  const validId = useMemo(() => {
    if (marketIds.length === 0) return marketId ?? lastViewedMarket;
    if (!marketIds.includes(marketId ?? lastViewedMarket)) return DEFAULT_MARKETID;
    return marketId ?? lastViewedMarket;
  }, [marketIds, marketId]);

  useEffect(() => {
    setLastViewedMarket(validId);
    dispatch(setCurrentMarketId(validId));
    dispatch(closeDialogInTradeBox());

    navigate(`${AppRoute.Trade}/${validId}`, {
      replace: true,
    });
  }, [validId]);

  useEffect(() => {
    // Check for marketIds otherwise Abacus will silently fail its isMarketValid check
    if (marketIds) {
      abacusStateManager.setMarket(marketId ?? DEFAULT_MARKETID);
    }
  }, [selectedNetwork, marketIds, marketId]);
};
