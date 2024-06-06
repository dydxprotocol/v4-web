import { useCallback } from 'react';

import { clamp } from 'lodash';
import styled from 'styled-components';

import { MarketOrderbookGrouping, Nullable, OrderbookGrouping } from '@/constants/abacus';
import { ButtonShape, ButtonSize } from '@/constants/buttons';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';
import { ToggleGroup } from '@/components/ToggleGroup';

import abacusStateManager from '@/lib/abacus';

type OrderbookControlsProps = {
  className?: string;
  assetName?: string;
  selectedUnit: 'fiat' | 'asset';
  setSelectedUnit(val: 'fiat' | 'asset'): void;
  grouping: Nullable<MarketOrderbookGrouping>;
};

export const OrderbookControls = ({
  className,
  assetName,
  selectedUnit,
  setSelectedUnit,
  grouping,
}: OrderbookControlsProps) => {
  // const stringGetter = useStringGetter();
  const modifyScale = useCallback(
    (direction: number) => {
      const start = grouping?.multiplier.ordinal ?? 0;
      const end = clamp(start + direction, 0, 3);
      abacusStateManager.modifyOrderbookLevel(
        OrderbookGrouping.values().find((v) => v.ordinal === end)!
      );
    },
    [grouping?.multiplier.ordinal]
  );
  return (
    <$OrderbookControlsContainer className={className}>
      <$OrderbookUnitControl>
        {/* TODO - localization */}
        <$OrderbookLabel>Units</$OrderbookLabel>
        <ToggleGroup
          items={[
            { label: assetName ?? '', value: 'asset' as const },
            { label: 'USD', value: 'fiat' as const },
          ]}
          shape={ButtonShape.Rectangle}
          value={selectedUnit}
          onValueChange={setSelectedUnit}
        />
      </$OrderbookUnitControl>
      <$OrderbookZoomControl>
        <Output value={grouping?.tickSize} type={OutputType.Fiat} />
        <$ButtonGroup>
          <Button
            size={ButtonSize.XSmall}
            shape={ButtonShape.Square}
            onClick={() => modifyScale(1)}
          >
            -
          </Button>
          <Button
            size={ButtonSize.XSmall}
            shape={ButtonShape.Square}
            onClick={() => modifyScale(-1)}
          >
            +
          </Button>
        </$ButtonGroup>
      </$OrderbookZoomControl>
    </$OrderbookControlsContainer>
  );
};

const $OrderbookLabel = styled.div`
  display: inline-flex;
  align-items: center;
`;

const $OrderbookControlsContainer = styled.div`
  color: var(--color-text-0);
  font: var(--font-small-book);

  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: var(--border-width);
  > * {
    padding: 0.5rem;
    padding-top: 0.3rem;
    padding-bottom: 0.3rem;
  }
`;

const $ButtonGroup = styled.div`
  display: flex;
  gap: 0.25rem;
  > button {
    --button-font: var(--font-medium-book);
  }
`;

const $OrderbookUnitControl = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const $OrderbookZoomControl = styled.div`
  gap: 1rem;
  display: flex;
  justify-content: space-between;
  box-shadow: 0 0 0 var(--border-width) var(--border-color);
`;
