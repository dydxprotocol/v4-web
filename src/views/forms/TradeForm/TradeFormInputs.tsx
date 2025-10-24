import { Ref, useEffect, useState } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { NumberFormatValues, SourceInfo } from 'react-number-format';

import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';
import { InputErrorData, TradeBoxKeys } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';
import { getTradeFormSummary, getTradeFormValues } from '@/state/tradeFormSelectors';

import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import { LimitPriceInput } from './LimitPriceInput';

type TradeBoxInputConfig = {
  key: TradeBoxKeys;
  inputType: InputType;
  label: React.ReactNode;
  onChange: (values: NumberFormatValues, e: SourceInfo) => void;
  onInput?: () => void;
  ref?: Ref<HTMLInputElement>;
  validationConfig?: InputErrorData;
  value: string | number;
  decimals?: number;
  slotRight?: React.ReactNode;
};

export const TradeFormInputs = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const tradeSummary = useAppSelector(getTradeFormSummary).summary;
  const { showLimitPrice, showTriggerPrice } = tradeSummary.options;
  const tradeFormValues = useAppSelector(getTradeFormValues);
  const { triggerPrice, marketId, type } = tradeFormValues;

  // For TWAP orders, limit price is shown in AdvancedTradeOptions instead
  const isTwapOrder = type === 'TWAP';
  const { tickSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const midMarketPrice = useAppSelector(BonsaiHelpers.currentMarket.midPrice.data)?.toNumber();
  const [hasSetMidMarketLimit, setHasSetMidMarketLimit] = useState(false);

  useEffect(() => {
    setHasSetMidMarketLimit(false);
  }, [marketId, type]);

  useEffect(() => {
    // when limit price input is empty and mid price is available, set limit price input to mid price
    if (!midMarketPrice || !showLimitPrice || hasSetMidMarketLimit) {
      return;
    }
    dispatch(
      tradeFormActions.setLimitPrice(
        MustBigNumber(midMarketPrice).toFixed(tickSizeDecimals ?? USD_DECIMALS)
      )
    );
    setHasSetMidMarketLimit(true);
  }, [dispatch, midMarketPrice, showLimitPrice, tickSizeDecimals, marketId, hasSetMidMarketLimit]);

  const tradeFormInputs: TradeBoxInputConfig[] = [];
  if (showTriggerPrice) {
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
        dispatch(tradeFormActions.setTriggerPrice(value));
      },
      value: triggerPrice ?? '',
      decimals: tickSizeDecimals ?? USD_DECIMALS,
    });
  }

  return (
    <>
      {tradeFormInputs.map(
        ({
          key,
          inputType,
          label,
          onChange,
          onInput,
          validationConfig,
          value,
          decimals,
          slotRight,
        }) => (
          <FormInput
            key={key}
            id={key}
            type={inputType}
            label={label}
            onChange={onChange}
            onInput={onInput}
            validationConfig={validationConfig}
            value={value}
            decimals={decimals}
            slotRight={slotRight}
          />
        )
      )}
      {showLimitPrice && !isTwapOrder && <LimitPriceInput />}
    </>
  );
};
