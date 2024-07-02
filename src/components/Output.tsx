/* eslint-disable react/no-unstable-nested-components */
import { useContext, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { DateTime } from 'luxon';
import styled, { css } from 'styled-components';

import { SupportedLocales } from '@/constants/localization';
import {
  LEVERAGE_DECIMALS,
  PERCENT_DECIMALS,
  SMALL_PERCENT_DECIMALS,
  SMALL_USD_DECIMALS,
  TOKEN_DECIMALS,
  USD_DECIMALS,
} from '@/constants/numbers';
import { UNICODE } from '@/constants/unicode';

import { LoadingContext } from '@/contexts/LoadingContext';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { RelativeTime } from '@/components/RelativeTime';
import { Tag } from '@/components/Tag';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { MustBigNumber, isNumber, type BigNumberish } from '@/lib/numbers';
import { getStringsForDateTimeDiff, getTimestamp } from '@/lib/timeUtils';

import { LoadingOutput } from './Loading/LoadingOutput';
import { NumberValue } from './NumberValue';

// see useFormattedDateOutput for how to get selectedLocale in app
export function formatDateOutput(
  value: string | number | null | undefined,
  type: OutputType.Date | OutputType.DateTime | OutputType.Time,
  {
    // required
    selectedLocale,

    // optional
    useUTC,
    dateFormat,
  }: {
    selectedLocale: SupportedLocales;

    useUTC?: boolean;
    dateFormat?: 'full' | 'long' | 'medium' | 'short' | undefined;
  }
) {
  if (value == null || (typeof value !== 'string' && typeof value !== 'number')) return null;
  const date = new Date(value);
  const dateString = {
    [OutputType.Date]: date.toLocaleString(selectedLocale, {
      dateStyle: 'medium',
      timeZone: useUTC ? 'UTC' : undefined,
    }),
    [OutputType.DateTime]: date.toLocaleString(selectedLocale, {
      dateStyle: dateFormat ?? 'short',
      timeStyle: 'short',
      timeZone: useUTC ? 'UTC' : undefined,
    }),
    [OutputType.Time]: date.toLocaleString(selectedLocale, {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: useUTC ? 'UTC' : undefined,
    }),
  }[type];
  return dateString;
}

// given an array whose last element is an object, return that array but with strings keys removed from last element
type OmitFromLastElement<T extends any[], Strings extends string> = T extends [
  ...infer begin,
  infer options,
]
  ? [...begin, Omit<options, Strings>]
  : never;

// must manually memoize options object if you want proper memoization
export function useFormattedDateOutput(
  ...[value, type, options]: OmitFromLastElement<
    Parameters<typeof formatDateOutput>,
    'selectedLocale'
  >
) {
  const selectedLocale = useAppSelector(getSelectedLocale);
  return useMemo(
    () => formatDateOutput(value, type, { selectedLocale, ...options }),
    [value, type, options, selectedLocale]
  );
}

export function formatNumberOutput(
  value: BigNumberish | null | undefined,
  type:
    | OutputType.CompactNumber
    | OutputType.Number
    | OutputType.Fiat
    | OutputType.SmallFiat
    | OutputType.CompactFiat
    | OutputType.Asset
    | OutputType.Percent
    | OutputType.SmallPercent
    | OutputType.Multiple,
  {
    // required
    decimalSeparator,
    groupSeparator,
    selectedLocale,

    // optional
    useGrouping = true,
    roundingMode = BigNumber.ROUND_HALF_UP,
    fractionDigits,
    minimumFractionDigits,
    showSign = ShowSign.Negative,
  }: {
    decimalSeparator: string | undefined;
    groupSeparator: string | undefined;
    selectedLocale: string;

    fractionDigits?: number | null;
    minimumFractionDigits?: number;
    roundingMode?: BigNumber.RoundingMode;
    useGrouping?: boolean;
    showSign?: ShowSign;
  }
) {
  const valueBN = MustBigNumber(value).abs();
  const isNegative = MustBigNumber(value).isNegative();
  const isPositive = MustBigNumber(value).isPositive() && !MustBigNumber(value).isZero();

  const sign: string | undefined = {
    [ShowSign.Both]: isNegative ? UNICODE.MINUS : isPositive ? UNICODE.PLUS : undefined,
    [ShowSign.Negative]: isNegative ? UNICODE.MINUS : undefined,
    [ShowSign.None]: undefined,
  }[showSign];

  const format = {
    decimalSeparator,
    ...(useGrouping
      ? {
          groupSeparator,
          groupSize: 3,
          secondaryGroupSize: 0,
          fractionGroupSeparator: ' ',
          fractionGroupSize: 0,
        }
      : {}),
  };

  const getFormattedVal = (
    val: BigNumber,
    fallbackDecimals: number,
    formattingOptions?: FormattingOptions
  ) => {
    const numDigits = fractionDigits ?? fallbackDecimals;
    const precisionVal = minimumFractionDigits
      ? MustBigNumber(val.toPrecision(minimumFractionDigits, roundingMode)).abs()
      : val;
    const dp = minimumFractionDigits ? precisionVal.decimalPlaces() ?? numDigits : numDigits;
    return precisionVal.toFormat(dp, roundingMode, { ...format, ...formattingOptions });
  };

  const numberRenderers = {
    [OutputType.CompactNumber]: () => {
      if (!isNumber(value)) {
        throw new Error('value must be a number for compact number output');
      }

      return Intl.NumberFormat(selectedLocale, {
        style: 'decimal',
        notation: 'compact',
        maximumSignificantDigits: 3,
      })
        .format(Math.abs(value))
        .toLowerCase();
    },
    [OutputType.Number]: () => getFormattedVal(valueBN, 0),
    [OutputType.Fiat]: () => getFormattedVal(valueBN, USD_DECIMALS, { prefix: '$' }),
    [OutputType.SmallFiat]: () => getFormattedVal(valueBN, SMALL_USD_DECIMALS, { prefix: '$' }),
    [OutputType.CompactFiat]: () => {
      if (!isNumber(value)) {
        throw new Error('value must be a number for compact fiat output');
      }

      return Intl.NumberFormat(selectedLocale, {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumSignificantDigits: 3,
      })
        .format(Math.abs(value))
        .toLowerCase();
    },
    [OutputType.Asset]: () => getFormattedVal(valueBN, TOKEN_DECIMALS),
    [OutputType.Percent]: () =>
      getFormattedVal(valueBN.times(100), PERCENT_DECIMALS, { suffix: '%' }),
    [OutputType.SmallPercent]: () =>
      getFormattedVal(valueBN.times(100), SMALL_PERCENT_DECIMALS, { suffix: '%' }),
    [OutputType.Multiple]: () => getFormattedVal(valueBN, LEVERAGE_DECIMALS, { suffix: '×' }),
  };

  return `${sign ?? ''}${numberRenderers[type]()}`;
}

// must manually memoize options object if you want proper memoization
export function useFormattedNumberOutput(
  ...[value, type, options]: OmitFromLastElement<
    Parameters<typeof formatNumberOutput>,
    'decimalSeparator' | 'groupSeparator'
  >
) {
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
  return useMemo(
    () => formatNumberOutput(value, type, { decimalSeparator, groupSeparator, ...options }),
    [decimalSeparator, groupSeparator, options, type, value]
  );
}

export enum OutputType {
  Text = 'Text',
  CompactNumber = 'CompactNumber',
  Number = 'Number',
  Fiat = 'Fiat',
  SmallFiat = 'SmallFiat',
  CompactFiat = 'CompactFiat',
  Asset = 'Asset',
  Percent = 'Percent',
  SmallPercent = 'SmallPercent',
  Multiple = 'Multiple',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  RelativeTime = 'RelativeTime',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  DateTime = 'DateTime',
  Date = 'Date',
  Time = 'Time',
}

export enum ShowSign {
  Both = 'Both',
  Negative = 'Negative',
  None = 'None',
}

type FormattingOptions = {
  prefix?: string;
  suffix?: string;
};

type ElementProps = {
  type: OutputType;
  value?: BigNumberish | null;

  // general props
  isLoading?: boolean;
  tag?: React.ReactNode;
  slotLeft?: React.ReactNode;
  slotRight?: React.ReactNode;

  // only for numbers, but they are most common so we hoist
  fractionDigits?: number | null;
  minimumFractionDigits?: number;
  showSign?: ShowSign;
  useGrouping?: boolean;
  roundingMode?: BigNumber.RoundingMode;
  withParentheses?: boolean;
  withSubscript?: boolean;

  relativeTimeOptions?: {
    format: 'long' | 'short' | 'narrow' | 'singleCharacter';
    resolution?: number;
    stripRelativeWords?: boolean;
  };
  timeOptions?: {
    useUTC?: boolean;
  };
  dateOptions?: {
    format?: 'full' | 'long' | 'medium' | 'short' | undefined;
  };
};

type StyleProps = {
  className?: string;
  withBaseFont?: boolean;
};

export type OutputProps = ElementProps & StyleProps;

export const Output = ({
  value,
  isLoading,
  slotLeft,
  slotRight,
  tag,
  className,
  withBaseFont,
  type,

  useGrouping = true,
  fractionDigits,
  minimumFractionDigits,
  roundingMode = BigNumber.ROUND_HALF_UP,
  withSubscript = false,
  withParentheses,
  showSign = ShowSign.Negative,

  dateOptions,
  relativeTimeOptions = {
    format: 'singleCharacter',
  },
  timeOptions,
}: OutputProps) => {
  const selectedLocale = useAppSelector(getSelectedLocale);
  const stringGetter = useStringGetter();
  const isDetailsLoading = useContext(LoadingContext);
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();

  if (!!isLoading || !!isDetailsLoading) {
    return <LoadingOutput />;
  }

  switch (type) {
    case OutputType.Text: {
      return (
        <$Text
          key={value?.toString()}
          title={`${value ?? ''}${tag ? ` ${tag}` : ''}`}
          className={className}
        >
          {slotLeft}
          {value?.toString() ?? null}

          {tag && <Tag>{tag}</Tag>}
          {slotRight}
        </$Text>
      );
    }
    case OutputType.RelativeTime: {
      const timestamp = getTimestamp(value);
      if (!timestamp) return null;

      if (relativeTimeOptions.format === 'singleCharacter') {
        const { timeString, unitStringKey } = getStringsForDateTimeDiff(
          DateTime.fromMillis(timestamp)
        );

        return (
          <$Text
            key={value?.toString()}
            title={`${value ?? ''}${tag ? ` ${tag}` : ''}`}
            className={className}
          >
            <time
              dateTime={new Date(timestamp).toISOString()}
              title={new Date(timestamp).toLocaleString(selectedLocale)}
            >
              {timeString}
              {stringGetter({ key: unitStringKey })}
            </time>

            {tag && <Tag>{tag}</Tag>}
          </$Text>
        );
      }

      return (
        <$Text
          key={value?.toString()}
          title={`${value ?? ''}${tag ? ` ${tag}` : ''}`}
          className={className}
        >
          <RelativeTime timestamp={timestamp} {...relativeTimeOptions} />

          {tag && <Tag>{tag}</Tag>}
        </$Text>
      );
    }
    case OutputType.Date:
    case OutputType.Time:
    case OutputType.DateTime: {
      if (value == null || (typeof value !== 'string' && typeof value !== 'number')) return null;
      const dateString = formatDateOutput(value, type, {
        useUTC: timeOptions?.useUTC,
        dateFormat: dateOptions?.format,
        selectedLocale,
      });

      return (
        <$Text key={value} title={`${value ?? ''}${tag ? ` ${tag}` : ''}`} className={className}>
          {dateString}
        </$Text>
      );
    }
    case OutputType.CompactNumber:
    case OutputType.Number:
    case OutputType.Fiat:
    case OutputType.SmallFiat:
    case OutputType.CompactFiat:
    case OutputType.Asset:
    case OutputType.Percent:
    case OutputType.SmallPercent:
    case OutputType.Multiple: {
      const hasValue = value !== null && value !== undefined;
      const isNegative = MustBigNumber(value).isNegative();
      const isPositive = MustBigNumber(value).isPositive() && !MustBigNumber(value).isZero();

      const sign: string | undefined = {
        [ShowSign.Both]: isNegative ? UNICODE.MINUS : isPositive ? UNICODE.PLUS : undefined,
        [ShowSign.Negative]: isNegative ? UNICODE.MINUS : undefined,
        [ShowSign.None]: undefined,
      }[showSign];

      const renderedNumber = (
        <NumberValue
          value={formatNumberOutput(value, type, {
            decimalSeparator,
            groupSeparator,
            selectedLocale,
            useGrouping,
            fractionDigits,
            minimumFractionDigits,
            roundingMode,
            showSign: ShowSign.None,
          })}
          withSubscript={withSubscript}
        />
      );
      return (
        <$Number
          key={value?.toString()}
          title={`${value ?? ''}${
            (
              { [OutputType.Multiple]: '×', [OutputType.Fiat]: ' USD' } as Record<
                OutputType,
                string
              >
            )[type] ?? ''
          }${tag ? ` ${tag}` : ''}`}
          className={className}
          withParentheses={withParentheses}
          withBaseFont={withBaseFont}
        >
          {slotLeft}
          {sign && <$Sign>{sign}</$Sign>}
          {hasValue && renderedNumber}
          {slotRight}
          {tag && <$Tag>{tag}</$Tag>}
        </$Number>
      );
    }
    default:
      return null;
  }
};

const $Text = styled.output<{ withParentheses?: boolean }>`
  --output-beforeString: '';
  --output-afterString: '';
  --output-sign-color: currentColor;

  ${layoutMixins.inlineRow}
  gap: 0;

  &:empty {
    color: var(--color-text-0);
    opacity: 0.5;

    &:after {
      content: '-' var(--output-afterString);
    }
  }

  &:before {
    content: var(--output-beforeString);
  }

  &:after {
    content: var(--output-afterString);
  }

  ${({ withParentheses }) =>
    withParentheses &&
    css`
      --output-beforeString: '(';
      --output-afterString: ')';
    `}
`;

const $Tag = styled(Tag)`
  margin-left: 0.5ch;
`;

const $Sign = styled.span`
  color: var(--output-sign-color);
`;

const $Number = styled($Text)<{ withBaseFont?: boolean }>`
  ${({ withBaseFont }) =>
    !withBaseFont &&
    css`
      font-feature-settings: var(--fontFeature-monoNumbers);
    `}
`;
