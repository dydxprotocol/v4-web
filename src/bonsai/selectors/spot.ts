import { last } from 'lodash';

import { createAppSelector } from '@/state/appTypes';

import {
  selectRawSpotCandles,
  selectRawSpotCandlesLoading,
  selectRawSpotSolPrice,
  selectRawSpotSolPriceLoading,
  selectRawSpotTokenMetadata,
  selectRawSpotTokenMetadataLoading,
  selectRawSpotTokenPrice,
  selectRawSpotTokenPriceLoading,
  selectRawSpotWalletPositions,
  selectRawSpotWalletPositionsLoading,
} from './base';

export const selectSpotTokenPrice = createAppSelector(
  [selectRawSpotTokenPrice],
  (tokenPrice) => tokenPrice?.price
);

export const selectSpotTokenPriceLoading = createAppSelector(
  [selectRawSpotTokenPriceLoading],
  (loading) => loading
);

export const selectSpotSolPrice = createAppSelector(
  [selectRawSpotSolPrice],
  (solPrice) => solPrice?.price
);

export const selectSpotSolPriceLoading = createAppSelector(
  [selectRawSpotSolPriceLoading],
  (loading) => loading
);

export const selectSpotTokenMetadata = createAppSelector(
  [selectRawSpotTokenMetadata],
  (tokenMetadata) => tokenMetadata?.tokenInfo
);

export const selectSpotTokenMetadataLoading = createAppSelector(
  [selectRawSpotTokenMetadataLoading],
  (loading) => loading
);

export const selectSpotCandles = createAppSelector(
  [selectRawSpotCandles],
  (candles) => candles ?? []
);

export const selectSpotCandlesLoading = createAppSelector(
  [selectRawSpotCandlesLoading],
  (loading) => loading
);

export const selectLatestSpotCandle = createAppSelector([selectSpotCandles], (candles) => {
  return last(candles);
});

export const selectSpotCandlePrice = createAppSelector([selectLatestSpotCandle], (candle) => {
  return candle?.c;
});

export const selectSpotWalletPositions = createAppSelector(
  [selectRawSpotWalletPositions],
  (walletPositions) => walletPositions
);

export const selectSpotWalletPositionsLoading = createAppSelector(
  [selectRawSpotWalletPositionsLoading],
  (loading) => loading
);

export const selectSpotPositions = createAppSelector(
  [selectSpotWalletPositions],
  (walletPositions) => walletPositions?.positions ?? []
);
