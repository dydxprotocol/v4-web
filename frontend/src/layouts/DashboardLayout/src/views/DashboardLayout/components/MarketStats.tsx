import type { FC } from 'react';
import { $decimalValue, OraclePrice } from 'fuel-ts-sdk';
import type { AssetPriceEntity, Candle } from 'fuel-ts-sdk/trading';
import { formatCurrency, formatPercentage } from '@/lib/formatCurrency';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { propify } from '@/lib/propify';
import { AssetSelect } from './AssetSelect';
import * as styles from './MarketStats.css';

export const MarketStats: FC = () => {
  const sdk = useTradingSdk();
  const watchedAsset = useSdkQuery(sdk.getWatchedAsset);
  const price = useSdkQuery(sdk.getWatchedAssetLatestPrice);
  const candles = useSdkQuery(() =>
    watchedAsset ? sdk.getCandles(watchedAsset.assetId, 'D1') : []
  );

  const change24h = calculatePriceChange(price, candles);
  const priceValue = price ? $decimalValue(price.value).toFloat() : 0;

  const changeStyles = [styles.priceChange];
  if (change24h !== null) {
    changeStyles.push(change24h >= 0 ? styles.priceChangePositive : styles.priceChangeNegative);
  }

  return (
    <div css={styles.container}>
      <div css={styles.assetSection}>
        <AssetSelect />
        <div css={styles.priceDisplay}>
          <span css={styles.price}>{formatCurrency(priceValue, { symbol: '$', decimals: 2 })}</span>
          {change24h !== null && (
            <span css={changeStyles}>
              {formatPercentage(change24h, { decimals: 2, signDisplay: 'always' })}
            </span>
          )}
        </div>
      </div>

      <div css={styles.separator} />

      <div css={styles.statsSection}>
        <OpenInterestStat value="$--" />
        <VolumeStat value="$--" />
        <FundingRateStat value="--" />
      </div>
    </div>
  );
};

export const OpenInterestStat = propify(MarketStat, { label: 'Open Interest' });
export const VolumeStat = propify(MarketStat, { label: '24h Volume' });
export const FundingRateStat = propify(MarketStat, { label: 'Funding / 1h' });

type MarketStatProps = {
  label: string;
  value: string;
  variant?: 'default' | 'positive' | 'negative';
};

function MarketStat({ label, value, variant = 'default' }: MarketStatProps) {
  const valueStyles = [styles.statValue];
  if (variant === 'positive') valueStyles.push(styles.statValuePositive);
  if (variant === 'negative') valueStyles.push(styles.statValueNegative);

  return (
    <div css={styles.stat}>
      <span css={styles.statLabel}>{label}</span>
      <span css={valueStyles}>{value}</span>
    </div>
  );
}

function calculatePriceChange(
  currentPrice: AssetPriceEntity | undefined,
  candles: Candle[] | undefined
): number | null {
  if (!currentPrice || !candles || candles.length === 0) return null;

  const current = $decimalValue(currentPrice.value).toFloat();
  const openCandle = candles[candles.length - 1]; // oldest candle (24h ago)
  const open = $decimalValue(OraclePrice.fromBigIntString(openCandle.openPrice)).toFloat();

  if (open === 0) return null;
  return (current - open) / open;
}
