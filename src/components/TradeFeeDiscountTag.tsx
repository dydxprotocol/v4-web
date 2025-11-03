import { useMemo } from 'react';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Nullable } from '@/lib/typeUtils';

import { AccentTag } from './Tag';
import { WithTooltip } from './WithTooltip';

export const TradeFeeDiscountTag = ({
  marketFeeDiscount,
  symbol,
}: {
  marketFeeDiscount?: number;
  symbol: Nullable<string>;
}) => {
  const stringGetter = useStringGetter();

  const tagContent = useMemo(() => {
    if (marketFeeDiscount == null) {
      return null;
    }

    if (marketFeeDiscount === 0) {
      return stringGetter({ key: STRING_KEYS.FEE_FREE });
    }

    return stringGetter({ key: STRING_KEYS.FEE_DISCOUNT });
  }, [marketFeeDiscount, stringGetter]);

  if (marketFeeDiscount == null || tagContent == null) {
    return null;
  }

  const discountPercent = (1 - marketFeeDiscount) * 100;

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
