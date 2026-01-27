import type { FC } from 'react';
import { $decimalValue } from 'fuel-ts-sdk';
import { formatCurrency } from '@/lib/formatCurrency';
import { useRequiredContext } from '@/lib/useRequiredContext';
import { PositionCardContext } from '../../lib/PositionCardContext';
import { _PositionStatsBase } from './_PositionStatsBase';

export const EntryPrice: FC = () => {
  const position = useRequiredContext(PositionCardContext);
  const entryPriceValue = $decimalValue(position.entryPrice).toFloat();

  return <_PositionStatsBase label="Entry" value={formatCurrency(entryPriceValue)} />;
};
