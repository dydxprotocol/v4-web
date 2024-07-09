import { matchPath, useLocation } from 'react-router-dom';

import { AppRoute, TRADE_ROUTE } from '@/constants/routes';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

import { useBreakpoints } from './useBreakpoints';

export const useShouldShowFooter = () => {
  const { isTablet } = useBreakpoints();
  const { pathname } = useLocation();
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);

  return (
    !isTablet ||
    !(
      !!(matchPath(TRADE_ROUTE, pathname) && canAccountTrade) ||
      !!matchPath(AppRoute.Vaults, pathname)
    )
  );
};
