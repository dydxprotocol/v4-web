import { Root, Thumb, Track } from '@radix-ui/react-slider';
import styled, { AnyStyledComponent } from 'styled-components';

type ElementProps = {
  stepSizeDecimals?: number;
};

type StyleProps = {
  className?: string;
};

export const OrderSizeSlider = ({ stepSizeDecimals, className }: ElementProps & StyleProps) => {
  return (
    <Styled.SliderContainer className={className}>
      <Styled.Root
        aria-label="PositionSize"
        min={0}
        max={100}
        step={stepSizeDecimals}
        defaultValue={[50]} // TODO: CT-625 Update with values from abacus
      >
        <Styled.Track></Styled.Track>
        <Styled.Thumb />
      </Styled.Root>
    </Styled.SliderContainer>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.SliderContainer = styled.div`
  --slider-backgroundColor: var(--color-layer-6);

  height: 1.375rem;
`;

Styled.Root = styled(Root)`
  // make thumb covers the start of the track
  --radix-slider-thumb-transform: translateX(-65%) !important;

  position: relative;

  display: flex;
  align-items: center;

  user-select: none;

  height: 100%;
`;

Styled.Thumb = styled(Thumb)`
  height: 1.375rem;
  width: 1.375rem;

  display: flex;
  justify-content: center;
  align-items: center;

  background-color: var(--color-layer-7);
  opacity: 0.5;

  border: 1.5px solid var(--color-white);
  border-radius: 50%;

  cursor: grab;
`;

Styled.Track = styled(Track)`
  &:before {
    content: '';
    width: 100%;
    height: 100%;

    background: linear-gradient(
        90deg,
        transparent,
        transparent 25%,
        var(--slider-backgroundColor) 25%,
        var(--slider-backgroundColor) 50%,
        transparent 50%,
        transparent 75%,
        var(--slider-backgroundColor) 75%
      )
      0 0 / 0.6rem;
  }
  position: relative;

  display: flex;
  flex-grow: 1;
  align-items: center;

  height: 0.5rem;
  margin-right: 0.25rem; // make thumb covers the end of the track

  cursor: pointer;
`;
