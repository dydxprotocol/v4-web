import { createAppSelector } from '@/state/appTypes';

import {
  selectRawSpotPortfolioTrades,
  selectRawSpotPortfolioTradesLoading,
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

export const selectSpotBalances = createAppSelector(
  [selectSpotWalletPositions],
  (walletPositions) => walletPositions?.tokenBalances ?? []
);

export const selectSpotPortfolioTrades = createAppSelector(
  [selectRawSpotPortfolioTrades],
  (portfolioTrades) => portfolioTrades ?? { trades: [], tokenData: {} }
);

export const selectSpotPortfolioTradesLoading = createAppSelector(
  [selectRawSpotPortfolioTradesLoading],
  (loading) => loading
);
