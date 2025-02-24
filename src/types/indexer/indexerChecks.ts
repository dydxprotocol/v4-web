import typia from 'typia';

import {
  IndexerHistoricalBlockTradingRewardsResponse,
  IndexerHistoricalPnlResponse,
  IndexerHistoricalTradingRewardAggregationsResponse,
  IndexerOrderbookResponseObject,
  IndexerParentSubaccountTransferResponse,
  IndexerTradeResponse,
} from './indexerApiGen';
import {
  IndexerCompositeFillResponse,
  IndexerCompositeOrderObject,
  IndexerSparklineResponseObject,
  IndexerWsBaseMarketObject,
  IndexerWsCandleResponse,
  IndexerWsCandleResponseObject,
  IndexerWsMarketUpdateResponse,
  IndexerWsOrderbookChannelBatchDataMessage,
  IndexerWsOrderbookSubscribedMessage,
  IndexerWsOrderbookUpdateResponse,
  IndexerWsParentSubaccountSubscribedResponse,
  IndexerWsParentSubaccountUpdateObject,
  IndexerWsPerpetualMarketResponse,
  IndexerWsTradesUpdateObject,
} from './indexerManual';

export const isWsParentSubaccountSubscribed =
  typia.createAssert<IndexerWsParentSubaccountSubscribedResponse>();
export const isWsParentSubaccountUpdates =
  typia.createAssert<IndexerWsParentSubaccountUpdateObject[]>();
export const isWsPerpetualMarketResponse = typia.createAssert<IndexerWsPerpetualMarketResponse>();
export const isWsBasePerpetualMarketObject = typia.createAssert<IndexerWsBaseMarketObject>();
export const isWsMarketUpdateResponses = typia.createAssert<IndexerWsMarketUpdateResponse[]>();
export const isWsOrderbookSubscribedMessage =
  typia.createAssert<IndexerWsOrderbookSubscribedMessage>();
export const isWsOrderbookChannelBatchDataMessage =
  typia.createAssert<IndexerWsOrderbookChannelBatchDataMessage>();
export const isWsOrderbookResponse = typia.createAssert<IndexerOrderbookResponseObject>();
export const isWsOrderbookUpdateResponses =
  typia.createAssert<IndexerWsOrderbookUpdateResponse[]>();
export const isWsTradesResponse = typia.createAssert<IndexerTradeResponse>();
export const isWsTradesUpdateResponses = typia.createAssert<IndexerWsTradesUpdateObject[]>();
export const isWsCandlesResponse = typia.createAssert<IndexerWsCandleResponse>();
export const isWsCandlesUpdateResponse = typia.createAssert<IndexerWsCandleResponseObject[]>();
export const isParentSubaccountFillResponse = typia.createAssert<IndexerCompositeFillResponse>();
export const isParentSubaccountOrders = typia.createAssert<IndexerCompositeOrderObject[]>();
export const isParentSubaccountTransferResponse =
  typia.createAssert<IndexerParentSubaccountTransferResponse>();
export const isParentSubaccountBlockRewardResponse =
  typia.createAssert<IndexerHistoricalBlockTradingRewardsResponse>();
export const isPerpetualMarketSparklineResponse =
  typia.createAssert<IndexerSparklineResponseObject>();
export const isIndexerHistoricalPnlResponse = typia.createAssert<IndexerHistoricalPnlResponse>();
export const isIndexerHistoricalTradingRewardAggregationResponse =
  typia.createAssert<IndexerHistoricalTradingRewardAggregationsResponse>();
