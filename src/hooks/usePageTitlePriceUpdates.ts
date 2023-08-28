import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { DEFAULT_DOCUMENT_TITLE } from '@/constants/routes';

import { getSelectedLocale } from '@/state/localizationSelectors';
import { getCurrentMarketData, getCurrentMarketId } from '@/state/perpetualsSelectors';
import type { RootState } from '@/state/_store';

import { useBreakpoints } from './useBreakpoints';

export const usePageTitlePriceUpdates = () => {
  const selectedLocale = useSelector(getSelectedLocale);
  const { isNotTablet } = useBreakpoints();
  const id = useSelector(getCurrentMarketId);
  const oraclePrice = useSelector((state: RootState) => getCurrentMarketData(state)?.oraclePrice);

  useEffect(() => {
    if (id && oraclePrice && isNotTablet) {
      const priceString = oraclePrice.toLocaleString(selectedLocale);
      document.title = `$${priceString} ${id} · ${DEFAULT_DOCUMENT_TITLE}`;
    } else {
      document.title = DEFAULT_DOCUMENT_TITLE;
    }

    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
    };
  }, [oraclePrice]);
};
