import { useMemo, useState } from 'react';

import { debounce } from 'lodash';
import { NumberFormatValues } from 'react-number-format';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { TradeInputField } from '@/constants/abacus';
import { QUICK_DEBOUNCE_MS } from '@/constants/debounce';
import { STRING_KEYS } from '@/constants/localization';
import { LEVERAGE_DECIMALS } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { formMixins } from '@/styles/formMixins';

import { Input, InputType } from '@/components/Input';
import { Slider } from '@/components/Slider';
import { WithLabel } from '@/components/WithLabel';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppSelector } from '@/state/appTypes';
import { getInputTradeTargetLeverage } from '@/state/inputsSelectors';
import { getCurrentMarketConfig } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { calculateMarketMaxLeverage } from '@/lib/marketsHelpers';
import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

export const TargetLeverageInput = () => {
  const stringGetter = useStringGetter();

  const targetLeverage = useAppSelector(getInputTradeTargetLeverage);
  const { initialMarginFraction, effectiveInitialMarginFraction } = orEmptyObj(
    useAppSelector(getCurrentMarketConfig, shallowEqual)
  );

  const [leverage, setLeverage] = useState(targetLeverage?.toString() ?? '');

  const maxLeverage = useMemo(() => {
    return calculateMarketMaxLeverage({ initialMarginFraction, effectiveInitialMarginFraction });
  }, [initialMarginFraction, effectiveInitialMarginFraction]);

  // Debounced slightly to avoid excessive updates to Abacus while still providing a smooth slide
  const debouncedSetAbacusLeverage = useMemo(
    () =>
      debounce(
        (newLeverage: number) =>
          abacusStateManager.setTradeValue({
            value: newLeverage,
            field: TradeInputField.targetLeverage,
          }),
        QUICK_DEBOUNCE_MS
      ),
    []
  );

  const onSliderDrag = ([newLeverage]: number[]) => {
    setLeverage(newLeverage!.toString());
    debouncedSetAbacusLeverage(newLeverage!);
  };

  const onValueCommit = ([newLeverage]: number[]) => {
    setLeverage(newLeverage!.toString());

    // Ensure Abacus is updated with the latest, committed value
    debouncedSetAbacusLeverage.cancel();

    abacusStateManager.setTradeValue({
      value: newLeverage,
      field: TradeInputField.targetLeverage,
    });
  };

  return (
    <$InputContainer>
      <$WithLabel
        label={
          <div tw="flex">
            <WithTooltip
              tooltip="target-leverage"
              stringParams={{
                TARGET_LEVERAGE: targetLeverage?.toFixed(LEVERAGE_DECIMALS),
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
          value={leverage}
          max={maxLeverage}
          onChange={({ floatValue }: NumberFormatValues) => {
            setLeverage(floatValue?.toString() ?? '');
            debouncedSetAbacusLeverage(floatValue?.toString() ?? '');
          }}
        />
      </$InnerInputContainer>
    </$InputContainer>
  );
};

const $InputContainer = styled.div`
  ${formMixins.inputContainer}
  --input-height: 3.5rem;

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
  --input-backgroundColor: var(--color-layer-5);
  --input-borderColor: var(--color-layer-7);
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
