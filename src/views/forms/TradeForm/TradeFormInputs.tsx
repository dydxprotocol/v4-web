import { Ref, useEffect, useState } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { NumberFormatValues, SourceInfo } from 'react-number-format';
import styled from 'styled-components';

import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';
import { InputErrorData, TradeBoxKeys } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';

import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';
import { getTradeFormSummary, getTradeFormValues } from '@/state/tradeFormSelectors';

import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

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
  const { limitPrice, triggerPrice, marketId, type } = tradeFormValues;
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

  const onMidMarketPriceClick = () => {
    if (!midMarketPrice) return;
    dispatch(
      tradeFormActions.setLimitPrice(
        MustBigNumber(midMarketPrice).toFixed(tickSizeDecimals ?? USD_DECIMALS)
      )
    );
  };

  const midMarketPriceButton = (
    <$MidPriceButton onClick={onMidMarketPriceClick} size={ButtonSize.XSmall}>
      {stringGetter({ key: STRING_KEYS.MID_MARKET_PRICE_SHORT })}
    </$MidPriceButton>
  );

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

  if (showLimitPrice) {
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
        dispatch(tradeFormActions.setLimitPrice(value));
      },
      value: limitPrice ?? '',
      decimals: tickSizeDecimals ?? USD_DECIMALS,
      slotRight: midMarketPrice ? midMarketPriceButton : undefined,
    });
  }

  return tradeFormInputs.map(
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
  );
};

const $MidPriceButton = styled(Button)`
  ${formMixins.inputInnerButton}
`;
