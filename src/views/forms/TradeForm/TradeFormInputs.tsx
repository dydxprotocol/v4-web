import { Ref } from 'react';

import { NumberFormatValues, SourceInfo } from 'react-number-format';
import { shallowEqual } from 'react-redux';

import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';
import { InputErrorData, TradeBoxKeys } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setTradeFormInputs } from '@/state/inputs';
import { getTradeFormInputs, useTradeFormData } from '@/state/inputsSelectors';
import { getCurrentMarketConfig } from '@/state/perpetualsSelectors';

type TradeBoxInputConfig = {
  key: TradeBoxKeys;
  inputType: InputType;
  label: React.ReactNode;
  onChange: (values: NumberFormatValues, e: SourceInfo) => void;
  ref?: Ref<HTMLInputElement>;
  validationConfig?: InputErrorData;
  value: string | number;
  decimals?: number;
};

export const TradeFormInputs = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const { needsLimitPrice, needsTrailingPercent, needsTriggerPrice } = useTradeFormData();
  const tradeFormInputValues = useAppSelector(getTradeFormInputs, shallowEqual);
  const { limitPriceInput, triggerPriceInput, trailingPercentInput } = tradeFormInputValues;
  const { tickSizeDecimals } = useAppSelector(getCurrentMarketConfig, shallowEqual) ?? {};

  const tradeFormInputs: TradeBoxInputConfig[] = [];
  if (needsTriggerPrice) {
    tradeFormInputs.push({
      key: TradeBoxKeys.TriggerPrice,
      inputType: InputType.Currency,
      label: (
        <>
          <WithTooltip tooltip="trigger-price" side="right">
            {stringGetter({ key: STRING_KEYS.TRIGGER_PRICE })}
          </WithTooltip>
          <Tag>USD</Tag>
        </>
      ),
      onChange: ({ value }: NumberFormatValues) => {
        dispatch(setTradeFormInputs({ triggerPriceInput: value }));
      },
      value: triggerPriceInput ?? '',
      decimals: tickSizeDecimals ?? USD_DECIMALS,
    });
  }

  if (needsLimitPrice) {
    tradeFormInputs.push({
      key: TradeBoxKeys.LimitPrice,
      inputType: InputType.Currency,
      label: (
        <>
          <WithTooltip tooltip="limit-price" side="right">
            {stringGetter({ key: STRING_KEYS.LIMIT_PRICE })}
          </WithTooltip>
          <Tag>USD</Tag>
        </>
      ),
      onChange: ({ value }: NumberFormatValues) => {
        dispatch(setTradeFormInputs({ limitPriceInput: value }));
      },
      value: limitPriceInput,
      decimals: tickSizeDecimals ?? USD_DECIMALS,
    });
  }

  if (needsTrailingPercent) {
    tradeFormInputs.push({
      key: TradeBoxKeys.TrailingPercent,
      inputType: InputType.Percent,
      label: (
        <WithTooltip tooltip="trailing-percent" side="right">
          {stringGetter({ key: STRING_KEYS.TRAILING_PERCENT })}
        </WithTooltip>
      ),
      onChange: ({ value }: NumberFormatValues) => {
        dispatch(setTradeFormInputs({ trailingPercentInput: value }));
      },
      value: trailingPercentInput ?? '',
    });
  }

  return tradeFormInputs.map(
    ({ key, inputType, label, onChange, validationConfig, value, decimals }) => (
      <FormInput
        key={key}
        id={key}
        type={inputType}
        label={label}
        onChange={onChange}
        validationConfig={validationConfig}
        value={value}
        decimals={decimals}
      />
    )
  );
};
