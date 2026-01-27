import type { FC } from 'react';
import { $decimalValue } from 'fuel-ts-sdk';
import { calculateUnrealizedPnl } from 'fuel-ts-sdk/trading';
import { formatCurrency } from '@/lib/formatCurrency';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useRequiredContext } from '@/lib/useRequiredContext';
import { PositionCardContext } from '../lib/PositionCardContext';
import * as $ from './PositionPnL.css';

export const PositionPnL: FC = () => {
  const position = useRequiredContext(PositionCardContext);
  const tradingSdk = useTradingSdk();
  const markPrice = useSdkQuery(() => tradingSdk.getAssetLatestPrice(position.assetId));

  const sizeValue = $decimalValue(position.size).toFloat();
  const pnl = markPrice ? calculateUnrealizedPnl(position, markPrice.value) : null;
  const pnlValue = pnl ? $decimalValue(pnl).toFloat() : null;
  const pnlPercent = pnlValue !== null && sizeValue > 0 ? (pnlValue / sizeValue) * 100 : null;
  const profitable = pnlValue !== null ? isProfitable(pnlValue) : null;

  const colorStyle = profitable === null ? $.muted : profitable ? $.positive : $.negative;

  return (
    <div css={$.root}>
      <div css={[$.amount, colorStyle]}>
        {pnlValue !== null ? `${pnlValue >= 0 ? '+' : ''}$${formatCurrency(pnlValue)}` : '—'}
      </div>
      <div css={[$.percentage, colorStyle]}>
        {pnlPercent !== null ? `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%` : '—'}
      </div>
    </div>
  );
};

function isProfitable(pnlValue: number): boolean {
  return pnlValue >= 0;
}
