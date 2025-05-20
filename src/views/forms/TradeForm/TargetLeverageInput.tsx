import { useCallback, useMemo } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { LEVERAGE_DECIMALS } from '@/constants/numbers';

import { useQuickUpdatingState } from '@/hooks/useQuickUpdatingState';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { formMixins } from '@/styles/formMixins';

import { Input, InputType } from '@/components/Input';
import { Slider } from '@/components/Slider';
import { WithLabel } from '@/components/WithLabel';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';
import { getTradeFormValues } from '@/state/tradeFormSelectors';

import { mapIfPresent } from '@/lib/do';
import { calculateMarketMaxLeverage } from '@/lib/marketsHelpers';
import { AttemptBigNumber, MaybeBigNumber, MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

export const TargetLeverageInput = () => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const { targetLeverage } = useAppSelector(getTradeFormValues);
  const { initialMarginFraction, effectiveInitialMarginFraction } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const setLeverageSlow = useCallback(
    (newLeverageString: string | undefined) => {
      dispatch(tradeFormActions.setTargetLeverage(newLeverageString ?? ''));
    },
    [dispatch]
  );

  const {
    value: leverage,
    setValue: setLeverage,
    commitValue: commitLeverageState,
  } = useQuickUpdatingState<string | undefined>({
    setValueSlow: setLeverageSlow,
    slowValue: targetLeverage ?? '',
    debounceMs: 100,
  });

  const maxLeverage = useMemo(() => {
    return calculateMarketMaxLeverage({
      initialMarginFraction: MaybeBigNumber(initialMarginFraction)?.toNumber(),
      effectiveInitialMarginFraction,
    });
  }, [initialMarginFraction, effectiveInitialMarginFraction]);

  const onSliderDrag = ([newLeverage]: number[]) => {
    const newLeverageString = mapIfPresent(newLeverage, (lev) =>
      MustBigNumber(lev).toFixed(LEVERAGE_DECIMALS)
    );
    setLeverage(newLeverageString);
  };

  const commitLeverage = (newLeverage: string) => {
    commitLeverageState(newLeverage);
  };

  const onValueCommit = ([newLeverage]: number[]) => {
    const newLeverageString = mapIfPresent(newLeverage, (lev) =>
      MustBigNumber(lev).toFixed(LEVERAGE_DECIMALS)
    );
    commitLeverage(newLeverageString ?? '');
  };

  return (
    <$InputContainer>
      <$WithLabel
        label={
          <div tw="mb-0.25 flex">
            <WithTooltip
              tooltip="target-leverage"
              stringParams={{
                TARGET_LEVERAGE: AttemptBigNumber(targetLeverage)?.toFixed(LEVERAGE_DECIMALS),
              }}
              side="right"
            >
              {stringGetter({ key: STRING_KEYS.TARGET_LEVERAGE })}
            </WithTooltip>
          </div>
        }
      >
        <$LeverageSlider
          label="TargetLeverage"
          min={1}
          max={maxLeverage}
          value={MustBigNumber(leverage).abs().toNumber()}
          onSliderDrag={onSliderDrag}
          onValueCommit={onValueCommit}
        />
      </$WithLabel>
      <$InnerInputContainer>
        <Input
          placeholder={`${MustBigNumber(leverage).abs().toFixed(LEVERAGE_DECIMALS)}×`}
          type={InputType.Leverage}
          value={leverage ?? ''}
          max={maxLeverage}
          onInput={({ formattedValue }: { floatValue?: number; formattedValue: string }) => {
            commitLeverage(formattedValue);
          }}
        />
      </$InnerInputContainer>
    </$InputContainer>
  );
};

const $InputContainer = styled.div`
  ${formMixins.inputContainer}
  --input-height: 3.5rem;
  --input-backgroundColor: none;

  padding: var(--form-input-paddingY) var(--form-input-paddingX);

  @media ${breakpoints.tablet} {
    --input-height: 4rem;
  }
`;

const $WithLabel = styled(WithLabel)`
  ${formMixins.inputLabel}
`;

const $InnerInputContainer = styled.div`
  ${formMixins.inputContainer}
  --input-backgroundColor: var(--color-layer-4);
  --input-borderColor: none;
  --input-height: 2.25rem;
  --input-width: 5rem;

  margin-left: 0.25rem;

  input {
    text-align: end;
    padding: 0 var(--form-input-paddingX);
  }

  @media ${breakpoints.tablet} {
    --input-height: 2.5rem;
  }
`;

const $LeverageSlider = styled(Slider)`
  height: 1.375rem;
  --slider-track-background: linear-gradient(
    90deg,
    var(--color-layer-7) 0%,
    var(--color-text-2) 100%
  );
`;
