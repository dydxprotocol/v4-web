import type { FC } from 'react';
import { Slider } from 'radix-ui';
import * as $ from './SizeSlider.css';

export interface SizeSliderProps {
  valueInPercents: string;
  onValueChange: (nextValInPercents: string) => void;
}

export const SizeSlider: FC<SizeSliderProps> = ({ onValueChange, valueInPercents }) => {
  const handlePercentageClick = (percentage: number) => {
    onValueChange(String(percentage));
  };

  const handleSliderSlide = ([value]: number[]) => {
    onValueChange(String(value));
  };

  return (
    <>
      <div className={$.sliderHeader}>
        <span className={$.sliderLabel}>Percentage</span>
        <span className={$.sliderValue}>{Number(valueInPercents).toFixed(0)}%</span>
      </div>

      <Slider.Root
        className={$.sliderRoot}
        value={[Number(valueInPercents)]}
        onValueChange={handleSliderSlide}
        min={0}
        max={100}
        step={1}
      >
        <Slider.Track className={$.sliderTrack}>
          <Slider.Range className={$.sliderRange} />
        </Slider.Track>
        <Slider.Thumb className={$.sliderThumb} aria-label="Decrease percentage" />
      </Slider.Root>

      <div className={$.percentageMarks}>
        {PERCENTAGE_MARKS.map((mark) => (
          <button
            key={mark}
            type="button"
            className={`${$.percentageMark} ${
              Number(valueInPercents) === mark ? $.percentageMarkActive : ''
            }`}
            onClick={() => handlePercentageClick(mark)}
          >
            {mark}%
          </button>
        ))}
      </div>
    </>
  );
};

const PERCENTAGE_MARKS = [0, 25, 50, 75, 100] as const;
