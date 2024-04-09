import { useState } from 'react';

import styled, { AnyStyledComponent } from 'styled-components';

import {
  TriggerOrdersInputPrice,
  type TriggerOrdersInputFields,
  Nullable,
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

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

type InputChangeType = InputType.Currency | InputType.Percent;

type InputOrderFields = {
  triggerPriceField: TriggerOrdersInputFields;
  percentDiffField: TriggerOrdersInputFields;
  usdcDiffField: TriggerOrdersInputFields;
};

type ElementProps = {
  symbol: string;
  tooltipId: string;
  stringKeys: {
    header: string;
    price: string;
    output: string;
  };
  inputOrderFields: InputOrderFields;
  isMultiple: boolean;
  price: Nullable<TriggerOrdersInputPrice>;
  tickSizeDecimals?: number;
  onViewOrdersClick: () => void;
};

export const TriggerOrderInputs = ({
  symbol,
  tooltipId,
  stringKeys,
  inputOrderFields,
  isMultiple,
  price,
  tickSizeDecimals,
  onViewOrdersClick,
}: ElementProps) => {
  const stringGetter = useStringGetter();

  const [inputType, setInputType] = useState<InputChangeType>(InputType.Percent);

  const { triggerPrice, percentDiff, usdcDiff } = price ?? {};

  const onTriggerPriceInput = ({
    floatValue,
    formattedValue,
  }: {
    floatValue?: number;
    formattedValue: string;
  }) => {
    const newPrice = MustBigNumber(floatValue).toFixed(tickSizeDecimals ?? USD_DECIMALS);
    abacusStateManager.setTriggerOrdersValue({
      value: formattedValue === '' || newPrice === 'NaN' ? null : newPrice,
      field: inputOrderFields.triggerPriceField,
    });
  };

  const onPercentageDiffInput = ({
    floatValue,
    formattedValue,
  }: {
    floatValue?: number;
    formattedValue: string;
  }) => {
    const newPercentage = MustBigNumber(floatValue).div(100).toFixed(PERCENT_DECIMALS);
    abacusStateManager.setTriggerOrdersValue({
      value: formattedValue === '' || newPercentage === 'NaN' ? null : newPercentage,
      field: inputOrderFields.percentDiffField,
    });
  };

  const onUsdcDiffInput = ({
    floatValue,
    formattedValue,
  }: {
    floatValue?: number;
    formattedValue: string;
  }) => {
    const newAmount = MustBigNumber(floatValue).toFixed(tickSizeDecimals ?? USD_DECIMALS);
    abacusStateManager.setTriggerOrdersValue({
      value: formattedValue === '' || newAmount === 'NaN' ? null : newAmount,
      field: inputOrderFields.usdcDiffField,
    });
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
            <FormInput
              id={`${tooltipId}-price`}
              label={
                <>
                  {stringGetter({ key: stringKeys.price })} {<Tag>{symbol}</Tag>}
                </>
              }
              type={InputType.Currency}
              decimals={tickSizeDecimals}
              value={triggerPrice}
              onInput={onTriggerPriceInput}
              allowNegative={true}
            />
            <FormInput
              id={`${tooltipId}-priceDiff`}
              label={stringGetter({ key: stringKeys.output })}
              decimals={getDecimalsForInputType(inputType)}
              type={inputType}
              slotRight={priceDiffSelector({
                value: inputType,
                onValueChange: (value: InputChangeType) => setInputType(value),
              })}
              value={
                inputType === InputType.Percent
                  ? percentDiff
                    ? MustBigNumber(percentDiff).times(100).toFixed(PERCENT_DECIMALS)
                    : null
                  : usdcDiff
              }
              onInput={inputType === InputType.Percent ? onPercentageDiffInput : onUsdcDiffInput}
              allowNegative={true}
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
