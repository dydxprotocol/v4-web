import { PartialBy } from '@/lib/typeUtils';

import {
  IndexerAPIOrderStatus,
  IndexerAPITimeInForce,
  IndexerAssetPositionResponseObject,
  IndexerCandleResponseObject,
  IndexerFillType,
  IndexerHistoricalBlockTradingReward,
  IndexerIsoString,
  IndexerLiquidity,
  IndexerMarketType,
  IndexerOrderbookResponseObject,
  IndexerOrderResponseObject,
  IndexerOrderSide,
  IndexerOrderType,
  IndexerParentSubaccountResponse,
  IndexerPerpetualMarketResponseObject,
  IndexerPerpetualMarketStatus,
  IndexerPerpetualMarketType,
  IndexerPerpetualPositionResponseObject,
  IndexerTradeResponseObject,
  IndexerTransferResponseObject,
} from './indexerApiGen';

export interface IndexerCompositeFillResponse {
  pageSize?: number;
  totalResults?: number;
  offset?: number;
  fills?: IndexerCompositeFillObject[];
}

export interface IndexerCompositeOrderObject {
  id: string;
  subaccountId?: string;
  clientId?: string;
  clobPairId?: string;
  side: IndexerOrderSide;
  size: string;
  totalFilled: string;
  price: string;
  type: IndexerOrderType;
  reduceOnly?: boolean;
  orderFlags?: string;
  goodTilBlock?: string | null;
  goodTilBlockTime?: string | null;
  createdAtHeight?: string | null;
  clientMetadata?: string;
  triggerPrice?: string | null;
  timeInForce?: IndexerAPITimeInForce;
  status?: IndexerAPIOrderStatus;
  postOnly?: boolean;
  ticker: string;
  updatedAt?: IndexerIsoString | null;
  updatedAtHeight?: string | null;
  subaccountNumber: number;
  removalReason?: string;
  totalOptimisticFilled?: string;
}

export interface IndexerCompositeMarketObject {
  clobPairId?: string;
  ticker?: string;
  status?: IndexerPerpetualMarketStatus;
  oraclePrice?: string;
  priceChange24H?: string;
  volume24H?: string;
  trades24H?: number;
  nextFundingRate?: string;
  initialMarginFraction?: string;
  maintenanceMarginFraction?: string;
  openInterest?: string;
  atomicResolution?: number;
  quantumConversionExponent?: number;
  tickSize?: string;
  stepSize?: string;
  stepBaseQuantums?: number;
  subticksPerTick?: number;
  marketType?: IndexerPerpetualMarketType;
  openInterestLowerCap?: string;
  openInterestUpperCap?: string;
  baseOpenInterest?: string;
  id?: string;
  marketId?: number;
  baseAsset?: string;
  quoteAsset?: string;
  basePositionSize?: string;
  incrementalPositionSize?: string;
  maxPositionSize?: string;
  incrementalInitialMarginFraction?: string;
}

// just make oraclePrice optional
export type IndexerWsBaseMarketObject = Omit<
  IndexerPerpetualMarketResponseObject,
  'oraclePrice'
> & { oraclePrice?: string | null };

export interface IndexerWsPerpetualMarketResponse {
  markets: { [key: string]: IndexerWsBaseMarketObject };
}

export interface IndexerWsOrderbookSubscribedMessage {
  channel: 'v4_orderbook';
  connection_id: string;
  contents: IndexerOrderbookResponseObject;
  id: string;
  message_id: number;
  type: 'subscribed';
}

export interface IndexerWsOrderbookChannelBatchDataMessage {
  channel: 'v4_orderbook';
  connection_id: string;
  contents: IndexerWsOrderbookUpdateResponse[];
  id: string;
  message_id: number;
  type: 'channel_batch_data';
  version: string;
}

export interface IndexerWsOrderbookUpdateResponse {
  asks?: IndexerWsOrderbookUpdateItem[];
  bids?: IndexerWsOrderbookUpdateItem[];
}

export type IndexerWsOrderbookUpdateItem = [string, string];

export type IndexerSparklineResponseObject = { [marketId: string]: string[] };

export interface IndexerWsMarketUpdateResponse {
  trading?: { [key: string]: IndexerCompositeMarketObject };
  oraclePrices?: { [key: string]: IndexerWsMarketOraclePriceObject };
}

export interface IndexerWsMarketOraclePriceObject {
  oraclePrice?: string;
  effectiveAt?: IndexerIsoString;
  effectiveAtHeight?: string;
  marketId?: number;
}

export interface IndexerCompositeFillObject {
  id?: string;
  side?: IndexerOrderSide;
  liquidity?: IndexerLiquidity;
  type?: IndexerFillType;
  marketType?: IndexerMarketType;
  price?: string;
  size?: string;
  fee?: string;
  affiliateRevShare?: string;
  createdAt?: IndexerIsoString;
  createdAtHeight?: string;
  orderId?: string | null;
  clientMetadata?: string | null;
  subaccountNumber?: number;
  market?: string;
}

export interface IndexerWsParentSubaccountSubscribedResponse {
  subaccount: IndexerParentSubaccountResponse;
  blockHeight: string;
  orders: IndexerOrderResponseObject[];
}

export type IndexerWsAssetUpdate = Partial<IndexerAssetPositionResponseObject> & {
  subaccountNumber: number;
  symbol: string;
};
export type IndexerWsPositionUpdate = Partial<IndexerPerpetualPositionResponseObject> & {
  subaccountNumber: number;
  market: string;
};

export type IndexerWsOrderUpdate = Partial<
  Omit<IndexerCompositeOrderObject, 'subaccountNumber'>
> & { id: string };

export type IndexerTransferCommonResponseObject = Omit<IndexerTransferResponseObject, 'id'>;

export interface IndexerWsParentSubaccountUpdateObject {
  blockHeight: string;
  assetPositions?: Array<IndexerAssetPositionResponseObject | IndexerWsAssetUpdate>;
  perpetualPositions?: Array<IndexerPerpetualPositionResponseObject | IndexerWsPositionUpdate>;
  tradingReward?: IndexerHistoricalBlockTradingReward;
  fills?: IndexerCompositeFillObject[];
  orders?: Array<IndexerWsOrderUpdate | IndexerCompositeOrderObject>;
  transfers?: IndexerTransferCommonResponseObject;
}

// hacking around backend types not quite matching what the websocket sends
export type IndexerWsTradeResponseObject = PartialBy<IndexerTradeResponseObject, 'createdAtHeight'>;
export interface IndexerWsTradesUpdateObject {
  trades: IndexerWsTradeResponseObject[];
}

export type IndexerWsCandleResponseObject = Omit<IndexerCandleResponseObject, 'id'>;
export interface IndexerWsCandleResponse {
  candles: Array<IndexerWsCandleResponseObject>;
}
