import { useEffect } from 'react';

import { shallowEqual } from 'react-redux';

import { SMALL_USD_DECIMALS } from '@/constants/numbers';
import { DEFAULT_DOCUMENT_TITLE } from '@/constants/routes';

import { useAppSelector } from '@/state/appTypes';
import {
  getCurrentMarketConfig,
  getCurrentMarketId,
  getCurrentMarketMidMarketPrice,
  getCurrentMarketOraclePrice,
} from '@/state/perpetualsSelectors';

import { MustBigNumber } from '@/lib/numbers';

import { useBreakpoints } from './useBreakpoints';

export const usePageTitlePriceUpdates = () => {
  const { isNotTablet } = useBreakpoints();
  const id = useAppSelector(getCurrentMarketId);
  const oraclePrice = useAppSelector(getCurrentMarketOraclePrice);
  const { tickSizeDecimals } = useAppSelector(getCurrentMarketConfig, shallowEqual) ?? {};

  const orderbookMidMarketPrice = useAppSelector(getCurrentMarketMidMarketPrice);

  const price = orderbookMidMarketPrice ?? oraclePrice;

  useEffect(() => {
    if (id && price && isNotTablet) {
      const priceString = MustBigNumber(price).toFixed(tickSizeDecimals ?? SMALL_USD_DECIMALS);
      document.title = `$${priceString} ${id} · ${DEFAULT_DOCUMENT_TITLE}`;
    } else {
      document.title = DEFAULT_DOCUMENT_TITLE;
    }

    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
    };
  }, [price]);
};
