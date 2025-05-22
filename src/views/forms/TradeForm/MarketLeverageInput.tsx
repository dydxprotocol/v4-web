import { minBy } from 'lodash';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { LEVERAGE_DECIMALS } from '@/constants/numbers';
import { PositionSide } from '@/constants/trade';

import { useQuickUpdatingState } from '@/hooks/useQuickUpdatingState';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { formMixins } from '@/styles/formMixins';

import { Input, InputType } from '@/components/Input';
import { PositionSideTag } from '@/components/PositionSideTag';
import { WithLabel } from '@/components/WithLabel';
import { WithTooltip } from '@/components/WithTooltip';

import { getCurrentMarketPositionData } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { clamp } from '@/lib/math';
import { AttemptBigNumber, AttemptNumber, MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import { LeverageSlider } from './LeverageSlider';

type ElementProps = {
  leverageInputValue: string;
  setLeverageInputValue: (value: string) => void;
  leftLeverage: number;
  rightLeverage: number;
};

export const MarketLeverageInput = ({
  leverageInputValue,
  setLeverageInputValue,
  leftLeverage,
  rightLeverage,
}: ElementProps) => {
  const stringGetter = useStringGetter();

  const { leverage: currentLeverage } = orEmptyObj(useAppSelector(getCurrentMarketPositionData));

  const minLeverage = Math.min(leftLeverage, rightLeverage);
  const maxLeverage = Math.max(leftLeverage, rightLeverage);

  const {
    value: localLeverage,
    setValue: setLocalLeverage,
    commitValue: commitLocalLeverage,
  } = useQuickUpdatingState({
    setValueSlow: setLeverageInputValue,
    slowValue: leverageInputValue,
    debounceMs: 100,
  });

  const effectiveLeverageInput = clamp(
    AttemptNumber(localLeverage) ?? leftLeverage,
    minLeverage,
    maxLeverage
  );

  const onLeverageTypedInput = ({
    formattedValue,
  }: {
    floatValue?: number;
    formattedValue: string;
  }) => {
    const numberVal = AttemptNumber(formattedValue);

    if (numberVal == null) {
      commitLocalLeverage(formattedValue);
      return;
    }

    const validValues = [];

    if (numberVal >= minLeverage && numberVal <= maxLeverage) {
      validValues.push(numberVal);
    }
    const opposite = -1 * numberVal;
    if (opposite >= minLeverage && opposite <= maxLeverage) {
      validValues.push(opposite);
    }
    if (validValues.length === 0) {
      commitLocalLeverage(formattedValue);
      return;
    }

    const minDistanceFromCurrent = minBy(validValues, (v) => Math.abs(effectiveLeverageInput - v))!;
    commitLocalLeverage(MustBigNumber(minDistanceFromCurrent).toFixed(4));
  };

  const onLeverageSideToggle = () => {
    const flippedValue = effectiveLeverageInput * -1;
    const clampedValue = clamp(flippedValue, minLeverage, maxLeverage);
    commitLocalLeverage(AttemptBigNumber(clampedValue)?.toFixed(4) ?? '');
  };

  return (
    <$InputContainer>
      <$WithLabel
        key="leverage"
        label={
          <div tw="mb-0.25 flex gap-[0.5ch]">
            <WithTooltip tooltip="leverage" side="right">
              {stringGetter({ key: STRING_KEYS.LEVERAGE })}
            </WithTooltip>
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div onClick={onLeverageSideToggle} tw="cursor-pointer">
              <PositionSideTag
                positionSide={
                  effectiveLeverageInput === 0
                    ? PositionSide.None
                    : effectiveLeverageInput > 0
                      ? PositionSide.Long
                      : PositionSide.Short
                }
              />
            </div>
          </div>
        }
      >
        <LeverageSlider
          leftLeverageSigned={leftLeverage}
          rightLeverageSigned={rightLeverage}
          leverageInput={localLeverage}
          setLeverageInputValue={setLocalLeverage}
        />
      </$WithLabel>
      <$InnerInputContainer>
        <Input
          onInput={onLeverageTypedInput}
          placeholder={`${MustBigNumber(currentLeverage).abs().toFixed(LEVERAGE_DECIMALS)}×`}
          type={InputType.Leverage}
          value={localLeverage}
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
