import { IndexerPerpetualMarketResponseObject } from '@/types/indexer/indexerApiGen';
import { mapValues } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';

import { MaybeBigNumber } from '@/lib/numbers';

import { MarketsData } from '../rawTypes';
import { MarketInfo, MarketsInfo } from '../summaryTypes';

export function calculateAllMarkets(markets: MarketsData | undefined): MarketsInfo | undefined {
  if (markets == null) {
    return markets;
  }
  return mapValues(markets, calculateMarket);
}

const calculateMarket = weakMapMemoize(
  (market: IndexerPerpetualMarketResponseObject): MarketInfo => ({
    ...market,
    stepSizeDecimals: MaybeBigNumber(market.stepSize)?.decimalPlaces() ?? TOKEN_DECIMALS,
    tickSizeDecimals: MaybeBigNumber(market.tickSize)?.decimalPlaces() ?? USD_DECIMALS,
  })
);
