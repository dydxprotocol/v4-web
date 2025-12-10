import { useMemo } from 'react';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { clamp } from '@/lib/math';
import { BIG_NUMBERS } from '@/lib/numbers';
import { Nullable } from '@/lib/typeUtils';

import { OutlinedAccentTag } from './Tag';
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
      return stringGetter({ key: STRING_KEYS.NO_FEES });
    }

    return stringGetter({ key: STRING_KEYS.FEE_DISCOUNT });
  }, [marketFeeDiscountMultiplier, stringGetter]);

  if (marketFeeDiscountMultiplier == null || tagContent == null) {
    return null;
  }

  const discountPercent = BIG_NUMBERS.ONE.minus(marketFeeDiscountMultiplier).times(100);
  const discountDecimalPlaces = discountPercent.decimalPlaces();
  const numDecimals = discountDecimalPlaces != null ? clamp(discountDecimalPlaces, 0, 2) : 0;

  return (
    <WithTooltip
      tooltip="market-fee-discount"
      stringParams={{
        SYMBOL: symbol ?? '',
        DISCOUNT_PERCENT: discountPercent.toFixed(numDecimals),
      }}
      withUnderline={false}
    >
      <OutlinedAccentTag>{tagContent}</OutlinedAccentTag>
    </WithTooltip>
  );
};
