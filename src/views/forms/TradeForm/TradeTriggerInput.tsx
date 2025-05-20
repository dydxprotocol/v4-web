import {
  TriggerOrderDetails,
  TriggerOrderState,
  TriggerPriceInputType,
} from '@/bonsai/forms/triggers/types';
import styled from 'styled-components';

import { PERCENT_DECIMALS, USD_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { DropdownSelectMenu } from '@/components/DropdownSelectMenu';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';

import { useAppDispatch } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';

import { assertNever } from '@/lib/assertNever';
import { AttemptBigNumber } from '@/lib/numbers';

type InputChangeType = InputType.Currency | InputType.Percent;

type ElementProps = {
  stringKeys: {
    header: string;
    headerDiff: string;
    price: string;
    output: string;
  };
  inputState: TriggerOrderState;
  summaryState: TriggerOrderDetails;
  isStopLoss: boolean;
  tickSizeDecimals?: number;
};

export const TradeTriggerOrderInputs = ({
  stringKeys,
  inputState,
  summaryState,
  isStopLoss,
  tickSizeDecimals,
}: ElementProps) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const onTriggerPriceInput = ({
    formattedValue,
  }: {
    floatValue?: number;
    formattedValue: string;
  }) => {
    dispatch(
      isStopLoss
        ? tradeFormActions.setStopLossTriggerPrice(formattedValue)
        : tradeFormActions.setTakeProfitTriggerPrice(formattedValue)
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
        ? tradeFormActions.setStopLossPercentDiff(formattedValue)
        : tradeFormActions.setTakeProfitPercentDiff(formattedValue)
    );
  };

  const onUsdcDiffInput = ({ formattedValue }: { floatValue?: number; formattedValue: string }) => {
    dispatch(
      isStopLoss
        ? tradeFormActions.setStopLossUsdcDiff(formattedValue)
        : tradeFormActions.setTakeProfitUsdcDiff(formattedValue)
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

  const priceDiffSelector = ({
    value,
    onValueChange,
  }: {
    value: InputChangeType;
    onValueChange: (value: InputChangeType) => void;
  }) => (
    <DropdownSelectMenu
      tw="[--trigger-padding:0.25rem 0.5rem] [--trigger-backgroundColor:var(--color-layer-6)] [--trigger-textColor:--color-text-1]"
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

  const key = isStopLoss ? 'stoploss' : 'takeprofit';

  return (
    <$InlineRow key={key}>
      <FormInput
        id={`${key}-price`}
        tw="[--form-input-paddingX:0.4rem]"
        label={stringGetter({ key: stringKeys.price })}
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
        id={`${key}-priceDiff`}
        tw="[--form-input-paddingX:0.4rem]"
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
  );
};

const $InlineRow = styled.span`
  ${layoutMixins.flexEqualColumns}
  gap: 1ch;
`;
