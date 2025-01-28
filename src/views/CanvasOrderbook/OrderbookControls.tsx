import { useCallback } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { ButtonShape, ButtonSize, ButtonStyle } from '@/constants/buttons';
import { USD_DECIMALS } from '@/constants/numbers';
import { GroupingMultiplier } from '@/constants/orderbook';
import { DisplayUnit } from '@/constants/trade';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';
import { WithSeparators } from '@/components/Separator';
import { ToggleGroup } from '@/components/ToggleGroup';

import { useAppSelector } from '@/state/appTypes';
import { setDisplayUnit } from '@/state/appUiConfigs';
import { getSelectedDisplayUnit } from '@/state/appUiConfigsSelectors';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

type OrderbookControlsProps = {
  className?: string;
  assetId?: string;
  grouping: GroupingMultiplier;
  modifyGrouping: (increase: boolean) => void;
};

export const OrderbookControls = ({
  className,
  assetId,
  grouping,
  modifyGrouping,
}: OrderbookControlsProps) => {
  const dispatch = useDispatch();
  const displayUnit = useAppSelector(getSelectedDisplayUnit);
  const { tickSize, tickSizeDecimals = USD_DECIMALS } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const displayTickSize = tickSize && MustBigNumber(tickSize).times(grouping).toNumber();

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
    <$OrderbookControlsContainer className={className}>
      <div tw="flex justify-between gap-0.5">
        <div tw="flex gap-0.5">
          <$ButtonGroup>
            <$WithSeparators layout="row" withSeparators>
              <Button
                size={ButtonSize.XSmall}
                shape={ButtonShape.Square}
                buttonStyle={ButtonStyle.WithoutBackground}
                onClick={() => modifyGrouping(false)}
              >
                -
              </Button>
              <Button
                size={ButtonSize.XSmall}
                shape={ButtonShape.Square}
                buttonStyle={ButtonStyle.WithoutBackground}
                onClick={() => modifyGrouping(true)}
              >
                +
              </Button>
            </$WithSeparators>
          </$ButtonGroup>
          <Output
            withSubscript
            value={displayTickSize}
            type={OutputType.Fiat}
            fractionDigits={tickSizeDecimals === 1 ? 2 : tickSizeDecimals}
          />
        </div>
        {assetId && (
          <ToggleGroup
            withSeparators
            items={[
              { label: getDisplayableAssetFromBaseAsset(assetId), value: DisplayUnit.Asset },
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

const $WithSeparators = styled(WithSeparators)`
  --separatorHeight-padding: 0.5rem;
`;

const $ButtonGroup = styled.div`
  display: flex;
  gap: 0.25rem;
  > button {
    --button-font: var(--font-medium-book);

    --button-textColor: var(--color-text-2);
    --button-padding: 0 0.5rem;
    --button-width: min-content;
  }
`;
