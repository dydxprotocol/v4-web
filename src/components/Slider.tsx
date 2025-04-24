import { Root, Thumb, Track } from '@radix-ui/react-slider';
import styled, { css } from 'styled-components';

type ElementProps = {
  value: number;
  label?: string;
  onSliderDrag: ([value]: number[]) => void;
  onValueCommit: ([value]: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  midPercent?: number;
};

type StyleProps = { className?: string };

export const Slider = ({
  className,
  label = 'slider',
  value,
  onSliderDrag,
  onValueCommit,
  min,
  max,
  midPercent,
  step = 0.1,
}: ElementProps & StyleProps) => (
  <$Root
    aria-label={label}
    className={className}
    min={min}
    max={max}
    step={step}
    value={[value]}
    onValueChange={onSliderDrag}
    onValueCommit={onValueCommit}
  >
    <$Track $midpoint={midPercent} />
    <$Thumb />
  </$Root>
);
const $Root = styled(Root)`
  // make thumb covers the start of the track
  --radix-slider-thumb-transform: translateX(-65%) !important;
  --slider-track-background: ;
  --slider-track-backgroundColor: var(--color-layer-4);

  position: relative;

  display: flex;
  align-items: center;

  user-select: none;

  height: 100%;
`;

const $Track = styled(Track)<{ $midpoint?: number }>`
  position: relative;

  display: flex;
  flex-grow: 1;
  align-items: center;

  height: 0.5rem;
  margin-right: 0.25rem; // make thumb covers the end of the track

  cursor: pointer;
  background: var(--slider-track-background);

  &:before {
    content: '';
    width: 100%;
    height: 100%;

    background: linear-gradient(
        90deg,
        transparent,
        transparent 15%,
        var(--slider-track-backgroundColor) 15%,
        var(--slider-track-backgroundColor) 50%,
        transparent 50%,
        transparent 65%,
        var(--slider-track-backgroundColor) 65%
      )
      0 0 / 0.6rem;
  }

  ${({ $midpoint }) =>
    $midpoint == null
      ? ''
      : css`
          &:after {
            content: '';
            position: absolute;
            left: ${$midpoint}%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 2px;
            height: 14px;
            background-color: white;
            border-radius: 1px;
            pointer-events: none;
          }
        `}
`;

const $Thumb = styled(Thumb)`
  height: 1.375rem;
  width: 1.375rem;

  display: flex;
  justify-content: center;
  align-items: center;

  background-color: var(--color-layer-6);
  opacity: 0.8;

  border: 1.5px solid var(--color-layer-7);
  border-radius: 50%;

  cursor: grab;
`;
