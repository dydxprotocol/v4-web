import { Ref, useEffect, useState } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { NumberFormatValues, SourceInfo } from 'react-number-format';
import styled from 'styled-components';

import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { INTEGER_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { InputErrorData, MAX_SCALE_ORDERS, TradeBoxKeys } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

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
  /** When set, consecutive inputs sharing the same group are rendered in an inline row. */
  group?: string;
};

export const TradeFormInputs = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const tradeSummary = useAppSelector(getTradeFormSummary).summary;
  const {
    showLimitPrice,
    showTriggerPrice,
    showScaleStartPrice,
    showScaleEndPrice,
    showScaleTotalOrders,
    showScaleSkew,
  } = tradeSummary.options;
  const tradeFormValues = useAppSelector(getTradeFormValues);
  const {
    limitPrice,
    triggerPrice,
    scaleStartPrice,
    scaleEndPrice,
    scaleTotalOrders,
    scaleSkew,
    marketId,
    type,
  } = tradeFormValues;
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

  if (showScaleStartPrice) {
    tradeFormInputs.push({
      key: TradeBoxKeys.ScaleStartPrice,
      inputType: InputType.Currency,
      label: (
        <>
          Start
          <Tag>USD</Tag>
        </>
      ),
      onChange: ({ value }: NumberFormatValues) => {
        dispatch(tradeFormActions.setScaleStartPrice(value));
      },
      value: scaleStartPrice ?? '',
      decimals: tickSizeDecimals ?? USD_DECIMALS,
      group: 'scale-price',
    });
  }

  if (showScaleEndPrice) {
    tradeFormInputs.push({
      key: TradeBoxKeys.ScaleEndPrice,
      inputType: InputType.Currency,
      label: (
        <>
          End
          <Tag>USD</Tag>
        </>
      ),
      onChange: ({ value }: NumberFormatValues) => {
        dispatch(tradeFormActions.setScaleEndPrice(value));
      },
      value: scaleEndPrice ?? '',
      decimals: tickSizeDecimals ?? USD_DECIMALS,
      group: 'scale-price',
    });
  }

  if (showScaleTotalOrders) {
    tradeFormInputs.push({
      key: TradeBoxKeys.ScaleTotalOrders,
      inputType: InputType.Number,
      label: 'Total Orders',
      onChange: ({ value }: NumberFormatValues) => {
        dispatch(tradeFormActions.setScaleTotalOrders(value));
      },
      value: scaleTotalOrders ?? '',
      decimals: INTEGER_DECIMALS,
      group: 'scale-params',
    });
  }

  if (showScaleSkew) {
    tradeFormInputs.push({
      key: TradeBoxKeys.ScaleSkew,
      inputType: InputType.Number,
      label: 'Skew',
      onChange: ({ value }: NumberFormatValues) => {
        dispatch(tradeFormActions.setScaleSkew(value));
      },
      value: scaleSkew ?? '',
      decimals: 2,
      group: 'scale-params',
    });
  }

  return renderInputs(tradeFormInputs);
};

function renderInputs(inputs: TradeBoxInputConfig[]) {
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < inputs.length) {
    const input = inputs[i]!;

    if (input.group != null) {
      // Collect consecutive inputs with the same group
      const grouped: TradeBoxInputConfig[] = [input];
      while (i + 1 < inputs.length && inputs[i + 1]!.group === input.group) {
        i += 1;
        grouped.push(inputs[i]!);
      }
      elements.push(
        <$InlineRow key={input.group}>{grouped.map((cfg) => renderSingleInput(cfg))}</$InlineRow>
      );
    } else {
      elements.push(renderSingleInput(input));
    }
    i += 1;
  }

  return elements;
}

function renderSingleInput({
  key,
  inputType,
  label,
  onChange,
  onInput,
  validationConfig,
  value,
  decimals,
  slotRight,
}: TradeBoxInputConfig) {
  return (
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
  );
}

const $MidPriceButton = styled(Button)`
  ${formMixins.inputInnerButton}
`;

const $InlineRow = styled.span`
  ${layoutMixins.flexEqualColumns}
  gap: 1ch;
`;
