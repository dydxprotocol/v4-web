import { useMemo } from 'react';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AccentTag } from './Tag';
import { WithTooltip } from './WithTooltip';

export const TradeFeeDiscountTag = ({ marketFeeDiscount }: { marketFeeDiscount?: number }) => {
  const stringGetter = useStringGetter();

  const tagContent = useMemo(() => {
    if (marketFeeDiscount == null) {
      return null;
    }

    if (marketFeeDiscount === 0) {
      return stringGetter({ key: STRING_KEYS.FREE });
    }

    return stringGetter({ key: STRING_KEYS.DISCOUNT });
  }, [marketFeeDiscount, stringGetter]);

  if (marketFeeDiscount == null || tagContent == null) {
    return null;
  }

  return (
    <WithTooltip
      tooltipString={`This market has a fee discount of ${(1 - marketFeeDiscount) * 100}% applied.`}
    >
      <AccentTag>{tagContent}</AccentTag>
    </WithTooltip>
  );
};
