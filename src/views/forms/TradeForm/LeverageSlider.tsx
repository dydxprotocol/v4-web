import { useCallback } from 'react';

import { clamp } from 'lodash';
import styled, { css } from 'styled-components';

import { Slider } from '@/components/Slider';

import { calc, mapIfPresent } from '@/lib/do';
import { AttemptNumber, MustBigNumber, MustNumber } from '@/lib/numbers';

type ElementProps = {
  leverageInput: string;
  leftLeverageSigned: number;
  rightLeverageSigned: number;
  setLeverageInputValue: (value: string) => void;
};

type StyleProps = { className?: string };

export const LeverageSlider = ({
  leverageInput,
  leftLeverageSigned,
  rightLeverageSigned,
  setLeverageInputValue,
  className,
}: ElementProps & StyleProps) => {
  const localLeverage = AttemptNumber(leverageInput) ?? leftLeverageSigned;
  const leftLeverage = MustNumber(leftLeverageSigned);
  const rightLeverage = MustNumber(rightLeverageSigned);

  const scaleExp = getScaleExponent(leftLeverage, rightLeverage);

  const setLeverage = useCallback(
    (thisLeverage: number) => {
      setLeverageInputValue(MustBigNumber(thisLeverage).toFixed(4));
    },
    [setLeverageInputValue]
  );

  const MIN_SPACE = 10;
  const ticks = calc(() => {
    // sorted by priority
    const possibleTicks = [0];
    const ticksInner: Array<{
      percent: number;
      fraction: number;
      leverage: number;
      light: boolean;
      text: string;
    }> = [];
    possibleTicks.forEach((t) => {
      const fraction = getScaledFractionIfValid(t, leftLeverage, rightLeverage, scaleExp);
      const percent = mapIfPresent(fraction, (f) => f * 100);
      if (
        percent != null &&
        fraction != null &&
        ticksInner.find((otherTick) => Math.abs(otherTick.percent - percent) < MIN_SPACE) == null
      ) {
        ticksInner.push({
          percent,
          fraction,
          light: t === 0,
          leverage: t,
          text: t !== 0 ? `${Math.abs(t)}×` : '',
        });
      }
      return undefined;
    });
    return ticksInner;
  });

  function snapToTick(val: number): number {
    const close = ticks.find((t) => Math.abs(t.fraction - val) < MIN_SPACE / 100 / 3);
    if (close != null) {
      return close.fraction;
    }
    return val;
  }

  const onSliderDrag = ([sliderValue]: number[]) => {
    const thisLeverage = fromAdjustedSliderValue(snapToTick(sliderValue ?? 0));
    setLeverage(thisLeverage);
  };

  const onValueCommit = ([sliderValue]: number[]) => {
    const thisLeverage = fromAdjustedSliderValue(snapToTick(sliderValue ?? 0));
    setLeverage(thisLeverage);
  };

  const rightIsPositive = rightLeverage >= leftLeverage;

  const toAdjustedSliderValue = (val: number) => {
    return toScaled(getFractionBetween(val, leftLeverage, rightLeverage), scaleExp);
  };
  const fromAdjustedSliderValue = (val: number) => {
    return getValueAtFraction(fromScaled(val, scaleExp), leftLeverage, rightLeverage);
  };

  return (
    <div className={className} tw="h-[1.375rem]">
      <$Slider
        label="MarketLeverage"
        min={0}
        max={1}
        step={0.001}
        value={toAdjustedSliderValue(
          clamp(
            localLeverage,
            Math.min(leftLeverage, rightLeverage),
            Math.max(leftLeverage, rightLeverage)
          )
        )}
        onSliderDrag={onSliderDrag}
        onValueCommit={onValueCommit}
        ticks={ticks}
        $midpoint={ticks.find((t) => t.leverage === 0)?.percent}
        $flipped={!rightIsPositive}
      />
    </div>
  );
};

const $Slider = styled(Slider)<{ $midpoint?: number; $flipped: boolean }>`
  --slider-track-backgroundColor: var(--color-layer-2);

  ${({ $midpoint, $flipped }) => css`
    --slider-track-background: linear-gradient(
      90deg,
      var(${$flipped ? '--color-positive' : '--color-negative'}) 0%,
      var(--color-layer-7) ${$midpoint ?? 0}%,
      var(${$flipped ? '--color-negative' : '--color-positive'}) 100%
    );
  `}
`;

function getScaledFractionIfValid(
  num: number,
  leftLeverage: number,
  rightLeverage: number,
  exponent: number
): number | undefined {
  const fraction = getFractionBetween(num, leftLeverage, rightLeverage);
  if (fraction === 0 || fraction === 1) {
    return undefined;
  }
  return toScaled(fraction, exponent);
}

function getFractionBetween(target: number, leftValue: number, rightValue: number): number {
  // Determine if rightward movement is positive (left < right)
  const rightwardIsPositive = rightValue > leftValue;

  // Get min and max values based on rightward direction
  const minValue = rightwardIsPositive ? leftValue : rightValue;
  const maxValue = rightwardIsPositive ? rightValue : leftValue;

  // If target is less than min, return the appropriate endpoint value
  if (target <= minValue) {
    return leftValue === minValue ? 0 : 1;
  }

  // If target is greater than max, return the appropriate endpoint value
  if (target >= maxValue) {
    return leftValue === maxValue ? 0 : 1;
  }

  // Calculate the fraction for target between the values
  const totalDistance = maxValue - minValue;
  const distanceFromLeft = Math.abs(target - leftValue);

  return distanceFromLeft / totalDistance;
}

function getValueAtFraction(fraction: number, leftValue: number, rightValue: number): number {
  // Ensure fraction is between 0 and 1
  if (fraction < 0 || fraction > 1) {
    throw new Error('Fraction must be between 0 and 1');
  }

  // Calculate the distance between the values
  const distance = rightValue - leftValue;

  // Calculate the offset from the left value
  const offset = distance * fraction;

  // Return the value at the specified fraction
  return leftValue + offset;
}

function getScaleExponent(left: number, right: number) {
  const min = 0.2;
  const max = 0.4;
  const expectedMinLeverage = 5;
  const expectedMaxLeverage = 50;

  const diff = clamp(Math.abs(right - left), expectedMinLeverage, expectedMaxLeverage);
  const normalized = (diff - expectedMinLeverage) / (expectedMaxLeverage - expectedMinLeverage);
  return max - normalized * (max - min);
}

function toScaled(num: number, exponent: number) {
  return num ** exponent;
}

function fromScaled(num: number, exponent: number) {
  return exponent === 0 ? 0 : num ** (1 / exponent);
}
