import { useCallback } from 'react';

import _ from 'lodash';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { TriggerOrdersInputField } from '@/constants/abacus';

import { Slider } from '@/components/Slider';

import { getTriggerOrdersInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  positionSize?: number;
  stepSizeDecimals?: number;
};

type StyleProps = {
  className?: string;
};

export const OrderSizeSlider = ({
  positionSize,
  stepSizeDecimals,
  className,
}: ElementProps & StyleProps) => {
  const { size } = useSelector(getTriggerOrdersInputs, shallowEqual) || {};
  const sizeBN = MustBigNumber(size);
  const sizeInputNumber = isNaN(sizeBN.toNumber()) ? 0 : sizeBN.toNumber();

  console.log('Xcxc', size, sizeInputNumber, positionSize);

  const debouncedSetAbacusSize = useCallback(
    _.debounce((newSize: number) => {
      abacusStateManager.setTriggerOrdersValue({
        value: newSize,
        field: TriggerOrdersInputField.size,
      });
    }, 50),
    []
  );

  const onSliderDrag = ([newSize]: number[]) => {
    debouncedSetAbacusSize(newSize);
  };

  const onValueCommit = ([newSize]: number[]) => {
    // Ensure Abacus is updated with the latest, committed value
    debouncedSetAbacusSize.cancel();
    abacusStateManager.setTriggerOrdersValue({
      value: newSize,
      field: TriggerOrdersInputField.size,
    });
  };

  return (
    <Styled.SliderContainer className={className}>
      <Styled.Slider
        label="PositionSize"
        min={0}
        max={positionSize}
        step={stepSizeDecimals}
        onSliderDrag={onSliderDrag}
        onValueCommit={onValueCommit}
        value={sizeInputNumber}
      />
    </Styled.SliderContainer>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.SliderContainer = styled.div`
  height: 1.375rem;
`;
Styled.Slider = styled(Slider)`
  --slider-track-backgroundColor: var(--color-layer-4);
  --slider-track-background: linear-gradient(
    90deg,
    var(--color-layer-6) 0%,
    var(--color-text-0) 100%
  );
`;
