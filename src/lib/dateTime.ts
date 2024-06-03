import { allTimeUnits, timeUnits } from '@/constants/time';

// Given a literal from Intl.RelativeTimeFormat formatToParts,
// strip out words/symbols unrelated to time unit
const isolateTimeUnit = (literal: string) =>
  literal
    // Remove "future" words/symbols (e.g. "in", positive signs)
    // TODO: update with other locales
    .replace(
      /(?<fr_ru>^[+])|(?<en_de>^in )|(?<es>^dentro de )|(?<zh>后$)|(?<ja>後$)|(?<ko>후$)|(?<tr>[.]? önce$)|(?<pt>^em )/,
      ''
    )
    // Remove "past" words/symbols (e.g. "ago", negative signs)
    // TODO: update with other locales
    .replace(
      /(?<fr_ru>^[--])|(?<en>[.]? ago$)|(?<es>^hace )|(?<zh_ja>前$)|(?<ko>전$)|(?<tr>[.]? önce$)|(?<de>^vor )|(?<pt>^há )/,
      ''
    );

// Abbreviate time unit from Intl.RelativeTimeFormat { style: "narrow" }
// (e.g. "day" -> "d", "дн" -> "д")
const toSingleCharacterTimeUnit = (timeUnit: string) =>
  timeUnit
    // Disambiguate ambiguous prefixes
    // TODO: update with other locales
    .replace(/(?<en> ?mo)/, ' Mo')
    // Remove articles/"counting" words
    // TODO: update with other locales
    .replace(/(?<zh>个)|(?<ja>か)|(?<ko>개)/, '')
    // Strip leading space and naively take just the 1st character
    // TODO: take the 1st grapheme instead
    .match(/^\s?(.)|/)?.[1];

export const formatRelativeTime = (
  timestamp: number,
  {
    relativeToTimestamp = Date.now(),
    locale,
    format = 'singleCharacter',
    largestUnit = 'year',
    resolution = 2,
    stripRelativeWords = true,
  }: {
    locale: string;
    relativeToTimestamp?: number;
    format?: 'long' | 'short' | 'narrow' | 'singleCharacter';
    largestUnit?: keyof typeof timeUnits;
    resolution?: number;
    stripRelativeWords?: boolean;
  }
) => {
  let elapsed = Math.abs(timestamp - relativeToTimestamp);
  const sign = Math.sign(timestamp - relativeToTimestamp);

  const unitParts = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const [unit, amount] of Object.entries(timeUnits).slice(
    Object.keys(timeUnits).findIndex((u) => u === largestUnit)
  ))
    if (Math.abs(elapsed) >= amount) {
      unitParts.push(
        new Intl.RelativeTimeFormat(locale, {
          style: (
            {
              long: 'long',
              short: 'short',
              narrow: 'narrow',
              singleCharacter: 'narrow',
            } as const
          )[format],
          numeric: 'always',
        }).formatToParts(sign * Math.floor(elapsed / amount), unit as keyof typeof timeUnits)
      );

      // eslint-disable-next-line no-plusplus, no-param-reassign
      if (--resolution === 0) break;

      elapsed %= amount;
    }

  return unitParts
    .map(
      (parts) =>
        parts
          .map(({ value, type }) =>
            type === 'literal'
              ? format === 'singleCharacter'
                ? toSingleCharacterTimeUnit(stripRelativeWords ? isolateTimeUnit(value) : value)
                : stripRelativeWords
                  ? isolateTimeUnit(value)
                  : value
              : /* : type === 'integer' ?
                // fr/ru: remove "past" negative signs
                Math.abs(Number(value)) */
                value
          )
          .join('')

      // ([{ value }, { value: literal }]) => value + literal.replace(/ [^ ]+?$/, '')
    )
    .join(' ');
};

export const formatAbsoluteTime = (
  timestamp: number,
  {
    locale,
    resolutionUnit = 'second',
  }: {
    locale: string;
    resolutionUnit: keyof typeof allTimeUnits;
  }
) =>
  new Intl.DateTimeFormat(
    locale,
    (
      {
        millisecond: {
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          fractionalSecondDigits: 3,
          hour12: false,
        },
        centisecond: {
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          fractionalSecondDigits: 3,
          hour12: false,
        },
        decisecond: {
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          fractionalSecondDigits: 2,
          hour12: false,
        },
        second: {
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          fractionalSecondDigits: 1,
          hour12: false,
        },
        minute: { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false },
        hour: { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false },
        day: { hour: 'numeric', minute: 'numeric' },
        threeDays: { weekday: 'short', hour: 'numeric' },
        week: { weekday: 'short', hour: 'numeric' },
        month: { month: 'numeric', day: 'numeric', hour: 'numeric' },
        year: { year: 'numeric', month: 'numeric', day: 'numeric' },
      } as const
    )[resolutionUnit]
  ).format(timestamp);
