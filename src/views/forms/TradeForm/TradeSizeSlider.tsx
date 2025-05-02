import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import { useQuickUpdatingState } from '@/hooks/useQuickUpdatingState';

import { formMixins } from '@/styles/formMixins';

import { Slider } from '@/components/Slider';

import { mapIfPresent } from '@/lib/do';
import { clamp } from '@/lib/math';
import { MustBigNumber, MustNumber } from '@/lib/numbers';

export const TradeSizeSlider = ({
  tradeSizeInput,
  setTradeSizeInput,
  stepSizeDecimals,
  maxTradeSize,
  short,
}: {
  tradeSizeInput: string | undefined;
  setTradeSizeInput: (val: string | undefined) => void;
  stepSizeDecimals: number;
  maxTradeSize: number;
  short: boolean;
}) => {
  const {
    value: tradeSize,
    setValue: setTradeSize,
    commitValue: commitTradeSize,
  } = useQuickUpdatingState<string | undefined>({
    setValueSlow: setTradeSizeInput,
    slowValue: tradeSizeInput,
    debounceMs: 100,
  });

  const toNormalized = (size: number) => {
    if (maxTradeSize <= 0) {
      return 0;
    }
    return clamp((size / maxTradeSize) * 100, 0, 100);
  };
  const fromNormalized = (percent: number) => {
    if (maxTradeSize <= 0) {
      return 0;
    }
    return (clamp(percent, 0, 100) / 100) * maxTradeSize;
  };
  const toString = (x: number) => {
    return MustBigNumber(x).toFixed(stepSizeDecimals, BigNumber.ROUND_DOWN);
  };
  const fromString = (x: string) => {
    return MustNumber(x);
  };

  const onSliderDrag = ([newValue]: number[]) => {
    const newValueString = mapIfPresent(newValue, (val) => toString(fromNormalized(val)));
    setTradeSize(newValueString ?? '');
  };

  const commitValue = (newValue: string | undefined) => {
    commitTradeSize(newValue);
  };

  const onValueCommit = ([newValue]: number[]) => {
    commitValue(toString(fromNormalized(newValue ?? 0)));
  };

  return (
    <$InputContainer>
      <$TradeSizeSlider
        tw="w-full"
        label="Order Size"
        min={0}
        max={100}
        step={0.1}
        value={toNormalized(fromString(tradeSize ?? ''))}
        onSliderDrag={onSliderDrag}
        onValueCommit={onValueCommit}
        $short={short}
      />
    </$InputContainer>
  );
};

const $InputContainer = styled.div`
  ${formMixins.inputContainer}
  --input-height: 2.7rem;
  --input-backgroundColor: none;

  padding: var(--form-input-paddingY) var(--form-input-paddingX);
  padding-top: 0;
`;

const $TradeSizeSlider = styled(Slider)<{ $short: boolean }>`
  height: 1.375rem;
  --slider-track-background: linear-gradient(
    90deg,
    var(--color-layer-7) 0%,
    ${({ $short }) => ($short ? 'var(--color-negative)' : 'var(--color-positive)')} 100%
  );
`;
