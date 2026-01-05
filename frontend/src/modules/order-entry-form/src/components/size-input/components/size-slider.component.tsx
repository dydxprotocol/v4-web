import type { FC } from 'react';
import { Slider } from 'radix-ui';
import { useController, useWatch } from 'react-hook-form';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { OrderEntryFormApiContext, OrderEntryFormMetaContext } from '../../../contexts';
import * as styles from './size-slider.css';

export const SizeSlider: FC = () => {
  const { userBalanceInQuoteAsset, userBalanceInBaseAsset, currentQuoteAssetPrice } =
    useRequiredContext(OrderEntryFormMetaContext);

  const { control } = useRequiredContext(OrderEntryFormApiContext);
  const { field } = useController({ control, name: 'positionSize' });

  const currentOrderExecutionType = useWatch({ control, name: 'orderExecutionType' });
  const currentPrice = useWatch({ control, name: 'price' });
  const currentOrderSide = useWatch({ control, name: 'orderSide' });

  const effectiveMaxSize = (() => {
    if (currentOrderSide === 'sell') return userBalanceInBaseAsset;

    const effectivePrice =
      currentOrderExecutionType === 'limit' && currentPrice
        ? parseFloat(currentPrice)
        : currentQuoteAssetPrice;

    return userBalanceInQuoteAsset / effectivePrice;
  })();

  const currentPercentage = (() => {
    if (effectiveMaxSize === 0) return 0;

    const currentValue = parseFloat(field.value || '0');
    return Math.min((currentValue / effectiveMaxSize) * 100, 100);
  })();

  const handleSliderChange = (values: number[]) => {
    const percentage = values[0];
    const calculatedSize = (effectiveMaxSize * percentage) / 100;
    field.onChange(calculatedSize.toFixed(4));
  };

  return (
    <div css={styles.sliderContainer}>
      <Slider.Root
        css={styles.sliderRoot}
        value={[currentPercentage]}
        onValueChange={handleSliderChange}
        min={0}
        max={100}
        step={1}
      >
        <Slider.Track css={styles.sliderTrack}>
          <Slider.Range css={styles.sliderRange} />
        </Slider.Track>
        <Slider.Thumb css={styles.sliderThumb} />
      </Slider.Root>

      <div css={styles.percentageMarks}>
        {PERCENTAGE_MARKS.map((mark) => (
          <button
            key={mark}
            type="button"
            css={styles.percentageMark}
            style={{ left: `${mark}%` }}
            onClick={() => handleSliderChange([mark])}
          >
            {mark}%
          </button>
        ))}
      </div>
    </div>
  );
};

const PERCENTAGE_MARKS = [0, 25, 50, 75, 100];
