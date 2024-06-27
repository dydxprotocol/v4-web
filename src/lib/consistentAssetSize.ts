import { mapValues, range, zipObject } from 'lodash';

import { SUPPORTED_LOCALE_STRING_LABELS, SupportedLocales } from '@/constants/localization';

import { formatNumberOutput, OutputType } from '@/components/Output';

// for each locale, an array of the correct compact number suffix to use for 10^{index}
// e.g. for "en" we have ['', '', '', 'k', 'k', 'k', 'm', 'm', 'm', 'b', 'b', 'b', 't', 't', 't']
const supportedLocaleToCompactSuffixByPowerOfTen = mapValues(
  SUPPORTED_LOCALE_STRING_LABELS,
  (name, lang) =>
    range(15)
      .map((a) =>
        Intl.NumberFormat(lang, {
          style: 'decimal',
          notation: 'compact',
          maximumSignificantDigits: 6,
        }).format(Math.abs(10 ** a))
      )
      // first capture group grabs all the numbers with normal separator, then we grab any groups of whitespace+numbers
      // this is so we know which languages keep whitespace before the suffix
      .map((b) => b.replace(/(^[\d,.]+){1}(\s\d+)*/, ''))
      .map((b) => b.toLowerCase())
);

const zipObjectFn = <T extends string, K>(arr: T[], valueGenerator: (val: T) => K) =>
  zipObject(
    arr,
    arr.map((val) => valueGenerator(val))
  );

// for each locale, look up a given suffix (from map above) and get the correct power of ten to divide numbers by when using this suffix
// e.g. for "en" if you look up "k" you get 3 (1000), if you look up "m" you get 6 (1,000,000)
const supportedLocaleToSuffixPowers = mapValues(
  supportedLocaleToCompactSuffixByPowerOfTen,
  (values) => zipObjectFn([...new Set(values)], (f) => values.indexOf(f))
);

export const getConsistentAssetSizeString = (
  sizeToRender: number,
  {
    decimalSeparator,
    groupSeparator,
    selectedLocale,
    stepSize,
    stepSizeDecimals,
  }: {
    selectedLocale: SupportedLocales;
    stepSizeDecimals: number;
    stepSize: number;
    decimalSeparator: string | undefined;
    groupSeparator: string | undefined;
  }
) => {
  const { displayDivisor, displaySuffix } = (() => {
    if (stepSizeDecimals !== 0 || stepSize == null || stepSize < 10) {
      return { displayDivisor: 1, displaySuffix: '' };
    }
    const unitToUse =
      supportedLocaleToCompactSuffixByPowerOfTen[selectedLocale][Math.log10(stepSize)];
    return {
      displayDivisor: 10 ** supportedLocaleToSuffixPowers[selectedLocale][unitToUse],
      displaySuffix: unitToUse,
    };
  })();
  return `${formatNumberOutput(sizeToRender / displayDivisor, OutputType.Number, {
    decimalSeparator,
    groupSeparator,
    fractionDigits: stepSizeDecimals,
  })}${displaySuffix}`;
};
