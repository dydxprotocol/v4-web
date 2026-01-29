import type { FC } from 'react';
import { $decimalValue } from 'fuel-ts-sdk';
import { formatCurrency } from '@/lib/formatCurrency';
import { useSdkQuery } from '@/lib/fuel-ts-sdk';
import { propify } from '@/lib/propify';
import { MarketStat } from './_MarketStatsBase';

export const VolumeStat: FC = () => {
  const volume24h = useSdkQuery((sdk) => sdk.trading.getWatchedAssetMarketStats()?.volume24h);

  if (!volume24h) return <_VolumeStat value="$--" />;

  const value = $decimalValue(volume24h).toFloat();
  const formatted = formatCurrency(value, { compact: true, symbol: '$' });

  return <_VolumeStat value={formatted} />;
};

const _VolumeStat = propify(MarketStat, { label: '24H Volume' });
