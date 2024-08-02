import { useEffect, useState } from 'react';

import { shallowEqual } from 'react-redux';
import styled from 'styled-components';
import tw from 'twin.macro';

import {
  Nullable,
  TriggerOrdersInputPrice,
  type TriggerOrdersInputFields,
} from '@/constants/abacus';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, PERCENT_DECIMALS, USD_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';

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

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setTriggerFormInputs } from '@/state/inputs';
import { getTriggerFormInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { assertNever } from '@/lib/assertNever';
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
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const triggerFormInputValues = useAppSelector(getTriggerFormInputs, shallowEqual);
  const formTriggerPrice = triggerFormInputValues[inputOrderFields.triggerPriceField.rawValue];
  const formPercentDiff = triggerFormInputValues[inputOrderFields.percentDiffField.rawValue];
  const formUsdcDiff = triggerFormInputValues[inputOrderFields.usdcDiffField.rawValue];

  const [inputType, setInputType] = useState<InputChangeType>(InputType.Percent);

  // Update State variables if their inputs are not being source of calculations
  // Or if they have been reset to null
  useEffect(() => {
    const { input, triggerPrice, percentDiff, usdcDiff } = price ?? {};
    if (input !== inputOrderFields.triggerPriceField.rawValue || triggerPrice === null) {
      dispatch(
        setTriggerFormInputs({
          [inputOrderFields.triggerPriceField.rawValue]: triggerPrice
            ? MustBigNumber(triggerPrice).toFixed(tickSizeDecimals ?? USD_DECIMALS)
            : '',
        })
      );
    }
    if (input !== inputOrderFields.percentDiffField.rawValue || percentDiff === null) {
      dispatch(
        setTriggerFormInputs({
          [inputOrderFields.percentDiffField.rawValue]: percentDiff
            ? MustBigNumber(percentDiff).toFixed(PERCENT_DECIMALS)
            : '',
        })
      );
    }
    if (input !== inputOrderFields.usdcDiffField.rawValue || usdcDiff === null) {
      dispatch(
        setTriggerFormInputs({
          [inputOrderFields.usdcDiffField.rawValue]: usdcDiff
            ? MustBigNumber(usdcDiff).toFixed(tickSizeDecimals ?? USD_DECIMALS)
            : '',
        })
      );
    }
  }, [dispatch, tickSizeDecimals, price, inputOrderFields]);

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
    dispatch(
      setTriggerFormInputs({ [inputOrderFields.triggerPriceField.rawValue]: formattedValue })
    );

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
    dispatch(
      setTriggerFormInputs({
        [inputOrderFields.percentDiffField.rawValue]: formattedValue,
      })
    );

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
    dispatch(
      setTriggerFormInputs({
        [inputOrderFields.usdcDiffField.rawValue]: formattedValue,
      })
    );

    const newAmount = MustBigNumber(floatValue).toFixed(tickSizeDecimals ?? USD_DECIMALS);
    abacusStateManager.setTriggerOrdersValue({
      value: formattedValue === '' || newAmount === 'NaN' ? null : newAmount,
      field: inputOrderFields.usdcDiffField,
    });
  };

  const getDecimalsForInputType = (inType: InputChangeType) => {
    switch (inType) {
      case InputType.Currency:
        return USD_DECIMALS;
      case InputType.Percent:
        return PERCENT_DECIMALS;
      default:
        assertNever(inType);
        return USD_DECIMALS;
    }
  };

  const signedOutput = () => {
    const formattedPercentDiff = formPercentDiff
      ? MustBigNumber(formPercentDiff).div(100).toNumber()
      : null;
    const formattedUsdcDiff = formUsdcDiff ? MustBigNumber(formUsdcDiff).toNumber() : null;

    const outputType = inputType === InputType.Percent ? OutputType.Fiat : OutputType.Percent;
    const value = outputType === OutputType.Fiat ? formattedUsdcDiff : formattedPercentDiff;
    const outputValue = value && isNegativeDiff ? MustBigNumber(value).toNumber() * -1 : value;

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
      <Button action={ButtonAction.Navigation} onClick={onViewOrdersClick} tw="text-color-accent">
        {stringGetter({ key: STRING_KEYS.VIEW_ORDERS })}
        <Icon iconName={IconName.Arrow} tw="stroke-2" />
      </Button>
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
        <div tw="row gap-[0.5em] text-color-text-0 font-base-book">
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
        </div>
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
          value={formTriggerPrice}
          onInput={onTriggerPriceInput}
          allowNegative
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
          value={inputType === InputType.Percent ? formPercentDiff : formUsdcDiff}
          onInput={inputType === InputType.Percent ? onPercentageDiffInput : onUsdcDiffInput}
          allowNegative
        />
      </$InlineRow>
    </$TriggerRow>
  );
};
const $Heading = tw.div`spacedRow`;
const $SignedOutput = styled(Output)<{ sign: NumberSign }>`
  color: ${({ sign }) =>
    ({
      [NumberSign.Positive]: `var(--color-positive)`,
      [NumberSign.Negative]: `var(--color-negative)`,
      [NumberSign.Neutral]: `var(--color-text-2)`,
    })[sign]};
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

const $TriggerRow = tw.div`column gap-[1ch]`;

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
