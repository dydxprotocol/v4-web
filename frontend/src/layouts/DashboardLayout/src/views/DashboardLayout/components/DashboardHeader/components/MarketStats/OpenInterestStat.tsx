import type { FC } from 'react';
import { $decimalValue } from 'fuel-ts-sdk';
import { formatCurrency } from '@/lib/formatCurrency';
import { useSdkQuery } from '@/lib/fuel-ts-sdk';
import { propify } from '@/lib/propify';
import { MarketStat } from './_MarketStatsBase';

export const OpenInterestStat: FC = () => {
  const openInterest = useSdkQuery((sdk) => sdk.trading.getWatchedAssetMarketStats());

  if (!openInterest) return <_OpenInterestStat value="$--" />;

  const longValue = $decimalValue(openInterest.openInterestLong).toFloat();
  const shortValue = $decimalValue(openInterest.openInterestShort).toFloat();

  if (!Number.isFinite(longValue) || !Number.isFinite(shortValue)) {
    return <_OpenInterestStat value="$--" />;
  }

  const total = longValue + shortValue;

  if (total === 0) return <_OpenInterestStat value="$0" />;

  const longPct = Math.round((longValue / total) * 100);
  const shortPct = 100 - longPct;
  const totalFormatted = formatCurrency(total, { compact: true, symbol: '$' });

  return <_OpenInterestStat value={`${totalFormatted} (${longPct}L/${shortPct}S)`} />;
};

const _OpenInterestStat = propify(MarketStat, { label: 'Open Interest' });
