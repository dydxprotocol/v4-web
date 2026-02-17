import { Ref, useEffect, useState } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { NumberFormatValues, SourceInfo } from 'react-number-format';
import styled from 'styled-components';

import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { INTEGER_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { InputErrorData, TradeBoxKeys } from '@/constants/trade';

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
  sectionLabel?: string;
  companionInput?: TradeBoxInputConfig;
};

export const TradeFormInputs = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const tradeSummary = useAppSelector(getTradeFormSummary).summary;
  const { showLimitPrice, showTriggerPrice, showDuration, showFrequency } = tradeSummary.options;
  const tradeFormValues = useAppSelector(getTradeFormValues);
  const {
    limitPrice,
    triggerPrice,
    marketId,
    type,
    durationHours,
    durationMinutes,
    frequencySeconds,
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

  if (showDuration) {
    tradeFormInputs.push({
      key: TradeBoxKeys.DurationHours,
      inputType: InputType.Number,
      label: 'Hour(s)',
      onChange: ({ value }: NumberFormatValues) => {
        dispatch(tradeFormActions.setDurationHours(value));
      },
      value: durationHours ?? '',
      decimals: INTEGER_DECIMALS,
      sectionLabel: 'Running Time (5m - 24h)',
      companionInput: {
        key: TradeBoxKeys.DurationMinutes,
        inputType: InputType.Number,
        label: 'Minute(s)',
        onChange: ({ value }: NumberFormatValues) => {
          dispatch(tradeFormActions.setDurationMinutes(value));
        },
        value: durationMinutes ?? '',
        decimals: INTEGER_DECIMALS,
      },
    });
  }

  if (showFrequency) {
    tradeFormInputs.push({
      key: TradeBoxKeys.FrequencySeconds,
      inputType: InputType.Number,
      label: 'Seconds',
      onChange: ({ value }: NumberFormatValues) => {
        dispatch(tradeFormActions.setFrequencySeconds(value));
      },
      value: frequencySeconds ?? '',
      decimals: INTEGER_DECIMALS,
      sectionLabel: 'Frequency',
    });
  }

  return tradeFormInputs.map((config) => {
    const {
      key,
      inputType,
      label,
      onChange,
      onInput,
      validationConfig,
      value,
      decimals,
      slotRight,
      sectionLabel,
      companionInput,
    } = config;

    const primaryInput = (
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

    if (!sectionLabel) {
      return primaryInput;
    }

    const inputRow = companionInput ? (
      <$DurationRow>
        {primaryInput}
        <FormInput
          key={companionInput.key}
          id={companionInput.key}
          type={companionInput.inputType}
          label={companionInput.label}
          onChange={companionInput.onChange}
          onInput={companionInput.onInput}
          validationConfig={companionInput.validationConfig}
          value={companionInput.value}
          decimals={companionInput.decimals}
          slotRight={companionInput.slotRight}
        />
      </$DurationRow>
    ) : (
      primaryInput
    );

    return (
      <$TwapSection key={key}>
        <$SectionLabel>{sectionLabel}</$SectionLabel>
        {inputRow}
      </$TwapSection>
    );
  });
};

const $MidPriceButton = styled(Button)`
  ${formMixins.inputInnerButton}
`;

const $TwapSection = styled.div`
  ${layoutMixins.flexColumn}
  gap: 0.5rem;
`;

const $SectionLabel = styled.div`
  font: var(--font-small-book);
  color: var(--color-text-0);
`;

const $DurationRow = styled.div`
  ${layoutMixins.gridEqualColumns}
  gap: var(--form-input-gap);
`;
