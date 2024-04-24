import { useCallback } from 'react';

import _ from 'lodash';
import styled, { AnyStyledComponent } from 'styled-components';

import { Slider } from '@/components/Slider';

type ElementProps = {
  setAbacusSize: (value: number | null) => void;
  setOrderSizeInput: (value: number) => void;
  size: number | null;
  positionSize?: number;
};

type StyleProps = {
  className?: string;
};

export const OrderSizeSlider = ({
  setOrderSizeInput,
  setAbacusSize,
  size,
  positionSize,
  className,
}: ElementProps & StyleProps) => {
  const step = positionSize ? Math.pow(10, Math.floor(Math.log10(positionSize) - 1)) : 0.1;
  const maxSize = positionSize ?? 0;
  const currSize = size ?? 0;

  // Debounced slightly to avoid excessive updates to Abacus while still providing a smooth slide
  const debouncedSetAbacusSize = useCallback(
    _.debounce((newSize: number) => {
      setAbacusSize(newSize);
    }, 50),
    []
  );

  const onSliderDrag = ([newSize]: number[]) => {
    setOrderSizeInput(newSize);
    debouncedSetAbacusSize(newSize);
  };

  const onValueCommit = ([newSize]: number[]) => {
    setOrderSizeInput(newSize);
    // Ensure Abacus is updated with the latest, committed value
    debouncedSetAbacusSize.cancel();
    setAbacusSize(newSize);
  };

  return (
    <Styled.SliderContainer className={className}>
      <Styled.Slider
        label="PositionSize"
        min={0}
        max={maxSize}
        step={step}
        onSliderDrag={onSliderDrag}
        onValueCommit={onValueCommit}
        value={Math.min(currSize, maxSize)}
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
