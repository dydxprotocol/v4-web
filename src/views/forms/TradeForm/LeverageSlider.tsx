import { useEffect, useMemo, useState } from 'react';

import { clamp, debounce } from 'lodash';
import styled, { css } from 'styled-components';

import { Slider } from '@/components/Slider';

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
  const leverage = AttemptNumber(leverageInput);
  const leftLeverage = MustNumber(leftLeverageSigned);
  const rightLeverage = MustNumber(rightLeverageSigned);

  const [localLeverage, setLocalLeverage] = useState(leverage ?? leftLeverageSigned);

  useEffect(() => {
    setLocalLeverage(leverage ?? leftLeverageSigned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leverage]);

  const debouncedSetLeverage = useMemo(
    () =>
      debounce((newLeverage: string) => {
        setLeverageInputValue(newLeverage);
      }, 100),
    [setLeverageInputValue]
  );

  const onSliderDrag = ([newLeverage]: number[]) => {
    const thisLeverage = fromAdjustedSliderValue(newLeverage ?? leftLeverage);
    const leverageString = MustBigNumber(thisLeverage).toFixed(4);
    setLocalLeverage(thisLeverage);
    debouncedSetLeverage(leverageString);
  };

  const onValueCommit = ([newLeverage]: number[]) => {
    const thisLeverage = fromAdjustedSliderValue(newLeverage ?? leftLeverage);
    const leverageString = MustBigNumber(thisLeverage).toFixed(4);
    debouncedSetLeverage.cancel();
    setLocalLeverage(thisLeverage);
    setLeverageInputValue(leverageString);
  };

  const midpointFraction = getZeroFractionBetween(leftLeverage, rightLeverage);
  const rightIsPositive = rightLeverage >= leftLeverage;

  const toAdjustedSliderValue = (val: number) => {
    return getFractionBetween(val, leftLeverage, rightLeverage);
  };
  const fromAdjustedSliderValue = (val: number) => {
    return getValueAtFraction(val, leftLeverage, rightLeverage);
  };

  const midPercent = midpointFraction != null ? 100 * midpointFraction : undefined;
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
        midPercent={midPercent != null && midPercent > 0 ? midPercent : undefined}
        $midpoint={midPercent}
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

function getZeroFractionBetween(leftLeverage: number, rightLeverage: number): number | undefined {
  // Check if zero is between the two values (they have opposite signs)
  const leftIsNegative = leftLeverage < 0;
  const rightIsNegative = rightLeverage < 0;

  // If both are on the same side of zero (both positive or both negative)
  // or if one of them is zero, return undefined
  if (
    (leftIsNegative && rightIsNegative) ||
    (!leftIsNegative && !rightIsNegative && leftLeverage !== 0 && rightLeverage !== 0)
  ) {
    return undefined;
  }

  // If zero is equal to one of the values
  if (leftLeverage === 0) return 0;
  if (rightLeverage === 0) return 1;

  // Use the general function to calculate the fraction
  return getFractionBetween(0, leftLeverage, rightLeverage);
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
