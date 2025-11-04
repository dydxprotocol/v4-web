import { useMemo } from 'react';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Nullable } from '@/lib/typeUtils';

import { AccentTag } from './Tag';
import { WithTooltip } from './WithTooltip';

export const TradeFeeDiscountTag = ({
  marketFeeDiscountMultiplier,
  symbol,
}: {
  marketFeeDiscountMultiplier?: number;
  symbol: Nullable<string>;
}) => {
  const stringGetter = useStringGetter();

  const tagContent = useMemo(() => {
    if (marketFeeDiscountMultiplier == null) {
      return null;
    }

    if (marketFeeDiscountMultiplier === 0) {
      return stringGetter({ key: STRING_KEYS.FEE_FREE });
    }

    return stringGetter({ key: STRING_KEYS.FEE_DISCOUNT });
  }, [marketFeeDiscountMultiplier, stringGetter]);

  if (marketFeeDiscountMultiplier == null || tagContent == null) {
    return null;
  }

  const discountPercent = (1 - marketFeeDiscountMultiplier) * 100;

  return (
    <WithTooltip
      tooltip="market-fee-discount"
      stringParams={{
        SYMBOL: symbol ?? '',
        DISCOUNT_PERCENT: discountPercent.toFixed(),
      }}
    >
      <AccentTag>{tagContent}</AccentTag>
    </WithTooltip>
  );
};
