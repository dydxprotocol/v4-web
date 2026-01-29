import type { FC } from 'react';
import { $decimalValue } from 'fuel-ts-sdk';
import { formatCurrency, formatPercentage } from '@/lib/formatCurrency';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import * as $ from './AssetCurrentPrice.css';

export const AssetCurrentPrice: FC = () => {
  const sdk = useTradingSdk();
  const price = useSdkQuery(sdk.getWatchedAssetLatestPrice);
  const marketStats = useSdkQuery(sdk.getWatchedAssetMarketStats);

  const priceValue = price ? $decimalValue(price.value).toFloat() : 0;
  const change24h = marketStats?.priceChange24h ?? null;

  const changeStyles = [$.priceChange];
  if (change24h !== null) {
    changeStyles.push(change24h >= 0 ? $.priceChangePositive : $.priceChangeNegative);
  }

  return (
    <div css={$.priceDisplay}>
      <span css={$.price}>${formatCurrency(priceValue.toString())}</span>
      {change24h !== null && (
        <span css={changeStyles}>
          {formatPercentage(change24h, { decimals: 2, signDisplay: 'always' })}
        </span>
      )}
    </div>
  );
};
