const ZERO = '0';

const countZeros = (decimalDigits: string): number => {
  let zeroCount = 0;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < decimalDigits.length && decimalDigits[i] === ZERO; i++) {
    // eslint-disable-next-line no-plusplus
    zeroCount++;
  }
  return zeroCount;
};

export const formatZeroNumbers = (formattedValue: string, zerosThreshold: number = 4) => {
  const punctuationSymbol = formattedValue.match(/[.,]/g)?.pop();
  const hasCurrencySymbol = formattedValue.match(/^[^\d]/)?.pop() !== undefined;
  const significantDigitsSubStart = hasCurrencySymbol ? 1 : 0;
  const currencySign = hasCurrencySymbol ? formattedValue[0] : undefined;

  if (!punctuationSymbol) {
    return {
      currencySign,
      significantDigits: formattedValue.substring(significantDigitsSubStart),
    };
  }

  const punctIdx = formattedValue.lastIndexOf(punctuationSymbol);
  if (!formattedValue.includes(ZERO, punctIdx + 1) || punctIdx === formattedValue.length - 1) {
    return {
      currencySign,
      significantDigits: formattedValue.substring(significantDigitsSubStart, punctIdx),
      punctuationSymbol,
      zeros: 0,
      decimalDigits: formattedValue.substring(punctIdx + 1),
    };
  }

  const charsAfterPunct = formattedValue.slice(punctIdx + 1);
  const zerosCount = countZeros(charsAfterPunct);

  if (zerosCount < zerosThreshold) {
    return {
      currencySign,
      significantDigits: formattedValue.substring(significantDigitsSubStart, punctIdx),
      punctuationSymbol,
      zeros: 0,
      decimalDigits: charsAfterPunct,
    };
  }

  const otherDigits = charsAfterPunct.substring(zerosCount);
  const canDisplayZeros = zerosCount !== 0 || otherDigits.length !== 0;

  return {
    currencySign,
    significantDigits: formattedValue.substring(significantDigitsSubStart, punctIdx),
    zeros: canDisplayZeros ? zerosCount : 0,
    decimalDigits: otherDigits,
    punctuationSymbol,
  };
};
