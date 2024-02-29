import { useCallback, useMemo } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import { Root, Thumb, Track } from '@radix-ui/react-slider';
import _ from 'lodash';
import styled, { AnyStyledComponent, css } from 'styled-components';

import { TradeInputField } from '@/constants/abacus';
import { PositionSide } from '@/constants/trade';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber, type BigNumberish } from '@/lib/numbers';

type ElementProps = {
  leverage?: BigNumberish | null;
  leverageInputValue: string;
  maxLeverage: BigNumberish | null;
  orderSide: OrderSide;
  positionSide: PositionSide;
  setLeverageInputValue: (value: string) => void;
};

type StyleProps = { className?: string };

export const LeverageSlider = ({
  leverage,
  leverageInputValue,
  maxLeverage,
  orderSide,
  positionSide,
  setLeverageInputValue,
  className,
}: ElementProps & StyleProps) => {
  const leverageBN = MustBigNumber(leverage);
  const maxLeverageBN = MustBigNumber(maxLeverage);
  const leverageInputBN = MustBigNumber(leverageInputValue || leverage);
  const leverageInputNumber = isNaN(leverageInputBN.toNumber()) ? 0 : leverageInputBN.toNumber();

  const sliderConfig = useMemo(
    () => ({
      [PositionSide.None]: {
        min: orderSide === OrderSide.BUY ? 0 : maxLeverageBN.negated().toNumber(),
        max: orderSide === OrderSide.BUY ? maxLeverageBN.toNumber() : 0,
        midpoint: undefined,
      },
      [PositionSide.Long]: {
        min:
          orderSide === OrderSide.BUY ? leverageBN.toNumber() : maxLeverageBN.negated().toNumber(),
        max: orderSide === OrderSide.BUY ? maxLeverageBN.toNumber() : leverageBN.toNumber(),
        midpoint:
          orderSide === OrderSide.SELL
            ? MustBigNumber(100)
                .minus(leverageBN.div(leverageBN.plus(maxLeverageBN)).times(100))
                .toNumber()
            : undefined,
      },
      [PositionSide.Short]: {
        min:
          orderSide === OrderSide.BUY ? leverageBN.toNumber() : maxLeverageBN.negated().toNumber(),
        max: orderSide === OrderSide.BUY ? maxLeverageBN.toNumber() : leverageBN.toNumber(),
        midpoint:
          orderSide === OrderSide.BUY
            ? leverageBN.abs().div(leverageBN.abs().plus(maxLeverageBN)).times(100).toNumber()
            : undefined,
      },
    }),
    [maxLeverageBN, leverageBN, orderSide, positionSide]
  );

  const { min, max, midpoint } = sliderConfig[positionSide] || {};

  // Debounced slightly to avoid excessive updates to Abacus while still providing a smooth slide
  const debouncedSetAbacusLeverage = useCallback(
    _.debounce((newLeverage: number) => {
      abacusStateManager.setTradeValue({
        value: newLeverage,
        field: TradeInputField.leverage,
      });
    }, 50),
    []
  );

  const onSliderDrag = ([newLeverage]: number[]) => {
    setLeverageInputValue(`${newLeverage}`);
    debouncedSetAbacusLeverage(newLeverage);
  };

  const onValueCommit = ([newLeverage]: number[]) => {
    setLeverageInputValue(`${newLeverage}`);

    // Ensure Abacus is updated with the latest, committed value
    debouncedSetAbacusLeverage.cancel();

    abacusStateManager.setTradeValue({
      value: newLeverage,
      field: TradeInputField.leverage,
    });
  };

  return (
    <Styled.SliderContainer midpoint={midpoint} orderSide={orderSide} className={className}>
      <Styled.Root
        aria-label="MarketLeverage"
        min={min}
        max={max}
        step={0.1}
        value={[Math.min(Math.max(leverageInputNumber, min), max)]}
        onValueChange={onSliderDrag}
        onValueCommit={onValueCommit}
      >
        <Styled.Track />
        <Styled.Thumb />
      </Styled.Root>
    </Styled.SliderContainer>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Root = styled(Root)`
  // make thumb covers the start of the track
  --radix-slider-thumb-transform: translateX(-65%) !important;

  position: relative;

  display: flex;
  align-items: center;

  user-select: none;

  height: 100%;
`;

Styled.Track = styled(Track)`
  position: relative;

  display: flex;
  flex-grow: 1;
  align-items: center;

  height: 0.5rem;
  margin-right: 0.25rem; // make thumb covers the end of the track

  cursor: pointer;

  &:before {
    content: '';
    width: 100%;
    height: 100%;

    background: linear-gradient(
        90deg,
        transparent,
        transparent 15%,
        var(--slider-backgroundColor) 15%,
        var(--slider-backgroundColor) 50%,
        transparent 50%,
        transparent 65%,
        var(--slider-backgroundColor) 65%
      )
      0 0 / 0.6rem;
  }
`;

Styled.Thumb = styled(Thumb)`
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

Styled.SliderContainer = styled.div<{ midpoint?: number; orderSide: OrderSide }>`
  --slider-backgroundColor: var(--color-layer-4);
  --slider-track-gradient-positive: linear-gradient(
    90deg,
    var(--color-layer-7),
    var(--color-positive)
  );
  --slider-track-gradient-negative: linear-gradient(
    90deg,
    var(--color-negative),
    var(--color-layer-7)
  );

  height: 1.375rem;

  ${Styled.Track} {
    ${({ midpoint, orderSide }) => css`
      background: linear-gradient(
        90deg,
        var(--color-negative) 0%,
        var(--color-layer-7)
          ${midpoint
            ? midpoint
            : orderSide === OrderSide.BUY
            ? 0
            : orderSide === OrderSide.SELL
            ? 100
            : 50}%,
        var(--color-positive) 100%
      );
    `}
  }
`;
