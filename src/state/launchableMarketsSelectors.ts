import { EMPTY_ARR } from '@/constants/objects';

import { type RootState } from './_store';

/**
 *
 * @param marketId
 * @param resolution
 * @returns TradingViewBar data for specified marketId and resolution
 */
export const getMetadataServiceBarsForPriceChart = (
  state: RootState,
  marketId: string,
  resolution: string
) => state.launchableMarkets.candles?.[marketId]?.data?.[resolution] ?? EMPTY_ARR;

/**
 *
 * @param marketId
 * @returns TvChart resolution for specified marketId
 */
export const getSelectedResolutionForUnlaunchedMarket = (state: RootState, marketId: string) =>
  state.launchableMarkets.candles?.[marketId]?.selectedResolution;
