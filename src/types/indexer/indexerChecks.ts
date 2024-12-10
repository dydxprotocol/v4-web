import typia from 'typia';

import {
  IndexerHistoricalBlockTradingRewardsResponse,
  IndexerOrderbookResponseObject,
  IndexerParentSubaccountTransferResponse,
  IndexerPerpetualMarketResponse,
} from './indexerApiGen';
import {
  IndexerCompositeFillResponse,
  IndexerCompositeOrderObject,
  IndexerWsMarketUpdateResponse,
  IndexerWsOrderbookUpdateResponse,
  IndexerWsParentSubaccountSubscribedResponse,
  IndexerWsParentSubaccountUpdateObject,
} from './indexerManual';

export const isWsParentSubaccountSubscribed =
  typia.createAssert<IndexerWsParentSubaccountSubscribedResponse>();
export const isWsParentSubaccountUpdates =
  typia.createAssert<IndexerWsParentSubaccountUpdateObject[]>();
export const isWsPerpetualMarketResponse = typia.createAssert<IndexerPerpetualMarketResponse>();
export const isWsMarketUpdateResponses = typia.createAssert<IndexerWsMarketUpdateResponse[]>();
export const isWsOrderbookResponse = typia.createAssert<IndexerOrderbookResponseObject>();
export const isWsOrderbookUpdateResponses =
  typia.createAssert<IndexerWsOrderbookUpdateResponse[]>();
export const isParentSubaccountFillResponse = typia.createAssert<IndexerCompositeFillResponse>();
export const isParentSubaccountOrders = typia.createAssert<IndexerCompositeOrderObject[]>();
export const isParentSubaccountTransferResponse =
  typia.createAssert<IndexerParentSubaccountTransferResponse>();
export const isParentSubaccountBlockRewardResponse =
  typia.createAssert<IndexerHistoricalBlockTradingRewardsResponse>();
