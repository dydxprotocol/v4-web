import { createAsyncThunk } from '@reduxjs/toolkit';
import { $decimalValue } from '@sdk/shared/models/DecimalValue';
import type { AssetId } from '@sdk/shared/types';
import type {
  AssetPriceRepository,
  MarketStatsEntity,
  MarketStatsRepository,
} from '../../../domain';

export interface MarketStatsThunkExtra {
  marketStatsRepository: MarketStatsRepository;
  assetPriceRepository: AssetPriceRepository;
}

export const asyncFetchMarketStatsByAssetIdThunk = createAsyncThunk<
  MarketStatsEntity | undefined,
  AssetId,
  { rejectValue: string; extra: MarketStatsThunkExtra }
>('markets/marketStats/fetchByAssetId', async (assetId, { rejectWithValue, extra }) => {
  try {
    const [baseStats, priceChange24h] = await Promise.all([
      extra.marketStatsRepository.getMarketStatsByAssetId(assetId),
      computePriceChange24h(extra.assetPriceRepository, assetId),
    ]);

    if (!baseStats) return undefined;

    return { ...baseStats, priceChange24h };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

async function computePriceChange24h(
  assetPriceRepository: AssetPriceRepository,
  assetId: AssetId
): Promise<number | null> {
  const [currentPrice, historicalPrices] = await Promise.all([
    assetPriceRepository.getCurrentAssetPrice(assetId),
    assetPriceRepository.getHistoricalAssetPrices({
      asset: assetId,
      timestampLte: Math.floor(Date.now() / 1000) - SECONDS_IN_24H,
      limit: 1,
      orderBy: 'TIMESTAMP_DESC',
    }),
  ]);

  const price24hAgo = historicalPrices.at(0);
  if (!currentPrice || !price24hAgo) return null;

  const current = $decimalValue(currentPrice.value).toFloat();
  const old = $decimalValue(price24hAgo.value).toFloat();

  if (old === 0) return null;
  return (current - old) / old;
}

const SECONDS_IN_24H = 86400;
