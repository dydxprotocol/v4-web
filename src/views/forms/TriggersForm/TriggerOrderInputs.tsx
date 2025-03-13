import {
  TriggerOrderDetails,
  TriggerOrderState,
  TriggerPriceInputType,
} from '@/bonsai/forms/triggers/types';
import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, PERCENT_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { TooltipStringKeys } from '@/constants/tooltips';

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

import { useAppDispatch } from '@/state/appTypes';
import { triggersFormActions } from '@/state/triggersForm';

import { assertNever } from '@/lib/assertNever';
import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { AttemptBigNumber, AttemptNumber, MustBigNumber, getNumberSign } from '@/lib/numbers';

type InputChangeType = InputType.Currency | InputType.Percent;

type ElementProps = {
  symbol: string;
  tooltipId: TooltipStringKeys;
  stringKeys: {
    header: string;
    headerDiff: string;
    price: string;
    output: string;
  };
  inputState: TriggerOrderState;
  summaryState: TriggerOrderDetails;
  isStopLoss: boolean;
  isMultiple: boolean;
  isNegativeDiff: boolean;
  tickSizeDecimals?: number;
  onViewOrdersClick: () => void;
};

export const TriggerOrderInputs = ({
  symbol,
  tooltipId,
  stringKeys,
  isMultiple,
  inputState,
  summaryState,
  isNegativeDiff,
  isStopLoss,
  tickSizeDecimals,
  onViewOrdersClick,
}: ElementProps) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const clearPriceInputFields = () => {
    dispatch(
      isStopLoss
        ? triggersFormActions.clearStopLossPriceInput()
        : triggersFormActions.clearTakeProfitPriceInput()
    );
  };

  const onTriggerPriceInput = ({
    formattedValue,
  }: {
    floatValue?: number;
    formattedValue: string;
  }) => {
    dispatch(
      isStopLoss
        ? triggersFormActions.setStopLossTriggerPrice(formattedValue)
        : triggersFormActions.setTakeProfitTriggerPrice(formattedValue)
    );
  };

  const onPercentageDiffInput = ({
    formattedValue,
  }: {
    floatValue?: number;
    formattedValue: string;
  }) => {
    dispatch(
      isStopLoss
        ? triggersFormActions.setStopLossPercentDiff(formattedValue)
        : triggersFormActions.setTakeProfitPercentDiff(formattedValue)
    );
  };

  const onUsdcDiffInput = ({ formattedValue }: { floatValue?: number; formattedValue: string }) => {
    dispatch(
      isStopLoss
        ? triggersFormActions.setStopLossUsdcDiff(formattedValue)
        : triggersFormActions.setTakeProfitUsdcDiff(formattedValue)
    );
  };

  const inputTypeToUse =
    inputState.priceInput?.type === TriggerPriceInputType.PercentDiff
      ? InputType.Percent
      : inputState.priceInput?.type === TriggerPriceInputType.UsdcDiff
        ? InputType.Currency
        : InputType.Percent;

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
    const formattedPercentDiff = AttemptNumber(summaryState.percentDiff);
    const formattedUsdcDiff = AttemptNumber(summaryState.usdcDiff);
    const outputType = inputTypeToUse === InputType.Percent ? OutputType.Fiat : OutputType.Percent;
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
              {stringGetter({ key: stringKeys.price })}{' '}
              <Tag>{getDisplayableAssetFromBaseAsset(symbol)}</Tag>
            </>
          }
          type={InputType.Currency}
          decimals={tickSizeDecimals}
          value={
            inputState.priceInput?.type === TriggerPriceInputType.TriggerPrice
              ? inputState.priceInput.triggerPrice
              : summaryState.triggerPrice
          }
          onInput={onTriggerPriceInput}
          allowNegative
        />
        <FormInput
          id={`${tooltipId}-priceDiff`}
          label={stringGetter({ key: stringKeys.output })}
          decimals={getDecimalsForInputType(inputTypeToUse)}
          type={inputTypeToUse}
          slotRight={priceDiffSelector({
            value: inputTypeToUse,
            onValueChange: (value: InputChangeType) =>
              value === InputType.Percent
                ? onPercentageDiffInput({
                    formattedValue:
                      AttemptBigNumber(summaryState.percentDiff)
                        ?.times(100)
                        .integerValue()
                        .toString() ?? '',
                  })
                : onUsdcDiffInput({ formattedValue: summaryState.usdcDiff ?? '' }),
          })}
          value={
            inputState.priceInput?.type === TriggerPriceInputType.PercentDiff
              ? inputState.priceInput.percentDiff
              : inputState.priceInput?.type === TriggerPriceInputType.UsdcDiff
                ? inputState.priceInput.usdcDiff
                : inputTypeToUse === InputType.Percent
                  ? AttemptBigNumber(summaryState.percentDiff)?.times(100).toString(10)
                  : summaryState.usdcDiff
          }
          onInput={inputTypeToUse === InputType.Percent ? onPercentageDiffInput : onUsdcDiffInput}
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
