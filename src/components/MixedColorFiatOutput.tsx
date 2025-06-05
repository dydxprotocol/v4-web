import { USD_DECIMALS } from '@/constants/numbers';

import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';

import { BigNumberish, MustBigNumber } from '@/lib/numbers';

export const MixedColorFiatOutput = ({
  className,
  value,
}: {
  className?: string;
  value?: BigNumberish;
}) => {
  const { decimal: decimalSeparator } = useLocaleSeparators();
  const valueString = MustBigNumber(value).toFixed(USD_DECIMALS);
  const valueCharArr = valueString.split('.');
  const valueInt = valueCharArr[0];
  const valueDecimals = valueCharArr[1] ?? '00';

  return (
    <span className={className}>
      <span tw="text-color-text-2">${valueInt}</span>
      <span tw="text-color-text-0">
        {decimalSeparator}
        {valueDecimals}
      </span>
    </span>
  );
};
