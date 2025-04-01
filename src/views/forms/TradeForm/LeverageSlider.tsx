import { useMemo } from 'react';

import { BigNumber } from 'bignumber.js';
import { debounce } from 'lodash';
import styled, { css } from 'styled-components';

import { QUICK_DEBOUNCE_MS } from '@/constants/debounce';
import { LEVERAGE_DECIMALS } from '@/constants/numbers';

import { Slider } from '@/components/Slider';

import { useAppDispatch } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';

import {
  AttemptBigNumber,
  BIG_NUMBERS,
  clampBn,
  MustBigNumber,
  type BigNumberish,
} from '@/lib/numbers';

type ElementProps = {
  leverageInput: string;
  leftLeverageSigned: BigNumberish;
  rightLeverageSigned: BigNumberish;
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
  const dispatch = useAppDispatch();
  const leverageBN = AttemptBigNumber(leverageInput);
  const leftLeverageBN = MustBigNumber(leftLeverageSigned);
  const rightLeverageBN = MustBigNumber(rightLeverageSigned);

  // Debounced slightly to avoid excessive updates while still providing a smooth slide
  const debouncedSetLeverage = useMemo(
    () =>
      debounce(
        (newLeverage: string) => dispatch(tradeFormActions.setSizeLeverageSigned(newLeverage)),
        QUICK_DEBOUNCE_MS
      ),
    [dispatch]
  );

  const onSliderDrag = ([newLeverage]: number[]) => {
    const leverageString = fromAdjustedSliderValue(newLeverage ?? 0).toFixed(LEVERAGE_DECIMALS);
    setLeverageInputValue(leverageString);
    debouncedSetLeverage(leverageString);
  };

  const onValueCommit = ([newLeverage]: number[]) => {
    const leverageString = fromAdjustedSliderValue(newLeverage ?? 0).toFixed(LEVERAGE_DECIMALS);
    setLeverageInputValue(leverageString);

    // Ensure store is updated with the latest, committed value
    debouncedSetLeverage.cancel();

    dispatch(tradeFormActions.setSizeLeverageSigned(leverageString));
  };

  const midpointFraction = getZeroFractionBetween(leftLeverageBN, rightLeverageBN);
  const rightIsPositive = rightLeverageBN.gte(leftLeverageBN);

  const toAdjustedSliderValue = (val: BigNumber) => {
    return getFractionBetween(MustBigNumber(val), leftLeverageBN, rightLeverageBN);
  };
  const fromAdjustedSliderValue = (val: number) => {
    return getValueAtFraction(MustBigNumber(val), leftLeverageBN, rightLeverageBN);
  };

  return (
    <div className={className} tw="h-[1.375rem]">
      <$Slider
        label="MarketLeverage"
        min={0}
        max={1}
        step={0.001}
        value={toAdjustedSliderValue(
          clampBn(
            leverageBN ?? BIG_NUMBERS.ZERO,
            BigNumber.min(leftLeverageBN, rightLeverageBN),
            BigNumber.max(leftLeverageBN, rightLeverageBN)
          )
        ).toNumber()}
        onSliderDrag={onSliderDrag}
        onValueCommit={onValueCommit}
        $midpoint={midpointFraction != null ? 100 * midpointFraction : undefined}
        $flipped={!rightIsPositive}
      />
    </div>
  );
};
const $Slider = styled(Slider)<{ $midpoint?: number; $flipped: boolean }>`
  --slider-track-backgroundColor: var(--color-layer-4);

  ${({ $midpoint, $flipped }) => css`
    --slider-track-background: linear-gradient(
      90deg,
      var(${$flipped ? '--color-positive' : '--color-negative'}) 0%,
      var(--color-layer-7) ${$midpoint ?? 0}%,
      var(${$flipped ? '--color-negative' : '--color-positive'}) 100%
    );
  `}
`;

function getZeroFractionBetween(
  leftLeverageBN: BigNumber,
  rightLeverageBN: BigNumber
): number | undefined {
  // Check if zero is between the two values (they have opposite signs)
  const leftIsNegative = leftLeverageBN.isNegative();
  const rightIsNegative = rightLeverageBN.isNegative();

  // If both are on the same side of zero (both positive or both negative)
  // or if one of them is zero, return undefined
  if (
    (leftIsNegative && rightIsNegative) ||
    (!leftIsNegative && !rightIsNegative && !leftLeverageBN.isZero() && !rightLeverageBN.isZero())
  ) {
    return undefined;
  }

  // If zero is equal to one of the values
  if (leftLeverageBN.isZero()) return 0;
  if (rightLeverageBN.isZero()) return 1;

  // Use the general function to calculate the fraction
  return getFractionBetween(BIG_NUMBERS.ZERO, leftLeverageBN, rightLeverageBN).toNumber();
}

function getFractionBetween(
  target: BigNumber,
  leftValue: BigNumber,
  rightValue: BigNumber
): BigNumber {
  // Determine if rightward movement is positive (left < right)
  const rightwardIsPositive = rightValue.isGreaterThan(leftValue);

  // Get min and max values based on rightward direction
  const minValue = rightwardIsPositive ? leftValue : rightValue;
  const maxValue = rightwardIsPositive ? rightValue : leftValue;

  // If target is less than min, return the appropriate endpoint value
  if (target.isLessThanOrEqualTo(minValue)) {
    return leftValue.isEqualTo(minValue) ? BIG_NUMBERS.ZERO : BIG_NUMBERS.ONE;
  }

  // If target is greater than max, return the appropriate endpoint value
  if (target.isGreaterThanOrEqualTo(maxValue)) {
    return leftValue.isEqualTo(maxValue) ? BIG_NUMBERS.ZERO : BIG_NUMBERS.ONE;
  }

  // Calculate the fraction for target between the values
  const totalDistance = maxValue.minus(minValue);
  const distanceFromLeft = target.minus(leftValue).abs();

  return distanceFromLeft.dividedBy(totalDistance);
}

function getValueAtFraction(
  fraction: BigNumber,
  leftValue: BigNumber,
  rightValue: BigNumber
): BigNumber {
  // Ensure fraction is between 0 and 1
  if (fraction.lt(0) || fraction.gt(1)) {
    throw new Error('Fraction must be between 0 and 1');
  }

  // Calculate the distance between the values
  const distance = rightValue.minus(leftValue);

  // Calculate the offset from the left value
  const offset = distance.multipliedBy(fraction);

  // Return the value at the specified fraction
  return leftValue.plus(offset);
}
