import { useState } from 'react';

import { NumberFormatValues } from 'react-number-format';
import styled, { AnyStyledComponent } from 'styled-components';

import {
  type TriggerOrdersInputPrice,
  type TriggerOrdersTriggerOrder,
  Nullable,
  type SubaccountOrder,
  TriggerOrdersInputs,
  TriggerOrdersInputField,
} from '@/constants/abacus';
import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { PERCENT_DECIMALS, USD_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { DropdownSelectMenu } from '@/components/DropdownSelectMenu';
import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { MustBigNumber } from '@/lib/numbers';

type InputChangeType = InputType.Currency | InputType.Percent;

type ElementProps = {
  symbol: string;
  tooltipId: string;
  stringKeys: {
    header: string;
    price: string;
    output: string;
  };
  tickSizeDecimals?: number;
  onViewOrdersClick: () => void;

  onTriggerPriceChange: (value: string | null) => void;
  onPercentDiffChange: (value: string | null) => void;
  onUsdcDiffChange: (value: string | null) => void;

  isMultiple: boolean;
  price?: Nullable<TriggerOrdersInputPrice>;
};

export const TriggerOrderInputs = ({
  symbol,
  tooltipId,
  stringKeys,
  tickSizeDecimals,
  onViewOrdersClick,
  onTriggerPriceChange,
  onPercentDiffChange,
  onUsdcDiffChange,
  isMultiple,
  price,
}: ElementProps) => {
  const stringGetter = useStringGetter();

  const { triggerPrice, percentDiff, usdcDiff, input } = price ?? {};

  const formattedPercentDiff = percentDiff ? MustBigNumber(percentDiff).times(100) : null;

  const [inputType, setInputType] = useState<InputChangeType>(InputType.Percent);

  const onTriggerPriceInput = ({
    floatValue,
    formattedValue,
  }: {
    floatValue?: number;
    formattedValue: string;
  }) => {
    const newAmount = MustBigNumber(floatValue).toFixed(tickSizeDecimals ?? USD_DECIMALS); //xcxc
    onTriggerPriceChange(formattedValue === '' || newAmount === 'NaN' ? null : newAmount);
  };

  const onPercentageInput = ({
    floatValue,
    formattedValue,
  }: {
    floatValue?: number;
    formattedValue: string;
  }) => {
    const newAmount = MustBigNumber(floatValue).div(100).toFixed(PERCENT_DECIMALS);
    onPercentDiffChange(formattedValue === '' || newAmount === 'NaN' ? null : newAmount);
  };

  const onUsdcInput = ({
    floatValue,
    formattedValue,
  }: {
    floatValue?: number;
    formattedValue: string;
  }) => {
    const newAmount = MustBigNumber(floatValue).toFixed(tickSizeDecimals ?? USD_DECIMALS);
    onUsdcDiffChange(formattedValue === '' || newAmount === 'NaN' ? null : newAmount);
  };

  const getDecimalsForInputType = (inputType: InputChangeType) => {
    switch (inputType) {
      case InputType.Currency:
        return USD_DECIMALS;
      case InputType.Percent:
        return PERCENT_DECIMALS;
    }
  };

  const priceDiffSelector = ({
    value,
    onValueChange,
  }: {
    value: InputChangeType;
    onValueChange: (value: InputChangeType) => void;
  }) => (
    <DropdownSelectMenu
      value={value}
      items={[
        {
          value: InputType.Percent,
          label: '%',
        },
        {
          value: InputType.Currency,
          label: '$',
        },
      ]}
      onValueChange={onValueChange}
    />
  );

  const multipleOrdersButton = () => (
    <Styled.MultipleOrdersContainer>
      {stringGetter({ key: STRING_KEYS.MULTIPLE_ORDERS_FOUND })}
      <Styled.ViewAllButton action={ButtonAction.Navigation} onClick={onViewOrdersClick}>
        {stringGetter({ key: STRING_KEYS.VIEW_ORDERS })}
        {<Styled.ArrowIcon iconName={IconName.Arrow} />}
      </Styled.ViewAllButton>
    </Styled.MultipleOrdersContainer>
  );

  // xcxc to update here we need to make a hook to call into the input values, and listen. Look at useTradeFormInputs

  return (
    <Styled.TriggerRow key={tooltipId}>
      <WithTooltip tooltip={tooltipId}>
        <h3>{stringGetter({ key: stringKeys.header })}</h3>
      </WithTooltip>
      <Styled.InlineRow>
        {isMultiple ? (
          multipleOrdersButton()
        ) : (
          <>
            {/* TODO: CT-625 Update with values from abacus */}
            <FormInput
              id={`${tooltipId}-price`}
              label={
                <>
                  {stringGetter({ key: stringKeys.price })} {<Tag>{symbol}</Tag>}
                </>
              }
              type={InputType.Currency}
              decimals={tickSizeDecimals}
              value={triggerPrice ?? null}
              onInput={onTriggerPriceInput}
            />
            <FormInput
              id={`${tooltipId}-priceDiff`}
              label={stringGetter({ key: stringKeys.output })}
              decimals={getDecimalsForInputType(inputType)}
              type={inputType}
              value={inputType === InputType.Percent ? formattedPercentDiff : usdcDiff}
              onInput={inputType === InputType.Percent ? onPercentageInput : onUsdcInput}
              // onChange={({ floatValue }: NumberFormatValues) => onPercentDiffChange(floatValue)}

              // onChange={inputType === InputType.Percent ? ({ floatValue }: NumberFormatValues) => onPercentDiffChange(floatValue) : ({ floatValue }: NumberFormatValues) => onUsdcDiffChange(floatValue)}
              slotRight={priceDiffSelector({
                value: inputType,
                onValueChange: (value: InputChangeType) => setInputType(value),
              })}
            />
          </>
        )}
      </Styled.InlineRow>
    </Styled.TriggerRow>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.TriggerRow = styled.div`
  ${layoutMixins.column}
  gap: 1ch;
`;

Styled.InlineRow = styled.span`
  ${layoutMixins.flexEqualColumns}
  gap: 1ch;
`;

Styled.MultipleOrdersContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25em 0.625em;

  border: var(--default-border-width) solid var(--color-border);
  border-radius: 0.5em;

  color: var(--color-text-2);
`;

Styled.ViewAllButton = styled(Button)`
  color: var(--color-accent);
`;

Styled.ArrowIcon = styled(Icon)`
  stroke-width: 2;
`;
