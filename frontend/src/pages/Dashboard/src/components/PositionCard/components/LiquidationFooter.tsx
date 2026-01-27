import type { FC } from 'react';
import { $decimalValue } from 'fuel-ts-sdk';
import { formatCurrency } from '@/lib/formatCurrency';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useRequiredContext } from '@/lib/useRequiredContext';
import { PositionCardContext } from '../lib/PositionCardContext';
import * as $ from './LiquidationFooter.css';

export const LiquidationFooter: FC = () => {
  const position = useRequiredContext(PositionCardContext);
  const tradingSdk = useTradingSdk();

  const markPrice = useSdkQuery(() => tradingSdk.getAssetLatestPrice(position.assetId));
  const liquidationPrice = useSdkQuery((sdk) =>
    sdk.trading.getPositionLiquidationPriceApprox(position.stableId)
  );

  const markPriceValue = markPrice ? $decimalValue(markPrice.value).toFloat() : null;
  const liquidationPriceValue = $decimalValue(liquidationPrice).toFloat();

  const liquidationDistance =
    markPriceValue && liquidationPriceValue
      ? Math.abs(((markPriceValue - liquidationPriceValue) / markPriceValue) * 100)
      : null;

  const isLiquidationClose = liquidationDistance !== null && liquidationDistance < 5;
  const isLiquidationDanger = liquidationDistance !== null && liquidationDistance < 2;

  const rootStyle = [
    $.root,
    isLiquidationDanger ? $.danger : isLiquidationClose ? $.warning : undefined,
  ];

  return (
    <div css={rootStyle}>
      <span css={$.icon}>⚠</span>
      <span css={$.label}>Liq:</span>
      <span css={$.value}>
        {liquidationPriceValue ? `$${formatCurrency(liquidationPriceValue)}` : '—'}
      </span>
      {liquidationDistance !== null && (
        <span css={$.distance}>({liquidationDistance.toFixed(1)}% away)</span>
      )}
    </div>
  );
};
