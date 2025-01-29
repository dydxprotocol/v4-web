import { useEffect } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';

import { SMALL_USD_DECIMALS } from '@/constants/numbers';
import { DEFAULT_DOCUMENT_TITLE } from '@/constants/routes';

import { OutputType, formatNumberOutput } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { getCurrentMarketMidMarketPriceWithOraclePriceFallback } from '@/state/perpetualsSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

import { useBreakpoints } from './useBreakpoints';
import { useLocaleSeparators } from './useLocaleSeparators';

export const usePageTitlePriceUpdates = () => {
  const { isNotTablet } = useBreakpoints();
  const id = useAppSelector(getCurrentMarketId);
  const selectedLocale = useAppSelector(getSelectedLocale);
  const { tickSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();

  const orderbookMidMarketPrice = useAppSelector(
    getCurrentMarketMidMarketPriceWithOraclePriceFallback
  );

  useEffect(() => {
    if (id && orderbookMidMarketPrice && isNotTablet) {
      const priceString = formatNumberOutput(orderbookMidMarketPrice, OutputType.Fiat, {
        decimalSeparator,
        groupSeparator,
        selectedLocale,
        fractionDigits: tickSizeDecimals ?? SMALL_USD_DECIMALS,
      });
      document.title = `${priceString} ${id} · ${DEFAULT_DOCUMENT_TITLE}`;
    } else {
      document.title = DEFAULT_DOCUMENT_TITLE;
    }

    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
    };
  }, [orderbookMidMarketPrice, tickSizeDecimals]);
};
