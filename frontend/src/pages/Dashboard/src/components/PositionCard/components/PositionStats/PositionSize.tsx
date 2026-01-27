import type { FC } from 'react';
import { $decimalValue } from 'fuel-ts-sdk';
import { formatNumber } from '@/lib/formatCurrency';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useRequiredContext } from '@/lib/useRequiredContext';
import { PositionCardContext } from '../../lib/PositionCardContext';
import { _PositionStatsBase } from './_PositionStatsBase';

export const PositionSize: FC = () => {
  const position = useRequiredContext(PositionCardContext);
  const tradingSdk = useTradingSdk();
  const asset = useSdkQuery(() => tradingSdk.getAssetById(position.assetId));
  const markPrice = useSdkQuery(() => tradingSdk.getAssetLatestPrice(position.assetId));

  const sizeValue = $decimalValue(position.size).toFloat();
  const collateralValue = $decimalValue(position.collateral).toFloat();
  const markPriceValue = markPrice ? $decimalValue(markPrice.value).toFloat() : null;

  const quantity = markPriceValue && markPriceValue > 0 ? sizeValue / markPriceValue : null;
  const leverage = collateralValue > 0 ? sizeValue / collateralValue : 0;

  const baseAsset = asset?.name?.split('/')[0];

  return (
    <_PositionStatsBase
      label={baseAsset ? `Size (${baseAsset})` : 'Size'}
      value={quantity !== null ? formatNumber(quantity, { decimals: 4 }) : null}
      prefix=""
      secondaryValue={`${leverage.toFixed(1)}x`}
    />
  );
};
