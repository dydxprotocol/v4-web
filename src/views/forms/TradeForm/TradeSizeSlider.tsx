import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import { useQuickUpdatingState } from '@/hooks/useQuickUpdatingState';

import breakpoints from '@/styles/breakpoints';
import { formMixins } from '@/styles/formMixins';

import { Slider } from '@/components/Slider';
import { WithLabel } from '@/components/WithLabel';

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
      <$WithLabel label={<div tw="mb-0.25 flex">Order Size</div>}>
        <$TradeSizeSlider
          label="Order Size"
          min={0}
          max={100}
          step={0.1}
          value={toNormalized(fromString(tradeSize ?? ''))}
          onSliderDrag={onSliderDrag}
          onValueCommit={onValueCommit}
          $short={short}
        />
      </$WithLabel>
    </$InputContainer>
  );
};

const $InputContainer = styled.div`
  ${formMixins.inputContainer}
  --input-height: 3.5rem;
  --input-backgroundColor: none;

  padding: var(--form-input-paddingY) var(--form-input-paddingX);

  @media ${breakpoints.tablet} {
    --input-height: 4rem;
  }
`;

const $WithLabel = styled(WithLabel)`
  ${formMixins.inputLabel}
`;

const $TradeSizeSlider = styled(Slider)<{ $short: boolean }>`
  height: 1.375rem;
  --slider-track-background: linear-gradient(
    90deg,
    var(--color-layer-7) 0%,
    ${({ $short }) => ($short ? 'var(--color-negative)' : 'var(--color-positive)')} 100%
  );
`;
