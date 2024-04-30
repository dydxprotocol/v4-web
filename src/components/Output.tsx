import { useContext } from 'react';

import BigNumber from 'bignumber.js';
import { DateTime } from 'luxon';
import { useSelector } from 'react-redux';
import styled, { css, type AnyStyledComponent } from 'styled-components';

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
import { useLocaleSeparators, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { RelativeTime } from '@/components/RelativeTime';
import { Tag } from '@/components/Tag';

import { getSelectedLocale } from '@/state/localizationSelectors';

import { MustBigNumber, isNumber, type BigNumberish } from '@/lib/numbers';
import { getStringsForDateTimeDiff, getTimestamp } from '@/lib/timeUtils';

import { LoadingOutput } from './Loading/LoadingOutput';

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
  RelativeTime = 'RelativeTime',
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
  slotRight?: React.ReactNode;
  useGrouping?: boolean;
  roundingMode?: BigNumber.RoundingMode;
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
  slotRight,
  useGrouping = true,
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
  const selectedLocale = useSelector(getSelectedLocale);
  const stringGetter = useStringGetter();
  const isDetailsLoading = useContext(LoadingContext);
  const { decimal: LOCALE_DECIMAL_SEPARATOR, group: LOCALE_GROUP_SEPARATOR } =
    useLocaleSeparators();

  if (isLoading || isDetailsLoading) {
    return <LoadingOutput />;
  }

  switch (type) {
    case OutputType.Text: {
      return (
        <Styled.Text
          key={value?.toString()}
          title={`${value ?? ''}${tag ? ` ${tag}` : ''}`}
          className={className}
        >
          {value?.toString() ?? null}

          {tag && <Tag>{tag}</Tag>}
          {slotRight}
        </Styled.Text>
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
          <Styled.Text
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
          </Styled.Text>
        );
      }

      return (
        <Styled.Text
          key={value?.toString()}
          title={`${value ?? ''}${tag ? ` ${tag}` : ''}`}
          className={className}
        >
          <RelativeTime timestamp={timestamp} {...relativeTimeFormatOptions} />

          {tag && <Tag>{tag}</Tag>}
        </Styled.Text>
      );
    }
    case OutputType.Date:
    case OutputType.Time:
    case OutputType.DateTime: {
      if ((typeof value !== 'string' && typeof value !== 'number') || !value) return null;
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

      return (
        <Styled.Text
          key={value}
          title={`${value ?? ''}${tag ? ` ${tag}` : ''}`}
          className={className}
        >
          {dateString}
        </Styled.Text>
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
      const valueBN = MustBigNumber(value).abs();
      const isNegative = MustBigNumber(value).isNegative();
      const isPositive = MustBigNumber(value).isPositive() && !MustBigNumber(value).isZero();

      const sign: string | undefined = {
        [ShowSign.Both]: isNegative ? UNICODE.MINUS : isPositive ? UNICODE.PLUS : undefined,
        [ShowSign.Negative]: isNegative ? UNICODE.MINUS : undefined,
        [ShowSign.None]: undefined,
      }[showSign];

      const format = {
        decimalSeparator: LOCALE_DECIMAL_SEPARATOR,
        ...(useGrouping
          ? {
              groupSeparator: LOCALE_GROUP_SEPARATOR,
              groupSize: 3,
              secondaryGroupSize: 0,
              fractionGroupSeparator: ' ',
              fractionGroupSize: 0,
            }
          : {}),
      };

      return (
        <Styled.Number
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
          {sign && <Styled.Sign>{sign}</Styled.Sign>}
          {hasValue &&
            {
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
                valueBN
                  .times(100)
                  .toFormat(fractionDigits ?? SMALL_PERCENT_DECIMALS, roundingMode, {
                    ...format,
                    suffix: '%',
                  }),
              [OutputType.Multiple]: () =>
                valueBN.toFormat(fractionDigits ?? LEVERAGE_DECIMALS, roundingMode, {
                  ...format,
                  suffix: '×',
                }),
            }[type]()}
          {slotRight}
          {tag && <Styled.Tag>{tag}</Styled.Tag>}
        </Styled.Number>
      );
    }
    default:
      return null;
  }
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Output = styled.output<{ withParentheses?: boolean }>`
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

Styled.Tag = styled(Tag)`
  margin-left: 0.5ch;
`;

Styled.Sign = styled.span`
  color: var(--output-sign-color);
`;

Styled.Text = styled(Styled.Output)``;

Styled.Number = styled(Styled.Output)<{ withBaseFont?: boolean }>`
  ${({ withBaseFont }) =>
    !withBaseFont &&
    css`
      font-feature-settings: var(--fontFeature-monoNumbers);
    `}
`;
