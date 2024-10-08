import { useMemo } from 'react';

import { debounce } from 'lodash';
import styled from 'styled-components';

import { QUICK_DEBOUNCE_MS } from '@/constants/debounce';

import { Slider } from '@/components/Slider';

import { MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  setAbacusSize: (value: string) => void;
  setOrderSizeInput: (value: string) => void;
  size: number | null;
  positionSize?: number;
  stepSizeDecimals: number;
};

type StyleProps = {
  className?: string;
};

export const OrderSizeSlider = ({
  setOrderSizeInput,
  setAbacusSize,
  size,
  positionSize,
  stepSizeDecimals,
  className,
}: ElementProps & StyleProps) => {
  const step = positionSize ? 10 ** Math.floor(Math.log10(positionSize) - 1) : 0.1;
  const maxSize = positionSize ?? 0;
  const currSize = size ?? 0;

  // Debounced slightly to avoid excessive updates to Abacus while still providing a smooth slide
  const debouncedSetAbacusSize = useMemo(
    () => debounce((newSize: string) => setAbacusSize(newSize), QUICK_DEBOUNCE_MS),
    []
  );

  const onSliderDrag = ([newSize]: number[]) => {
    const roundedSize = MustBigNumber(newSize).toFixed(stepSizeDecimals);
    setOrderSizeInput(roundedSize);
    debouncedSetAbacusSize(roundedSize);
  };

  const onValueCommit = ([newSize]: number[]) => {
    const roundedSize = MustBigNumber(newSize).toFixed(stepSizeDecimals);
    setOrderSizeInput(roundedSize);
    // Ensure Abacus is updated with the latest, committed value
    debouncedSetAbacusSize.cancel();
    setAbacusSize(roundedSize);
  };

  return (
    <div className={className} tw="h-[1.375rem]">
      <$Slider
        label="PositionSize"
        min={0}
        max={maxSize}
        step={step}
        onSliderDrag={onSliderDrag}
        onValueCommit={onValueCommit}
        value={Math.min(currSize, maxSize)}
      />
    </div>
  );
};
const $Slider = styled(Slider)`
  --slider-track-backgroundColor: var(--color-layer-4);
  --slider-track-background: linear-gradient(
    90deg,
    var(--color-layer-6) 0%,
    var(--color-text-0) 100%
  );
`;
