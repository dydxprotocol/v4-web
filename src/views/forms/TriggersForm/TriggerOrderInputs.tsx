import { useState } from 'react';

import styled, { AnyStyledComponent } from 'styled-components';

import {
  Nullable,
  TriggerOrdersInputPrice,
  type TriggerOrdersInputFields,
} from '@/constants/abacus';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, PERCENT_DECIMALS, USD_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { DropdownSelectMenu } from '@/components/DropdownSelectMenu';
import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { VerticalSeparator } from '@/components/Separator';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber, getNumberSign } from '@/lib/numbers';

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
    headerDiff: string;
    price: string;
    output: string;
  };
  inputOrderFields: InputOrderFields;
  isMultiple: boolean;
  isNegativeDiff: boolean;
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
  isNegativeDiff,
  price,
  tickSizeDecimals,
  onViewOrdersClick,
}: ElementProps) => {
  const stringGetter = useStringGetter();

  const [inputType, setInputType] = useState<InputChangeType>(InputType.Percent);

  const { triggerPrice, percentDiff, usdcDiff } = price ?? {};

  const clearPriceInputFields = () => {
    abacusStateManager.setTriggerOrdersValue({
      value: null,
      field: inputOrderFields.triggerPriceField,
    });
    abacusStateManager.setTriggerOrdersValue({
      value: null,
      field: inputOrderFields.percentDiffField,
    });
    abacusStateManager.setTriggerOrdersValue({
      value: null,
      field: inputOrderFields.usdcDiffField,
    });
  };

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
    const newPercentage = MustBigNumber(floatValue).toFixed(PERCENT_DECIMALS);
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

  const getOutputDiffData = () => {
    const formattedPercentDiff = percentDiff
      ? MustBigNumber(percentDiff).div(100).toNumber()
      : null;

    const outputType = inputType === InputType.Percent ? OutputType.Fiat : OutputType.Percent;
    const value = outputType === OutputType.Fiat ? usdcDiff : formattedPercentDiff;

    return {
      outputType,
      outputValue: value && isNegativeDiff ? value * -1 : value,
    };
  };

  const signedOutput = () => {
    const { outputType, outputValue } = getOutputDiffData();
    return (
      <$SignedOutput
        sign={getNumberSign(outputValue)}
        showSign={ShowSign.Both}
        type={outputType}
        value={outputValue}
      />
    );
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
    <$MultipleOrdersContainer>
      {stringGetter({ key: STRING_KEYS.MULTIPLE_ORDERS_FOUND })}
      <$ViewAllButton action={ButtonAction.Navigation} onClick={onViewOrdersClick}>
        {stringGetter({ key: STRING_KEYS.VIEW_ORDERS })}
        {<$ArrowIcon iconName={IconName.Arrow} />}
      </$ViewAllButton>
    </$MultipleOrdersContainer>
  );

  const headerTooltip = () => (
    <WithTooltip tooltip={tooltipId}>{stringGetter({ key: stringKeys.header })}</WithTooltip>
  );

  return isMultiple ? (
    <$TriggerRow key={tooltipId}>
      <$Heading>{headerTooltip()}</$Heading>
      <$InlineRow>{multipleOrdersButton()}</$InlineRow>
    </$TriggerRow>
  ) : (
    <$TriggerRow key={tooltipId}>
      <$Heading>
        {headerTooltip()}
        <$HeadingInfo>
          {stringGetter({ key: stringKeys.headerDiff })}
          {signedOutput()}
          <$VerticalSeparator />
          <$ClearButton
            action={ButtonAction.Destroy}
            size={ButtonSize.Base}
            type={ButtonType.Button}
            onClick={clearPriceInputFields}
          >
            {stringGetter({ key: STRING_KEYS.CLEAR })}
          </$ClearButton>
        </$HeadingInfo>
      </$Heading>
      <$InlineRow>
        <FormInput
          id={`${tooltipId}-price`}
          label={
            <>
              {stringGetter({ key: stringKeys.price })} <Tag>{symbol}</Tag>
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
                ? MustBigNumber(percentDiff).toFixed(PERCENT_DECIMALS)
                : null
              : usdcDiff
          }
          onInput={inputType === InputType.Percent ? onPercentageDiffInput : onUsdcDiffInput}
          allowNegative={true}
        />
      </$InlineRow>
    </$TriggerRow>
  );
};
const $Heading = styled.div`
  ${layoutMixins.spacedRow}
`;

const $HeadingInfo = styled.div`
  ${layoutMixins.row}
  font: var(--font-base-book);
  gap: 0.5em;
  color: var(--color-text-0);
`;

const $SignedOutput = styled(Output)<{ sign: NumberSign }>`
  color: ${({ sign }) =>
    ({
      [NumberSign.Positive]: `var(--color-positive)`,
      [NumberSign.Negative]: `var(--color-negative)`,
      [NumberSign.Neutral]: `var(--color-text-2)`,
    }[sign])};
`;

const $VerticalSeparator = styled(VerticalSeparator)`
  && {
    height: 1.5rem;
  }
`;

const $ClearButton = styled(Button)`
  --button-backgroundColor: transparent;
  --button-border: none;
  --button-height: 1.5rem;
  --button-textColor: var(--color-red);
  --button-padding: 0;
`;

const $TriggerRow = styled.div`
  ${layoutMixins.column}
  gap: 1ch;
`;

const $InlineRow = styled.span`
  ${layoutMixins.flexEqualColumns}
  gap: 1ch;
`;

const $MultipleOrdersContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25em 0.625em;

  border: var(--default-border-width) solid var(--color-border);
  border-radius: 0.5em;

  color: var(--color-text-2);
`;

const $ViewAllButton = styled(Button)`
  color: var(--color-accent);
`;

const $ArrowIcon = styled(Icon)`
  stroke-width: 2;
`;
