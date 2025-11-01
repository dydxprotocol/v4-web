import { useEffect } from 'react';

import { useMatch } from 'react-router-dom';

import { AppRoute } from '@/constants/routes';

import { useAppDispatch } from '@/state/appTypes';
import { setCurrentSpotToken } from '@/state/spot';

export const useCurrentSpotToken = () => {
  const match = useMatch(`/${AppRoute.Spot}/:symbol`);
  const { symbol } = match?.params ?? {};
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setCurrentSpotToken(symbol));
  }, [symbol, dispatch]);

  return { currentSpotToken: symbol };
};
