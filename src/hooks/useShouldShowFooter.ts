import { useSelector } from 'react-redux';
import { matchPath, useLocation } from 'react-router-dom';

import { TRADE_ROUTE } from '@/constants/routes';

import { calculateCanAccountTrade } from '@/state/accountCalculators';

import { useBreakpoints } from './useBreakpoints';

export const useShouldShowFooter = () => {
  const { isTablet } = useBreakpoints();
  const { pathname } = useLocation();
  const canAccountTrade = useSelector(calculateCanAccountTrade);

  return !isTablet || !(matchPath(TRADE_ROUTE, pathname) && canAccountTrade);
};
