import { Dispatch, forwardRef, SetStateAction } from 'react';

import { NumericFormat, type NumberFormatValues, type SourceInfo } from 'react-number-format';
import type { SyntheticInputEvent } from 'react-number-format/types/types';
import styled, { css } from 'styled-components';

import {
  LEVERAGE_DECIMALS,
  PERCENT_DECIMALS,
  TOKEN_DECIMALS,
  USD_DECIMALS,
} from '@/constants/numbers';

import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';

import { BIG_NUMBERS } from '@/lib/numbers';

export enum InputType {
  Currency = 'Currency',
  Leverage = 'Leverage',
  Number = 'Number',
  Percent = 'Percent',
  Text = 'Text',
  Search = 'Search',
}

type StyleProps = {
  className?: string;
  $backgroundColorOverride?: string;
};

type ElementProps = {
  type?: InputType;
  value?: string | number | null;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
};

type ConditionalProps =
  | {
      allowNegative?: boolean;
      decimals?: number;
      max?: number;
      onChange?: (values: NumberFormatValues, e: SourceInfo) => void;
      onInput?: ({
        value,
        floatValue,
        formattedValue,
      }: {
        value: string;
        floatValue?: number;
        formattedValue: string;
      }) => void;
    }
  | {
      allowNegative?: never;
      decimals?: never;
      max?: never;
      onChange?: Dispatch<SetStateAction<string>> | React.ReactEventHandler<HTMLInputElement>;
      onInput?: (e: SyntheticInputEvent) => void;
    };

export type InputProps = ElementProps & StyleProps & ConditionalProps;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      allowNegative = false,
      decimals: inDecimals,
      disabled,
      id,
      max,
      placeholder,
      value,
      onBlur,
      onChange,
      onFocus,
      onInput,
      type = InputType.Number,
      // TODO: https://linear.app/dydx/issue/OTE-888/simplify-input-component-bg-styles
      // simplify input component styles. backgroundColorOverride has to override styles in too many places
      $backgroundColorOverride: backgroundColorOverride,
      ...otherProps
    },
    ref
  ) => {
    const { decimal: LOCALE_DECIMAL_SEPARATOR } = useLocaleSeparators();

    const numberFormatConfig = {
      [InputType.Currency]: {
        defaultDecimals: USD_DECIMALS,
        prefix: '$',
      },
      [InputType.Leverage]: {
        defaultDecimals: LEVERAGE_DECIMALS,
        suffix: '×',
      },
      [InputType.Number]: {
        defaultDecimals: TOKEN_DECIMALS,
      },
      [InputType.Percent]: {
        defaultDecimals: PERCENT_DECIMALS,
        suffix: '%',
      },
      [InputType.Text]: null,
      [InputType.Search]: null,
    }[type];

    const decimals = inDecimals ?? numberFormatConfig?.defaultDecimals;

    const defaultNumberPlaceholder = `${numberFormatConfig?.prefix ?? ''}${BIG_NUMBERS.ZERO.toFixed(
      decimals ?? USD_DECIMALS
    )}${numberFormatConfig?.suffix ?? ''}`;

    const formattedValue =
      typeof value === 'string'
        ? value
        : value != null
          ? Intl.NumberFormat(navigator.language || 'en-US', {
              maximumFractionDigits: decimals,
            }).format(value)
          : '';

    return (
      <$InputContainer className={className}>
        {type === InputType.Text || type === InputType.Search ? (
          <$Input
            $backgroundColorOverride={backgroundColorOverride}
            // React
            ref={ref}
            id={id}
            // Events
            onBlur={onBlur}
            onChange={onChange as any} // TODO fix types
            onFocus={onFocus}
            onInput={onInput as any} // TODO fix type
            // Native
            disabled={disabled}
            placeholder={placeholder}
            value={value ?? undefined}
            // Other
            data-1p-ignore // prevent 1Password fill
            data-hj-allow
            {...otherProps}
          />
        ) : (
          <$NumericFormat
            $backgroundColorOverride={backgroundColorOverride}
            // React
            getInputRef={ref}
            id={id}
            // NumericFormat
            valueIsNumericString
            allowNegative={allowNegative}
            decimalScale={decimals}
            decimalSeparator={LOCALE_DECIMAL_SEPARATOR}
            isAllowed={({ floatValue }: NumberFormatValues) =>
              floatValue ? floatValue <= (max ?? Number.MAX_VALUE) : true
            }
            prefix={numberFormatConfig?.prefix}
            suffix={numberFormatConfig?.suffix}
            // Events
            onBlur={onBlur}
            onValueChange={onChange as any} // TODO fix types
            onFocus={onFocus}
            onInput={(e: SyntheticInputEvent) => {
              if (!onInput) return;
              const newValue = e.target.value;
              const { prefix = '', suffix = '' } = numberFormatConfig ?? {};
              // Remove prefix and suffix, replace commas with periods
              const newFormattedValue = newValue.replace(prefix, '').replace(suffix, '');

              const floatValue: number | undefined = Number.isNaN(
                Number(newFormattedValue.replace(',', '.'))
              )
                ? undefined
                : Number(newFormattedValue.replace(',', '.'));

              onInput({ value: newValue, floatValue, formattedValue: newFormattedValue, ...e });
            }}
            // Native
            disabled={disabled}
            placeholder={placeholder ?? defaultNumberPlaceholder}
            value={formattedValue}
            autoComplete="off"
            autoCorrect="off"
            data-1p-ignore // prevent 1Password fill
            data-hj-allow
            {...otherProps}
          />
        )}
      </$InputContainer>
    );
  }
);
const $InputContainer = styled.div`
  width: 100%;
  min-height: 100%;
  height: 100%;
  overflow: hidden;

  background-color: inherit;
  border-radius: inherit;

  input {
    flex: 1;
    width: 100%;
  }
`;

const InputStyle = css`
  font: var(--font-base-book);
  outline: none;
  border: none;
  background-color: var(--input-backgroundColor);
  color: var(--color-text-2);
  min-width: 0;
  height: 100%;

  ::placeholder {
    color: var(--color-text-0);
    opacity: 1;
  }

  // Input autofill Styles
  &:-webkit-autofill,
  &:-webkit-autofill:focus {
    transition:
      background-color 600000s 0s,
      color 600000s 0s;
  }

  &[data-autocompleted] {
    background-color: var(--input-backgroundColor) !important;
  }
`;

const $NumericFormat = styled(NumericFormat)<{ $backgroundColorOverride?: string }>`
  ${InputStyle}
  font-feature-settings: var(--fontFeature-monoNumbers);
  ${({ $backgroundColorOverride }) =>
    $backgroundColorOverride &&
    css`
      background-color: ${$backgroundColorOverride};
    `}
`;

const $Input = styled.input<{ $backgroundColorOverride?: string }>`
  ${InputStyle}
  ${({ $backgroundColorOverride }) =>
    $backgroundColorOverride &&
    css`
      background-color: ${$backgroundColorOverride};
    `}
`;
