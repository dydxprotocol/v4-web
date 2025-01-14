import typia from 'typia';

import {
  IndexerHistoricalBlockTradingRewardsResponse,
  IndexerOrderbookResponseObject,
  IndexerParentSubaccountTransferResponse,
  IndexerTradeResponse,
} from './indexerApiGen';
import {
  IndexerCompositeFillResponse,
  IndexerCompositeOrderObject,
  IndexerWsCandleResponse,
  IndexerWsCandleResponseObject,
  IndexerWsMarketUpdateResponse,
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
export const isWsMarketUpdateResponses = typia.createAssert<IndexerWsMarketUpdateResponse[]>();
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
