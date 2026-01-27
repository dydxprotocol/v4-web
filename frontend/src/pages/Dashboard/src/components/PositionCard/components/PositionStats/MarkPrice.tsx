import type { FC } from 'react';
import { $decimalValue } from 'fuel-ts-sdk';
import { formatCurrency } from '@/lib/formatCurrency';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useRequiredContext } from '@/lib/useRequiredContext';
import { PositionCardContext } from '../../lib/PositionCardContext';
import { _PositionStatsBase } from './_PositionStatsBase';

export const MarkPrice: FC = () => {
  const position = useRequiredContext(PositionCardContext);
  const tradingSdk = useTradingSdk();
  const markPrice = useSdkQuery(() => tradingSdk.getAssetLatestPrice(position.assetId));

  const markPriceValue = markPrice
    ? $decimalValue(markPrice.value).toFloat().pipe(formatCurrency)
    : null;

  return <_PositionStatsBase label="Mark" value={markPriceValue} />;
};
