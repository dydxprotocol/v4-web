import { useEffect } from 'react';

import { useMatch, useNavigate } from 'react-router-dom';

import { LocalStorageKey } from '@/constants/localStorage';
import { AppRoute } from '@/constants/routes';
import { SPOT_DEFAULT_TOKEN_MINT } from '@/constants/spot';

import { useLocalStorage } from '@/hooks/useLocalStorage';

import { useAppDispatch } from '@/state/appTypes';
import { setCurrentSpotToken } from '@/state/spot';

export const useCurrentSpotToken = () => {
  const navigate = useNavigate();
  const match = useMatch(`/${AppRoute.Spot}/:tokenMint`);
  const { tokenMint } = match?.params ?? {};
  const dispatch = useAppDispatch();

  const [lastViewedToken, setLastViewedToken] = useLocalStorage({
    key: LocalStorageKey.LastViewedSpotToken,
    defaultValue: SPOT_DEFAULT_TOKEN_MINT,
  });

  const validTokenMint = tokenMint ?? lastViewedToken;

  useEffect(() => {
    if (!tokenMint) {
      navigate(`${AppRoute.Spot}/${validTokenMint}`, { replace: true });
    } else {
      setLastViewedToken(tokenMint);
      dispatch(setCurrentSpotToken(tokenMint));
    }
  }, [tokenMint, validTokenMint, navigate, dispatch, setLastViewedToken]);

  return { currentSpotToken: validTokenMint };
};
