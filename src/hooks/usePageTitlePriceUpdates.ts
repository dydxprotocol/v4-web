import { useEffect } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { DEFAULT_DOCUMENT_TITLE } from '@/constants/routes';

import { getSelectedLocale } from '@/state/localizationSelectors';
import {
  getCurrentMarketData,
  getCurrentMarketId,
  getCurrentMarketOrderbook,
} from '@/state/perpetualsSelectors';

import { useBreakpoints } from './useBreakpoints';

export const usePageTitlePriceUpdates = () => {
  const selectedLocale = useSelector(getSelectedLocale);
  const { isNotTablet } = useBreakpoints();
  const id = useSelector(getCurrentMarketId);
  const oraclePrice = useSelector(getCurrentMarketData, shallowEqual)?.oraclePrice;
  const orderbookMidMarketPrice = useSelector(getCurrentMarketOrderbook, shallowEqual)?.midPrice;

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
