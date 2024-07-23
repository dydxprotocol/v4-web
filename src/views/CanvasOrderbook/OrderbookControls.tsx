import { useCallback } from 'react';

import { clamp } from 'lodash';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { MarketOrderbookGrouping, Nullable, OrderbookGrouping } from '@/constants/abacus';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { USD_DECIMALS } from '@/constants/numbers';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';
import { ToggleGroup } from '@/components/ToggleGroup';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketConfig } from '@/state/perpetualsSelectors';

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
  const currentMarketConfig = useAppSelector(getCurrentMarketConfig, shallowEqual);
  const tickSizeDecimals = currentMarketConfig?.tickSizeDecimals ?? USD_DECIMALS;

  return (
    <$OrderbookControlsContainer className={className}>
      <div tw="flex justify-between gap-0.5">
        <div tw="flex gap-0.5">
          <$ButtonGroup>
            <Button
              size={ButtonSize.XSmall}
              shape={ButtonShape.Square}
              onClick={() => modifyScale(-1)}
            >
              <span tw="-mt-0.125">-</span>
            </Button>
            <Button
              size={ButtonSize.XSmall}
              shape={ButtonShape.Square}
              onClick={() => modifyScale(1)}
            >
              +
            </Button>
          </$ButtonGroup>
          <Output
            value={grouping?.tickSize}
            type={OutputType.Fiat}
            fractionDigits={tickSizeDecimals === 1 ? 2 : tickSizeDecimals}
          />
        </div>
        <ToggleGroup
          items={[
            { label: assetName ?? '', value: 'asset' as const },
            { label: 'USD', value: 'fiat' as const },
          ]}
          shape={ButtonShape.Rectangle}
          value={selectedUnit}
          onValueChange={setSelectedUnit}
        />
      </div>
    </$OrderbookControlsContainer>
  );
};

const $OrderbookControlsContainer = styled.div`
  color: var(--color-text-0);
  font: var(--font-small-book);

  display: flex;
  flex-direction: column;

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
