import type { FC } from 'react';
import { $decimalValue } from 'fuel-ts-sdk';
import { formatCurrency } from '@/lib/formatCurrency';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useRequiredContext } from '@/lib/useRequiredContext';
import { PositionCardContext } from '../../lib/PositionCardContext';
import { _PositionStatsBase } from './_PositionStatsBase';

export const PositionSize: FC = () => {
  const position = useRequiredContext(PositionCardContext);
  const tradingSdk = useTradingSdk();
  const asset = useSdkQuery(() => tradingSdk.getAssetById(position.assetId));

  const sizeValue = $decimalValue(position.size).toFloat();
  const collateralValue = $decimalValue(position.collateral).toFloat();

  const leverage = collateralValue > 0 ? sizeValue / collateralValue : 0;

  const baseAsset = asset?.name?.split('/')[0];

  const size = useSdkQuery((sdk) => sdk.trading.getPositionSizeInQuoteAsset(position.stableId));

  if (size == null) {
    return (
      <_PositionStatsBase
        label={baseAsset ? `Size (${baseAsset})` : 'Size'}
        value="$--"
        prefix=""
        secondaryValue={`${leverage.toFixed(1)}x`}
      />
    );
  }

  return (
    <_PositionStatsBase
      label={baseAsset ? `Size (${baseAsset})` : 'Size'}
      value={formatCurrency($decimalValue(size).toDecimalString(), { compact: true })}
      prefix=""
      secondaryValue={`${leverage.toFixed(1)}x`}
    />
  );
};
