import { useEffect } from 'react';

import { DEFAULT_DOCUMENT_TITLE } from '@/constants/routes';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';
import {
  getCurrentMarketId,
  getCurrentMarketMidMarketPrice,
  getCurrentMarketOraclePrice,
} from '@/state/perpetualsSelectors';

import { useBreakpoints } from './useBreakpoints';

export const usePageTitlePriceUpdates = () => {
  const selectedLocale = useAppSelector(getSelectedLocale);
  const { isNotTablet } = useBreakpoints();
  const id = useAppSelector(getCurrentMarketId);
  const oraclePrice = useAppSelector(getCurrentMarketOraclePrice);
  const orderbookMidMarketPrice = useAppSelector(getCurrentMarketMidMarketPrice);

  const price = orderbookMidMarketPrice ?? oraclePrice;

  useEffect(() => {
    if (id && price && isNotTablet) {
      const priceString = price.toLocaleString(selectedLocale);
      document.title = `$${priceString} ${id} · ${DEFAULT_DOCUMENT_TITLE}`;
    } else {
      document.title = DEFAULT_DOCUMENT_TITLE;
    }

    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
    };
  }, [price]);
};
