import styled, { AnyStyledComponent } from 'styled-components';

import { Slider } from '@/components/Slider';

type ElementProps = {
  stepSizeDecimals?: number;
};

type StyleProps = {
  className?: string;
};

export const OrderSizeSlider = ({ stepSizeDecimals, className }: ElementProps & StyleProps) => {
  return (
    <Styled.SliderContainer className={className}>
      <Styled.Slider
        label="PositionSize"
        min={0}
        max={100}
        step={stepSizeDecimals}
        onSliderDrag={() => null}
        onValueCommit={() => null}
        value={[50]} // TODO: CT-625 Update with values from abacus
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
