import { OraclePrice } from '@/shared/models/decimals';
import { AssetId } from '@/shared/types';
import { createAsyncThunk } from '@reduxjs/toolkit';

import { MarketRepository } from '../../port';

export const fetchOraclePrice = createAsyncThunk<
  { assetId: AssetId; price: OraclePrice },
  AssetId,
  { rejectValue: string; extra: OraclePricesThunkExtra }
>('markets/fetchOraclePrice', async (assetId, { rejectWithValue, extra }) => {
  try {
    const price = await extra.marketRepository.getOraclePrice(assetId);
    return { assetId, price };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

export const fetchOraclePrices = createAsyncThunk<
  Array<{ assetId: AssetId; price: OraclePrice }>,
  AssetId[],
  { rejectValue: string; extra: OraclePricesThunkExtra }
>('markets/fetchOraclePrices', async (assetIds, { rejectWithValue, extra }) => {
  try {
    const pricesMap = await extra.marketRepository.getOraclePrices(assetIds);
    const prices: Array<{ assetId: AssetId; price: OraclePrice }> = [];
    pricesMap.forEach((price, assetId) => {
      prices.push({ assetId, price });
    });
    return prices;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

export interface OraclePricesThunkExtra {
  marketRepository: MarketRepository;
}
