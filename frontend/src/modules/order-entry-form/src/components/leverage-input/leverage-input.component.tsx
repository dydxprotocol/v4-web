import { type FC } from 'react';
import { Slider } from 'radix-ui';
import { useController } from 'react-hook-form';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { OrderEntryFormApiContext } from '../../contexts';
import * as styles from './leverage-input.css';

export const LeverageInput: FC = () => {
  const { control } = useRequiredContext(OrderEntryFormApiContext);
  const { field } = useController({ control, name: 'leverage' });

  const stepIdx = STEP_VALUES.indexOf(+field.value);

  const handleSliderChange = ([stepIdx]: number[]) => {
    field.onChange(String(STEP_VALUES[stepIdx]));
  };

  const handleLabelClick = (label: number) => {
    field.onChange(String(label));
  };

  return (
    <div css={styles.sliderContainer}>
      <label css={styles.sliderLabel}>Leverage</label>
      <Slider.Root
        css={styles.sliderRoot}
        value={[stepIdx]}
        onValueChange={handleSliderChange}
        min={0}
        max={STEP_VALUES.length - 1}
        step={1}
      >
        <div
          style={{
            position: 'absolute',
            width: '5ch',
            bottom: 28,
            textAlign: 'center',
            transform: 'translate(-50%)',
            left: `clamp(25%, ${(stepIdx / 70) * 100}%, 95%)`,
            zIndex: 100,
          }}
        >
          {field.value}x
        </div>

        <Slider.Track css={styles.sliderTrack}>
          <Slider.Range css={styles.sliderRange} />
        </Slider.Track>

        <Slider.Thumb css={styles.sliderThumb}></Slider.Thumb>
      </Slider.Root>

      <div css={styles.percentageMarks}>
        {LABEL_PERCENTAGE_MARKS.map((mark, index) => {
          const isFirst = index === 0;
          const isLast = index === LABEL_PERCENTAGE_MARKS.length - 1;
          return (
            <button
              key={mark}
              type="button"
              css={[
                styles.percentageMark,
                isFirst && styles.percentageMarkFirst,
                isLast && styles.percentageMarkLast,
              ]}
              style={{ left: `${mark}%` }}
              onClick={() => handleLabelClick(LABELS[index])}
            >
              {LABELS[index]}x
            </button>
          );
        })}
      </div>
    </div>
  );
};

const LABEL_PERCENTAGE_MARKS = [0, 14, 29, 43, 57, 71, 86, 100];
const LABELS = [0.1, 1, 2, 5, 10, 25, 50, 100];

// prettier-ignore
const STEP_VALUES = [
    0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1,

    1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2,

    2.3, 2.6, 2.9, 3.2, 3.5, 3.8, 4.1, 4.4, 4.7, 5,
    
    5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10,

    11.5, 13, 14.5, 16, 17.5, 19, 20.5, 22, 23.5, 25,
    
    27.5, 30, 32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50,

    55, 60, 65, 70, 75, 80, 85, 90, 95, 100 
  ];
