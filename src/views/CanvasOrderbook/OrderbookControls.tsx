import { useCallback } from 'react';

import { clamp } from 'lodash';
import { shallowEqual, useDispatch } from 'react-redux';
import styled, { css } from 'styled-components';

import { MarketOrderbookGrouping, Nullable, OrderbookGrouping } from '@/constants/abacus';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { USD_DECIMALS } from '@/constants/numbers';
import { DisplayUnit } from '@/constants/trade';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';
import { ToggleGroup } from '@/components/ToggleGroup';

import { useAppSelector } from '@/state/appTypes';
import { setDisplayUnit } from '@/state/configs';
import { getSelectedDisplayUnit } from '@/state/configsSelectors';
import { getCurrentMarketConfig } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { testFlags } from '@/lib/testFlags';

type OrderbookControlsProps = {
  className?: string;
  assetId?: string;
  grouping: Nullable<MarketOrderbookGrouping>;
};

export const OrderbookControls = ({ className, assetId, grouping }: OrderbookControlsProps) => {
  const dispatch = useDispatch();
  const displayUnit = useAppSelector(getSelectedDisplayUnit);
  const { uiRefresh } = testFlags;

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

  const onToggleDisplayUnit = useCallback(
    (newValue: DisplayUnit) => {
      if (!assetId) return;
      dispatch(
        setDisplayUnit({
          newDisplayUnit: newValue,
          assetId,
          entryPoint: 'orderbookControls',
        })
      );
    },
    [dispatch, assetId]
  );

  return (
    <$OrderbookControlsContainer className={className} $uiRefreshEnabled={uiRefresh}>
      <div tw="flex justify-between gap-0.5">
        <div tw="flex gap-0.5">
          <Output
            value={grouping?.tickSize}
            type={OutputType.Fiat}
            fractionDigits={tickSizeDecimals === 1 ? 2 : tickSizeDecimals}
          />
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
        </div>
        {!uiRefresh && assetId && (
          <ToggleGroup
            items={[
              { label: assetId, value: DisplayUnit.Asset },
              { label: 'USD', value: DisplayUnit.Fiat },
            ]}
            shape={ButtonShape.Rectangle}
            value={displayUnit}
            onValueChange={onToggleDisplayUnit}
          />
        )}
      </div>
    </$OrderbookControlsContainer>
  );
};

const $OrderbookControlsContainer = styled.div<{ $uiRefreshEnabled: boolean }>`
  color: var(--color-text-0);
  font: var(--font-small-book);

  display: flex;
  flex-direction: column;

  > * {
    padding: 0.5rem;
    padding-top: 0.3rem;
    padding-bottom: 0.3rem;
  }

  ${({ $uiRefreshEnabled }) =>
    !$uiRefreshEnabled &&
    css`
      flex-direction: column-reverse;
    `}
`;
const $ButtonGroup = styled.div`
  display: flex;
  gap: 0.25rem;
  > button {
    --button-font: var(--font-medium-book);
  }
`;
