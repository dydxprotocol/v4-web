import {
  IndexerAPIOrderStatus,
  IndexerAPITimeInForce,
  IndexerAssetPositionResponseObject,
  IndexerFillType,
  IndexerHistoricalBlockTradingReward,
  IndexerIsoString,
  IndexerLiquidity,
  IndexerMarketType,
  IndexerOrderResponseObject,
  IndexerOrderSide,
  IndexerOrderType,
  IndexerParentSubaccountResponse,
  IndexerPerpetualMarketStatus,
  IndexerPerpetualMarketType,
  IndexerPerpetualPositionResponseObject,
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

export interface IndexerWsOrderbookUpdateResponse {
  asks?: IndexerWsOrderbookUpdateItem[];
  bids?: IndexerWsOrderbookUpdateItem[];
}

export type IndexerWsOrderbookUpdateItem = [string, string];

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
  market?: string;
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
  ticker?: string;
}

export interface IndexerWsParentSubaccountSubscribedResponse {
  subaccount: IndexerParentSubaccountResponse;
  blockHeight: string;
  orders: IndexerOrderResponseObject[];
}

export type IndexerWsAssetUpdate = Partial<IndexerAssetPositionResponseObject> & {
  subaccountNumber: number;
  assetId: string;
};
export type IndexerWsPositionUpdate = Partial<IndexerPerpetualPositionResponseObject> & {
  subaccountNumber: number;
  market: string;
};

export type IndexerWsOrderUpdate = Partial<
  Omit<IndexerCompositeOrderObject, 'subaccountNumber'>
> & { id: string };

export interface IndexerWsParentSubaccountUpdateObject {
  blockHeight: string;
  assetPositions?: Array<IndexerAssetPositionResponseObject | IndexerWsAssetUpdate>;
  perpetualPositions?: Array<IndexerPerpetualPositionResponseObject | IndexerWsPositionUpdate>;
  tradingReward?: IndexerHistoricalBlockTradingReward;
  fills?: IndexerCompositeFillObject[];
  orders?: Array<IndexerWsOrderUpdate | IndexerCompositeOrderObject>;
  transfers?: IndexerTransferResponseObject;
}
