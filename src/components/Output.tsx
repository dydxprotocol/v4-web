/* eslint-disable react/no-unstable-nested-components */
import { useContext } from 'react';

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
function formatDateOutput(
  value: string | number | null | undefined,
  type: OutputType.Date | OutputType.DateTime | OutputType.Time,
  selectedLocale: SupportedLocales,
  {
    timeOptions,
  }: {
    timeOptions?: {
      useUTC?: boolean;
    };
  }
) {
  if (value == null || (typeof value !== 'string' && typeof value !== 'number')) return null;
  const date = new Date(value);
  const dateString = {
    [OutputType.Date]: date.toLocaleString(selectedLocale, {
      dateStyle: 'medium',
      timeZone: timeOptions?.useUTC ? 'UTC' : undefined,
    }),
    [OutputType.DateTime]: date.toLocaleString(selectedLocale, {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: timeOptions?.useUTC ? 'UTC' : undefined,
    }),
    [OutputType.Time]: date.toLocaleString(selectedLocale, {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: timeOptions?.useUTC ? 'UTC' : undefined,
    }),
  }[type];
  return dateString;
}

type RemoveArgsFromTupleForFormatDate<T> = T extends [...infer begin, unknown, infer options]
  ? [...begin, options]
  : never;

type FormatDateHookArgs = RemoveArgsFromTupleForFormatDate<Parameters<typeof formatDateOutput>>;

function useFormattedDateOutput(...args: FormatDateHookArgs) {
  const selectedLocale = useAppSelector(getSelectedLocale);
  return formatDateOutput(args[0], args[1], selectedLocale, args[2]);
}

function formatNumberOutput(
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
  decimalSeparator: string | undefined,
  groupSeparator: string | undefined,
  {
    useGrouping = true,
    roundingMode = BigNumber.ROUND_HALF_UP,
    fractionDigits,
    locale = navigator.language || 'en-US',
    showSign = ShowSign.Negative,
  }: {
    fractionDigits?: number | null;
    roundingMode?: BigNumber.RoundingMode;
    useGrouping?: boolean;
    locale?: string;
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

  const numberRenderers = {
    [OutputType.CompactNumber]: () => {
      if (!isNumber(value)) {
        throw new Error('value must be a number for compact number output');
      }

      return Intl.NumberFormat(locale, {
        style: 'decimal',
        notation: 'compact',
        maximumSignificantDigits: 3,
      })
        .format(Math.abs(value))
        .toLowerCase();
    },
    [OutputType.Number]: () =>
      valueBN.toFormat(fractionDigits ?? 0, roundingMode, {
        ...format,
      }),
    [OutputType.Fiat]: () =>
      valueBN.toFormat(fractionDigits ?? USD_DECIMALS, roundingMode, {
        ...format,
        prefix: '$',
      }),
    [OutputType.SmallFiat]: () =>
      valueBN.toFormat(fractionDigits ?? SMALL_USD_DECIMALS, roundingMode, {
        ...format,
        prefix: '$',
      }),
    [OutputType.CompactFiat]: () => {
      if (!isNumber(value)) {
        throw new Error('value must be a number for compact fiat output');
      }

      return Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumSignificantDigits: 3,
      })
        .format(Math.abs(value))
        .toLowerCase();
    },
    [OutputType.Asset]: () =>
      valueBN.toFormat(fractionDigits ?? TOKEN_DECIMALS, roundingMode, {
        ...format,
      }),
    [OutputType.Percent]: () =>
      valueBN.times(100).toFormat(fractionDigits ?? PERCENT_DECIMALS, roundingMode, {
        ...format,
        suffix: '%',
      }),
    [OutputType.SmallPercent]: () =>
      valueBN.times(100).toFormat(fractionDigits ?? SMALL_PERCENT_DECIMALS, roundingMode, {
        ...format,
        suffix: '%',
      }),
    [OutputType.Multiple]: () =>
      valueBN.toFormat(fractionDigits ?? LEVERAGE_DECIMALS, roundingMode, {
        ...format,
        suffix: '×',
      }),
  };
  return `${sign ?? ''}${numberRenderers[type]}`;
}

type RemoveArgsFromTupleForFormatNumber<T> = T extends [
  ...infer begin,
  unknown,
  unknown,
  infer options,
]
  ? [...begin, options]
  : never;

type FormatNumberHookArgs = RemoveArgsFromTupleForFormatNumber<
  Parameters<typeof formatNumberOutput>
>;

function useFormattedNumberOutput(...args: FormatNumberHookArgs) {
  const { decimal: LOCALE_DECIMAL_SEPARATOR, group: LOCALE_GROUP_SEPARATOR } =
    useLocaleSeparators();
  return formatNumberOutput(
    args[0],
    args[1],
    LOCALE_DECIMAL_SEPARATOR,
    LOCALE_GROUP_SEPARATOR,
    args[2]
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

type ElementProps = {
  type: OutputType;
  value?: BigNumberish | null;
  isLoading?: boolean;
  fractionDigits?: number | null;
  showSign?: ShowSign;
  slotLeft?: React.ReactNode;
  slotRight?: React.ReactNode;
  useGrouping?: boolean;
  roundingMode?: BigNumber.RoundingMode;
  withSubscript?: boolean;
  relativeTimeFormatOptions?: {
    format: 'long' | 'short' | 'narrow' | 'singleCharacter';
    resolution?: number;
    stripRelativeWords?: boolean;
  };
  timeOptions?: {
    useUTC?: boolean;
  };
  tag?: React.ReactNode;
  withParentheses?: boolean;
  locale?: string;
};

type StyleProps = {
  className?: string;
  withBaseFont?: boolean;
};

export type OutputProps = ElementProps & StyleProps;

export const Output = ({
  type,
  value,
  isLoading,
  fractionDigits,
  showSign = ShowSign.Negative,
  slotLeft,
  slotRight,
  useGrouping = true,
  withSubscript = false,
  roundingMode = BigNumber.ROUND_HALF_UP,
  relativeTimeFormatOptions = {
    format: 'singleCharacter',
  },
  timeOptions,
  tag,
  withParentheses,
  locale = navigator.language || 'en-US',
  className,
  withBaseFont,
}: OutputProps) => {
  const selectedLocale = useAppSelector(getSelectedLocale);
  const stringGetter = useStringGetter();
  const isDetailsLoading = useContext(LoadingContext);
  const { decimal: LOCALE_DECIMAL_SEPARATOR, group: LOCALE_GROUP_SEPARATOR } =
    useLocaleSeparators();

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

      if (relativeTimeFormatOptions.format === 'singleCharacter') {
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
              title={new Date(timestamp).toLocaleString(locale)}
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
          <RelativeTime timestamp={timestamp} {...relativeTimeFormatOptions} />

          {tag && <Tag>{tag}</Tag>}
        </$Text>
      );
    }
    case OutputType.Date:
    case OutputType.Time:
    case OutputType.DateTime: {
      if (value == null || (typeof value !== 'string' && typeof value !== 'number')) return null;
      const dateString = formatDateOutput(value, type, selectedLocale, { timeOptions });

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
          value={formatNumberOutput(value, type, LOCALE_DECIMAL_SEPARATOR, LOCALE_GROUP_SEPARATOR, {
            useGrouping,
            fractionDigits,
            locale,
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
