/* eslint-disable react/no-unstable-nested-components */
import { useContext } from 'react';

import BigNumber from 'bignumber.js';
import { DateTime } from 'luxon';
import styled, { css } from 'styled-components';

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

      const numberRenderers = {
        [OutputType.CompactNumber]: () => {
          if (!isNumber(value)) {
            throw new Error('value must be a number for compact number output');
          }

          return (
            <NumberValue
              value={Intl.NumberFormat(locale, {
                style: 'decimal',
                notation: 'compact',
                maximumSignificantDigits: 3,
              })
                .format(Math.abs(value))
                .toLowerCase()}
              withSubscript={withSubscript}
            />
          );
        },
        [OutputType.Number]: () => (
          <NumberValue
            value={valueBN.toFormat(fractionDigits ?? 0, roundingMode, {
              ...format,
            })}
            withSubscript={withSubscript}
          />
        ),
        [OutputType.Fiat]: () => (
          <NumberValue
            value={valueBN.toFormat(fractionDigits ?? USD_DECIMALS, roundingMode, {
              ...format,
              prefix: '$',
            })}
            withSubscript={withSubscript}
          />
        ),
        [OutputType.SmallFiat]: () => (
          <NumberValue
            value={valueBN.toFormat(fractionDigits ?? SMALL_USD_DECIMALS, roundingMode, {
              ...format,
              prefix: '$',
            })}
            withSubscript={withSubscript}
          />
        ),
        [OutputType.CompactFiat]: () => {
          if (!isNumber(value)) {
            throw new Error('value must be a number for compact fiat output');
          }

          return (
            <NumberValue
              value={Intl.NumberFormat(locale, {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
                maximumSignificantDigits: 3,
              })
                .format(Math.abs(value))
                .toLowerCase()}
              withSubscript={withSubscript}
            />
          );
        },
        [OutputType.Asset]: () => (
          <NumberValue
            value={valueBN.toFormat(fractionDigits ?? TOKEN_DECIMALS, roundingMode, {
              ...format,
            })}
            withSubscript={withSubscript}
          />
        ),
        [OutputType.Percent]: () => (
          <NumberValue
            value={valueBN.times(100).toFormat(fractionDigits ?? PERCENT_DECIMALS, roundingMode, {
              ...format,
              suffix: '%',
            })}
            withSubscript={withSubscript}
          />
        ),
        [OutputType.SmallPercent]: () => (
          <NumberValue
            value={valueBN
              .times(100)
              .toFormat(fractionDigits ?? SMALL_PERCENT_DECIMALS, roundingMode, {
                ...format,
                suffix: '%',
              })}
            withSubscript={withSubscript}
          />
        ),
        [OutputType.Multiple]: () => (
          <NumberValue
            value={valueBN.toFormat(fractionDigits ?? LEVERAGE_DECIMALS, roundingMode, {
              ...format,
              suffix: '×',
            })}
            withSubscript={withSubscript}
          />
        ),
      };
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
          {hasValue && numberRenderers[type]()}
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
