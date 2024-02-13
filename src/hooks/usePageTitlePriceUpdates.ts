import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { DEFAULT_DOCUMENT_TITLE } from '@/constants/routes';

import { getSelectedLocale } from '@/state/localizationSelectors';
import {
  getCurrentMarketId,
  getCurrentMarketMidMarketPrice,
  getCurrentMarketOraclePrice,
} from '@/state/perpetualsSelectors';

import { useBreakpoints } from './useBreakpoints';

export const usePageTitlePriceUpdates = () => {
  const selectedLocale = useSelector(getSelectedLocale);
  const { isNotTablet } = useBreakpoints();
  const id = useSelector(getCurrentMarketId);
  const oraclePrice = useSelector(getCurrentMarketOraclePrice);
  const orderbookMidMarketPrice = useSelector(getCurrentMarketMidMarketPrice);

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
