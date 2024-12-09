/**
 *
 * @export
 * @interface APIOrderStatus
 */
export type IndexerAPIOrderStatus = IndexerOrderStatus | IndexerBestEffortOpenedStatus;
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerAPITimeInForce {
  GTT = 'GTT',
  FOK = 'FOK',
  IOC = 'IOC',
}
/**
 *
 * @export
 * @interface AddressRegisterTokenBody
 */
export interface IndexerAddressRegisterTokenBody {
  /**
   *
   * @type {string}
   * @memberof AddressRegisterTokenBody
   */
  language: string;
  /**
   *
   * @type {string}
   * @memberof AddressRegisterTokenBody
   */
  token: string;
}
/**
 *
 * @export
 * @interface AddressResponse
 */
export interface IndexerAddressResponse {
  /**
   *
   * @type {Array<IndexerSubaccountResponseObject>}
   * @memberof AddressResponse
   */
  subaccounts: Array<IndexerSubaccountResponseObject>;
  /**
   *
   * @type {string}
   * @memberof AddressResponse
   */
  totalTradingRewards: string;
}
/**
 *
 * @export
 * @interface AffiliateAddressResponse
 */
export interface IndexerAffiliateAddressResponse {
  /**
   *
   * @type {string}
   * @memberof AffiliateAddressResponse
   */
  address: string;
}
/**
 *
 * @export
 * @interface AffiliateMetadataResponse
 */
export interface IndexerAffiliateMetadataResponse {
  /**
   *
   * @type {string}
   * @memberof AffiliateMetadataResponse
   */
  referralCode: string;
  /**
   *
   * @type {boolean}
   * @memberof AffiliateMetadataResponse
   */
  isVolumeEligible: boolean;
  /**
   *
   * @type {boolean}
   * @memberof AffiliateMetadataResponse
   */
  isAffiliate: boolean;
}
/**
 *
 * @export
 * @interface AffiliateSnapshotResponse
 */
export interface IndexerAffiliateSnapshotResponse {
  /**
   *
   * @type {Array<IndexerAffiliateSnapshotResponseObject>}
   * @memberof AffiliateSnapshotResponse
   */
  affiliateList: Array<IndexerAffiliateSnapshotResponseObject>;
  /**
   *
   * @type {number}
   * @memberof AffiliateSnapshotResponse
   */
  total: number;
  /**
   *
   * @type {number}
   * @memberof AffiliateSnapshotResponse
   */
  currentOffset: number;
}
/**
 *
 * @export
 * @interface AffiliateSnapshotResponseObject
 */
export interface IndexerAffiliateSnapshotResponseObject {
  /**
   *
   * @type {string}
   * @memberof AffiliateSnapshotResponseObject
   */
  affiliateAddress: string;
  /**
   *
   * @type {string}
   * @memberof AffiliateSnapshotResponseObject
   */
  affiliateReferralCode: string;
  /**
   *
   * @type {number}
   * @memberof AffiliateSnapshotResponseObject
   */
  affiliateEarnings: number;
  /**
   *
   * @type {number}
   * @memberof AffiliateSnapshotResponseObject
   */
  affiliateReferredTrades: number;
  /**
   *
   * @type {number}
   * @memberof AffiliateSnapshotResponseObject
   */
  affiliateTotalReferredFees: number;
  /**
   *
   * @type {number}
   * @memberof AffiliateSnapshotResponseObject
   */
  affiliateReferredUsers: number;
  /**
   *
   * @type {number}
   * @memberof AffiliateSnapshotResponseObject
   */
  affiliateReferredNetProtocolEarnings: number;
  /**
   *
   * @type {number}
   * @memberof AffiliateSnapshotResponseObject
   */
  affiliateReferredTotalVolume: number;
  /**
   *
   * @type {number}
   * @memberof AffiliateSnapshotResponseObject
   */
  affiliateReferredMakerFees: number;
  /**
   *
   * @type {number}
   * @memberof AffiliateSnapshotResponseObject
   */
  affiliateReferredTakerFees: number;
  /**
   *
   * @type {number}
   * @memberof AffiliateSnapshotResponseObject
   */
  affiliateReferredMakerRebates: number;
}
/**
 *
 * @export
 * @interface AffiliateTotalVolumeResponse
 */
export interface IndexerAffiliateTotalVolumeResponse {
  /**
   *
   * @type {number}
   * @memberof AffiliateTotalVolumeResponse
   */
  totalVolume: number;
}
/**
 *
 * @export
 * @interface AssetPositionResponse
 */
export interface IndexerAssetPositionResponse {
  /**
   *
   * @type {Array<IndexerAssetPositionResponseObject>}
   * @memberof AssetPositionResponse
   */
  positions: Array<IndexerAssetPositionResponseObject>;
}
/**
 *
 * @export
 * @interface AssetPositionResponseObject
 */
export interface IndexerAssetPositionResponseObject {
  /**
   *
   * @type {string}
   * @memberof AssetPositionResponseObject
   */
  symbol: string;
  /**
   *
   * @type {IndexerPositionSide}
   * @memberof AssetPositionResponseObject
   */
  side: IndexerPositionSide;
  /**
   *
   * @type {string}
   * @memberof AssetPositionResponseObject
   */
  size: string;
  /**
   *
   * @type {string}
   * @memberof AssetPositionResponseObject
   */
  assetId: string;
  /**
   *
   * @type {number}
   * @memberof AssetPositionResponseObject
   */
  subaccountNumber: number;
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerBestEffortOpenedStatus {
  BESTEFFORTOPENED = 'BEST_EFFORT_OPENED',
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerCandleResolution {
  _1MIN = '1MIN',
  _5MINS = '5MINS',
  _15MINS = '15MINS',
  _30MINS = '30MINS',
  _1HOUR = '1HOUR',
  _4HOURS = '4HOURS',
  _1DAY = '1DAY',
}
/**
 *
 * @export
 * @interface CandleResponse
 */
export interface IndexerCandleResponse {
  /**
   *
   * @type {Array<IndexerCandleResponseObject>}
   * @memberof CandleResponse
   */
  candles: Array<IndexerCandleResponseObject>;
}
/**
 *
 * @export
 * @interface CandleResponseObject
 */
export interface IndexerCandleResponseObject {
  /**
   *
   * @type {IndexerIsoString}
   * @memberof CandleResponseObject
   */
  startedAt: IndexerIsoString;
  /**
   *
   * @type {string}
   * @memberof CandleResponseObject
   */
  ticker: string;
  /**
   *
   * @type {IndexerCandleResolution}
   * @memberof CandleResponseObject
   */
  resolution: IndexerCandleResolution;
  /**
   *
   * @type {string}
   * @memberof CandleResponseObject
   */
  low: string;
  /**
   *
   * @type {string}
   * @memberof CandleResponseObject
   */
  high: string;
  /**
   *
   * @type {string}
   * @memberof CandleResponseObject
   */
  open: string;
  /**
   *
   * @type {string}
   * @memberof CandleResponseObject
   */
  close: string;
  /**
   *
   * @type {string}
   * @memberof CandleResponseObject
   */
  baseTokenVolume: string;
  /**
   *
   * @type {string}
   * @memberof CandleResponseObject
   */
  usdVolume: string;
  /**
   *
   * @type {number}
   * @memberof CandleResponseObject
   */
  trades: number;
  /**
   *
   * @type {string}
   * @memberof CandleResponseObject
   */
  startingOpenInterest: string;
  /**
   *
   * @type {string}
   * @memberof CandleResponseObject
   */
  orderbookMidPriceOpen?: string | null;
  /**
   *
   * @type {string}
   * @memberof CandleResponseObject
   */
  orderbookMidPriceClose?: string | null;
  /**
   *
   * @type {string}
   * @memberof CandleResponseObject
   */
  id: string;
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerComplianceReason {
  MANUAL = 'MANUAL',
  USGEO = 'US_GEO',
  CAGEO = 'CA_GEO',
  GBGEO = 'GB_GEO',
  SANCTIONEDGEO = 'SANCTIONED_GEO',
  COMPLIANCEPROVIDER = 'COMPLIANCE_PROVIDER',
}
/**
 *
 * @export
 * @interface ComplianceResponse
 */
export interface IndexerComplianceResponse {
  /**
   *
   * @type {boolean}
   * @memberof ComplianceResponse
   */
  restricted: boolean;
  /**
   *
   * @type {string}
   * @memberof ComplianceResponse
   */
  reason?: string | null;
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  FIRSTSTRIKECLOSEONLY = 'FIRST_STRIKE_CLOSE_ONLY',
  FIRSTSTRIKE = 'FIRST_STRIKE',
  CLOSEONLY = 'CLOSE_ONLY',
  BLOCKED = 'BLOCKED',
}
/**
 *
 * @export
 * @interface ComplianceV2Response
 */
export interface IndexerComplianceV2Response {
  /**
   *
   * @type {IndexerComplianceStatus}
   * @memberof ComplianceV2Response
   */
  status: IndexerComplianceStatus;
  /**
   *
   * @type {IndexerComplianceReason}
   * @memberof ComplianceV2Response
   */
  reason?: IndexerComplianceReason | null;
  /**
   *
   * @type {string}
   * @memberof ComplianceV2Response
   */
  updatedAt?: string | null;
}
/**
 *
 * @export
 * @interface FillResponse
 */
export interface IndexerFillResponse {
  /**
   *
   * @type {number}
   * @memberof FillResponse
   */
  pageSize?: number | null;
  /**
   *
   * @type {number}
   * @memberof FillResponse
   */
  totalResults?: number | null;
  /**
   *
   * @type {number}
   * @memberof FillResponse
   */
  offset?: number | null;
  /**
   *
   * @type {Array<IndexerFillResponseObject>}
   * @memberof FillResponse
   */
  fills: Array<IndexerFillResponseObject>;
}
/**
 *
 * @export
 * @interface FillResponseObject
 */
export interface IndexerFillResponseObject {
  /**
   *
   * @type {string}
   * @memberof FillResponseObject
   */
  id: string;
  /**
   *
   * @type {IndexerOrderSide}
   * @memberof FillResponseObject
   */
  side: IndexerOrderSide;
  /**
   *
   * @type {IndexerLiquidity}
   * @memberof FillResponseObject
   */
  liquidity: IndexerLiquidity;
  /**
   *
   * @type {IndexerFillType}
   * @memberof FillResponseObject
   */
  type: IndexerFillType;
  /**
   *
   * @type {string}
   * @memberof FillResponseObject
   */
  market: string;
  /**
   *
   * @type {IndexerMarketType}
   * @memberof FillResponseObject
   */
  marketType: IndexerMarketType;
  /**
   *
   * @type {string}
   * @memberof FillResponseObject
   */
  price: string;
  /**
   *
   * @type {string}
   * @memberof FillResponseObject
   */
  size: string;
  /**
   *
   * @type {string}
   * @memberof FillResponseObject
   */
  fee: string;
  /**
   *
   * @type {string}
   * @memberof FillResponseObject
   */
  affiliateRevShare: string;
  /**
   *
   * @type {IndexerIsoString}
   * @memberof FillResponseObject
   */
  createdAt: IndexerIsoString;
  /**
   *
   * @type {string}
   * @memberof FillResponseObject
   */
  createdAtHeight: string;
  /**
   *
   * @type {string}
   * @memberof FillResponseObject
   */
  orderId?: string | null;
  /**
   *
   * @type {string}
   * @memberof FillResponseObject
   */
  clientMetadata?: string | null;
  /**
   *
   * @type {number}
   * @memberof FillResponseObject
   */
  subaccountNumber: number;
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerFillType {
  LIMIT = 'LIMIT',
  LIQUIDATED = 'LIQUIDATED',
  LIQUIDATION = 'LIQUIDATION',
  DELEVERAGED = 'DELEVERAGED',
  OFFSETTING = 'OFFSETTING',
}
/**
 *
 * @export
 * @interface HeightResponse
 */
export interface IndexerHeightResponse {
  /**
   *
   * @type {string}
   * @memberof HeightResponse
   */
  height: string;
  /**
   *
   * @type {IndexerIsoString}
   * @memberof HeightResponse
   */
  time: IndexerIsoString;
}
/**
 *
 * @export
 * @interface HistoricalBlockTradingReward
 */
export interface IndexerHistoricalBlockTradingReward {
  /**
   *
   * @type {string}
   * @memberof HistoricalBlockTradingReward
   */
  tradingReward: string;
  /**
   *
   * @type {IndexerIsoString}
   * @memberof HistoricalBlockTradingReward
   */
  createdAt: IndexerIsoString;
  /**
   *
   * @type {string}
   * @memberof HistoricalBlockTradingReward
   */
  createdAtHeight: string;
}
/**
 *
 * @export
 * @interface HistoricalBlockTradingRewardsResponse
 */
export interface IndexerHistoricalBlockTradingRewardsResponse {
  /**
   *
   * @type {Array<IndexerHistoricalBlockTradingReward>}
   * @memberof HistoricalBlockTradingRewardsResponse
   */
  rewards: Array<IndexerHistoricalBlockTradingReward>;
}
/**
 *
 * @export
 * @interface HistoricalFundingResponse
 */
export interface IndexerHistoricalFundingResponse {
  /**
   *
   * @type {Array<IndexerHistoricalFundingResponseObject>}
   * @memberof HistoricalFundingResponse
   */
  historicalFunding: Array<IndexerHistoricalFundingResponseObject>;
}
/**
 *
 * @export
 * @interface HistoricalFundingResponseObject
 */
export interface IndexerHistoricalFundingResponseObject {
  /**
   *
   * @type {string}
   * @memberof HistoricalFundingResponseObject
   */
  ticker: string;
  /**
   *
   * @type {string}
   * @memberof HistoricalFundingResponseObject
   */
  rate: string;
  /**
   *
   * @type {string}
   * @memberof HistoricalFundingResponseObject
   */
  price: string;
  /**
   *
   * @type {IndexerIsoString}
   * @memberof HistoricalFundingResponseObject
   */
  effectiveAt: IndexerIsoString;
  /**
   *
   * @type {string}
   * @memberof HistoricalFundingResponseObject
   */
  effectiveAtHeight: string;
}
/**
 *
 * @export
 * @interface HistoricalPnlResponse
 */
export interface IndexerHistoricalPnlResponse {
  /**
   *
   * @type {number}
   * @memberof HistoricalPnlResponse
   */
  pageSize?: number | null;
  /**
   *
   * @type {number}
   * @memberof HistoricalPnlResponse
   */
  totalResults?: number | null;
  /**
   *
   * @type {number}
   * @memberof HistoricalPnlResponse
   */
  offset?: number | null;
  /**
   *
   * @type {Array<IndexerPnlTicksResponseObject>}
   * @memberof HistoricalPnlResponse
   */
  historicalPnl: Array<IndexerPnlTicksResponseObject>;
}
/**
 *
 * @export
 * @interface HistoricalTradingRewardAggregation
 */
export interface IndexerHistoricalTradingRewardAggregation {
  /**
   *
   * @type {string}
   * @memberof HistoricalTradingRewardAggregation
   */
  tradingReward: string;
  /**
   *
   * @type {IndexerIsoString}
   * @memberof HistoricalTradingRewardAggregation
   */
  startedAt: IndexerIsoString;
  /**
   *
   * @type {string}
   * @memberof HistoricalTradingRewardAggregation
   */
  startedAtHeight: string;
  /**
   *
   * @type {IndexerIsoString}
   * @memberof HistoricalTradingRewardAggregation
   */
  endedAt?: IndexerIsoString | null;
  /**
   *
   * @type {string}
   * @memberof HistoricalTradingRewardAggregation
   */
  endedAtHeight?: string | null;
  /**
   *
   * @type {IndexerTradingRewardAggregationPeriod}
   * @memberof HistoricalTradingRewardAggregation
   */
  period: IndexerTradingRewardAggregationPeriod;
}
/**
 *
 * @export
 * @interface HistoricalTradingRewardAggregationsResponse
 */
export interface IndexerHistoricalTradingRewardAggregationsResponse {
  /**
   *
   * @type {Array<IndexerHistoricalTradingRewardAggregation>}
   * @memberof HistoricalTradingRewardAggregationsResponse
   */
  rewards: Array<IndexerHistoricalTradingRewardAggregation>;
}
/**
 *
 * @export
 */
export type IndexerIsoString = string;
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerLiquidity {
  TAKER = 'TAKER',
  MAKER = 'MAKER',
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerMarketType {
  PERPETUAL = 'PERPETUAL',
  SPOT = 'SPOT',
}
/**
 *
 * @export
 * @interface MegavaultHistoricalPnlResponse
 */
export interface IndexerMegavaultHistoricalPnlResponse {
  /**
   *
   * @type {Array<IndexerPnlTicksResponseObject>}
   * @memberof MegavaultHistoricalPnlResponse
   */
  megavaultPnl: Array<IndexerPnlTicksResponseObject>;
}
/**
 *
 * @export
 * @interface MegavaultPositionResponse
 */
export interface IndexerMegavaultPositionResponse {
  /**
   *
   * @type {Array<IndexerVaultPosition>}
   * @memberof MegavaultPositionResponse
   */
  positions: Array<IndexerVaultPosition>;
}
/**
 *
 * @export
 * @interface OrderResponseObject
 */
export interface IndexerOrderResponseObject {
  /**
   *
   * @type {string}
   * @memberof OrderResponseObject
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof OrderResponseObject
   */
  subaccountId: string;
  /**
   *
   * @type {string}
   * @memberof OrderResponseObject
   */
  clientId: string;
  /**
   *
   * @type {string}
   * @memberof OrderResponseObject
   */
  clobPairId: string;
  /**
   *
   * @type {IndexerOrderSide}
   * @memberof OrderResponseObject
   */
  side: IndexerOrderSide;
  /**
   *
   * @type {string}
   * @memberof OrderResponseObject
   */
  size: string;
  /**
   *
   * @type {string}
   * @memberof OrderResponseObject
   */
  totalFilled: string;
  /**
   *
   * @type {string}
   * @memberof OrderResponseObject
   */
  price: string;
  /**
   *
   * @type {IndexerOrderType}
   * @memberof OrderResponseObject
   */
  type: IndexerOrderType;
  /**
   *
   * @type {boolean}
   * @memberof OrderResponseObject
   */
  reduceOnly: boolean;
  /**
   *
   * @type {string}
   * @memberof OrderResponseObject
   */
  orderFlags: string;
  /**
   *
   * @type {string}
   * @memberof OrderResponseObject
   */
  goodTilBlock?: string | null;
  /**
   *
   * @type {string}
   * @memberof OrderResponseObject
   */
  goodTilBlockTime?: string | null;
  /**
   *
   * @type {string}
   * @memberof OrderResponseObject
   */
  createdAtHeight?: string | null;
  /**
   *
   * @type {string}
   * @memberof OrderResponseObject
   */
  clientMetadata: string;
  /**
   *
   * @type {string}
   * @memberof OrderResponseObject
   */
  triggerPrice?: string | null;
  /**
   *
   * @type {IndexerAPITimeInForce}
   * @memberof OrderResponseObject
   */
  timeInForce: IndexerAPITimeInForce;
  /**
   *
   * @type {IndexerAPIOrderStatus}
   * @memberof OrderResponseObject
   */
  status: IndexerAPIOrderStatus;
  /**
   *
   * @type {boolean}
   * @memberof OrderResponseObject
   */
  postOnly: boolean;
  /**
   *
   * @type {string}
   * @memberof OrderResponseObject
   */
  ticker: string;
  /**
   *
   * @type {IndexerIsoString}
   * @memberof OrderResponseObject
   */
  updatedAt?: IndexerIsoString | null;
  /**
   *
   * @type {string}
   * @memberof OrderResponseObject
   */
  updatedAtHeight?: string | null;
  /**
   *
   * @type {number}
   * @memberof OrderResponseObject
   */
  subaccountNumber: number;
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerOrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerOrderStatus {
  OPEN = 'OPEN',
  FILLED = 'FILLED',
  CANCELED = 'CANCELED',
  BESTEFFORTCANCELED = 'BEST_EFFORT_CANCELED',
  UNTRIGGERED = 'UNTRIGGERED',
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerOrderType {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
  STOPLIMIT = 'STOP_LIMIT',
  STOPMARKET = 'STOP_MARKET',
  TRAILINGSTOP = 'TRAILING_STOP',
  TAKEPROFIT = 'TAKE_PROFIT',
  TAKEPROFITMARKET = 'TAKE_PROFIT_MARKET',
}
/**
 *
 * @export
 * @interface OrderbookResponseObject
 */
export interface IndexerOrderbookResponseObject {
  /**
   *
   * @type {Array<IndexerOrderbookResponsePriceLevel>}
   * @memberof OrderbookResponseObject
   */
  bids: Array<IndexerOrderbookResponsePriceLevel>;
  /**
   *
   * @type {Array<IndexerOrderbookResponsePriceLevel>}
   * @memberof OrderbookResponseObject
   */
  asks: Array<IndexerOrderbookResponsePriceLevel>;
}
/**
 *
 * @export
 * @interface OrderbookResponsePriceLevel
 */
export interface IndexerOrderbookResponsePriceLevel {
  /**
   *
   * @type {string}
   * @memberof OrderbookResponsePriceLevel
   */
  price: string;
  /**
   *
   * @type {string}
   * @memberof OrderbookResponsePriceLevel
   */
  size: string;
}
/**
 *
 * @export
 * @interface ParentSubaccountResponse
 */
export interface IndexerParentSubaccountResponse {
  /**
   *
   * @type {string}
   * @memberof ParentSubaccountResponse
   */
  address: string;
  /**
   *
   * @type {number}
   * @memberof ParentSubaccountResponse
   */
  parentSubaccountNumber: number;
  /**
   *
   * @type {string}
   * @memberof ParentSubaccountResponse
   */
  equity: string;
  /**
   *
   * @type {string}
   * @memberof ParentSubaccountResponse
   */
  freeCollateral: string;
  /**
   *
   * @type {Array<IndexerSubaccountResponseObject>}
   * @memberof ParentSubaccountResponse
   */
  childSubaccounts: Array<IndexerSubaccountResponseObject>;
}
/**
 *
 * @export
 * @interface ParentSubaccountTransferResponse
 */
export interface IndexerParentSubaccountTransferResponse {
  /**
   *
   * @type {number}
   * @memberof ParentSubaccountTransferResponse
   */
  pageSize?: number | null;
  /**
   *
   * @type {number}
   * @memberof ParentSubaccountTransferResponse
   */
  totalResults?: number | null;
  /**
   *
   * @type {number}
   * @memberof ParentSubaccountTransferResponse
   */
  offset?: number | null;
  /**
   *
   * @type {Array<IndexerTransferResponseObject>}
   * @memberof ParentSubaccountTransferResponse
   */
  transfers: Array<IndexerTransferResponseObject>;
}
/**
 *
 * @export
 * @interface PerpetualMarketResponse
 */
export interface IndexerPerpetualMarketResponse {
  /**
   *
   * @type {{ [key: string]: IndexerPerpetualMarketResponseObject; }}
   * @memberof PerpetualMarketResponse
   */
  markets: { [key: string]: IndexerPerpetualMarketResponseObject };
}
/**
 *
 * @export
 * @interface PerpetualMarketResponseObject
 */
export interface IndexerPerpetualMarketResponseObject {
  /**
   *
   * @type {string}
   * @memberof PerpetualMarketResponseObject
   */
  clobPairId: string;
  /**
   *
   * @type {string}
   * @memberof PerpetualMarketResponseObject
   */
  ticker: string;
  /**
   *
   * @type {IndexerPerpetualMarketStatus}
   * @memberof PerpetualMarketResponseObject
   */
  status: IndexerPerpetualMarketStatus;
  /**
   *
   * @type {string}
   * @memberof PerpetualMarketResponseObject
   */
  oraclePrice: string;
  /**
   *
   * @type {string}
   * @memberof PerpetualMarketResponseObject
   */
  priceChange24H: string;
  /**
   *
   * @type {string}
   * @memberof PerpetualMarketResponseObject
   */
  volume24H: string;
  /**
   *
   * @type {number}
   * @memberof PerpetualMarketResponseObject
   */
  trades24H: number;
  /**
   *
   * @type {string}
   * @memberof PerpetualMarketResponseObject
   */
  nextFundingRate: string;
  /**
   *
   * @type {string}
   * @memberof PerpetualMarketResponseObject
   */
  initialMarginFraction: string;
  /**
   *
   * @type {string}
   * @memberof PerpetualMarketResponseObject
   */
  maintenanceMarginFraction: string;
  /**
   *
   * @type {string}
   * @memberof PerpetualMarketResponseObject
   */
  openInterest: string;
  /**
   *
   * @type {number}
   * @memberof PerpetualMarketResponseObject
   */
  atomicResolution: number;
  /**
   *
   * @type {number}
   * @memberof PerpetualMarketResponseObject
   */
  quantumConversionExponent: number;
  /**
   *
   * @type {string}
   * @memberof PerpetualMarketResponseObject
   */
  tickSize: string;
  /**
   *
   * @type {string}
   * @memberof PerpetualMarketResponseObject
   */
  stepSize: string;
  /**
   *
   * @type {number}
   * @memberof PerpetualMarketResponseObject
   */
  stepBaseQuantums: number;
  /**
   *
   * @type {number}
   * @memberof PerpetualMarketResponseObject
   */
  subticksPerTick: number;
  /**
   *
   * @type {IndexerPerpetualMarketType}
   * @memberof PerpetualMarketResponseObject
   */
  marketType: IndexerPerpetualMarketType;
  /**
   *
   * @type {string}
   * @memberof PerpetualMarketResponseObject
   */
  openInterestLowerCap?: string | null;
  /**
   *
   * @type {string}
   * @memberof PerpetualMarketResponseObject
   */
  openInterestUpperCap?: string | null;
  /**
   *
   * @type {string}
   * @memberof PerpetualMarketResponseObject
   */
  baseOpenInterest: string;
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerPerpetualMarketStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELONLY = 'CANCEL_ONLY',
  POSTONLY = 'POST_ONLY',
  INITIALIZING = 'INITIALIZING',
  FINALSETTLEMENT = 'FINAL_SETTLEMENT',
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerPerpetualMarketType {
  CROSS = 'CROSS',
  ISOLATED = 'ISOLATED',
}
/**
 *
 * @export
 * @interface PerpetualPositionResponse
 */
export interface IndexerPerpetualPositionResponse {
  /**
   *
   * @type {Array<IndexerPerpetualPositionResponseObject>}
   * @memberof PerpetualPositionResponse
   */
  positions: Array<IndexerPerpetualPositionResponseObject>;
}
/**
 *
 * @export
 * @interface PerpetualPositionResponseObject
 */
export interface IndexerPerpetualPositionResponseObject {
  /**
   *
   * @type {string}
   * @memberof PerpetualPositionResponseObject
   */
  market: string;
  /**
   *
   * @type {IndexerPerpetualPositionStatus}
   * @memberof PerpetualPositionResponseObject
   */
  status: IndexerPerpetualPositionStatus;
  /**
   *
   * @type {IndexerPositionSide}
   * @memberof PerpetualPositionResponseObject
   */
  side: IndexerPositionSide;
  /**
   *
   * @type {string}
   * @memberof PerpetualPositionResponseObject
   */
  size: string;
  /**
   *
   * @type {string}
   * @memberof PerpetualPositionResponseObject
   */
  maxSize: string;
  /**
   *
   * @type {string}
   * @memberof PerpetualPositionResponseObject
   */
  entryPrice: string;
  /**
   *
   * @type {string}
   * @memberof PerpetualPositionResponseObject
   */
  realizedPnl: string;
  /**
   *
   * @type {IndexerIsoString}
   * @memberof PerpetualPositionResponseObject
   */
  createdAt: IndexerIsoString;
  /**
   *
   * @type {string}
   * @memberof PerpetualPositionResponseObject
   */
  createdAtHeight: string;
  /**
   *
   * @type {string}
   * @memberof PerpetualPositionResponseObject
   */
  sumOpen: string;
  /**
   *
   * @type {string}
   * @memberof PerpetualPositionResponseObject
   */
  sumClose: string;
  /**
   *
   * @type {string}
   * @memberof PerpetualPositionResponseObject
   */
  netFunding: string;
  /**
   *
   * @type {string}
   * @memberof PerpetualPositionResponseObject
   */
  unrealizedPnl: string;
  /**
   *
   * @type {IndexerIsoString}
   * @memberof PerpetualPositionResponseObject
   */
  closedAt?: IndexerIsoString | null;
  /**
   *
   * @type {string}
   * @memberof PerpetualPositionResponseObject
   */
  exitPrice?: string | null;
  /**
   *
   * @type {number}
   * @memberof PerpetualPositionResponseObject
   */
  subaccountNumber: number;
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerPerpetualPositionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  LIQUIDATED = 'LIQUIDATED',
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerPnlTickInterval {
  Hour = 'hour',
  Day = 'day',
}
/**
 *
 * @export
 * @interface PnlTicksResponseObject
 */
export interface IndexerPnlTicksResponseObject {
  /**
   *
   * @type {string}
   * @memberof PnlTicksResponseObject
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof PnlTicksResponseObject
   */
  subaccountId: string;
  /**
   *
   * @type {string}
   * @memberof PnlTicksResponseObject
   */
  equity: string;
  /**
   *
   * @type {string}
   * @memberof PnlTicksResponseObject
   */
  totalPnl: string;
  /**
   *
   * @type {string}
   * @memberof PnlTicksResponseObject
   */
  netTransfers: string;
  /**
   *
   * @type {string}
   * @memberof PnlTicksResponseObject
   */
  createdAt: string;
  /**
   *
   * @type {string}
   * @memberof PnlTicksResponseObject
   */
  blockHeight: string;
  /**
   *
   * @type {IndexerIsoString}
   * @memberof PnlTicksResponseObject
   */
  blockTime: IndexerIsoString;
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerPositionSide {
  LONG = 'LONG',
  SHORT = 'SHORT',
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerSparklineTimePeriod {
  ONEDAY = 'ONE_DAY',
  SEVENDAYS = 'SEVEN_DAYS',
}
/**
 *
 * @export
 * @interface SubaccountResponseObject
 */
export interface IndexerSubaccountResponseObject {
  /**
   *
   * @type {string}
   * @memberof SubaccountResponseObject
   */
  address: string;
  /**
   *
   * @type {number}
   * @memberof SubaccountResponseObject
   */
  subaccountNumber: number;
  /**
   *
   * @type {string}
   * @memberof SubaccountResponseObject
   */
  equity: string;
  /**
   *
   * @type {string}
   * @memberof SubaccountResponseObject
   */
  freeCollateral: string;
  /**
   *
   * @type {PerpetualPositionsMap}
   * @memberof SubaccountResponseObject
   */
  openPerpetualPositions: { [market: string]: IndexerPerpetualPositionResponseObject };
  /**
   *
   * @type {AssetPositionsMap}
   * @memberof SubaccountResponseObject
   */
  assetPositions: { [symbol: string]: IndexerAssetPositionResponseObject };
  /**
   *
   * @type {boolean}
   * @memberof SubaccountResponseObject
   */
  marginEnabled: boolean;
  /**
   *
   * @type {string}
   * @memberof SubaccountResponseObject
   */
  updatedAtHeight: string;
  /**
   *
   * @type {string}
   * @memberof SubaccountResponseObject
   */
  latestProcessedBlockHeight: string;
}
/**
 *
 * @export
 * @interface TimeResponse
 */
export interface IndexerTimeResponse {
  /**
   *
   * @type {IndexerIsoString}
   * @memberof TimeResponse
   */
  iso: IndexerIsoString;
  /**
   *
   * @type {number}
   * @memberof TimeResponse
   */
  epoch: number;
}
/**
 *
 * @export
 * @interface TradeResponse
 */
export interface IndexerTradeResponse {
  /**
   *
   * @type {number}
   * @memberof TradeResponse
   */
  pageSize?: number | null;
  /**
   *
   * @type {number}
   * @memberof TradeResponse
   */
  totalResults?: number | null;
  /**
   *
   * @type {number}
   * @memberof TradeResponse
   */
  offset?: number | null;
  /**
   *
   * @type {Array<IndexerTradeResponseObject>}
   * @memberof TradeResponse
   */
  trades: Array<IndexerTradeResponseObject>;
}
/**
 *
 * @export
 * @interface TradeResponseObject
 */
export interface IndexerTradeResponseObject {
  /**
   *
   * @type {string}
   * @memberof TradeResponseObject
   */
  id: string;
  /**
   *
   * @type {IndexerOrderSide}
   * @memberof TradeResponseObject
   */
  side: IndexerOrderSide;
  /**
   *
   * @type {string}
   * @memberof TradeResponseObject
   */
  size: string;
  /**
   *
   * @type {string}
   * @memberof TradeResponseObject
   */
  price: string;
  /**
   *
   * @type {IndexerTradeType}
   * @memberof TradeResponseObject
   */
  type: IndexerTradeType;
  /**
   *
   * @type {IndexerIsoString}
   * @memberof TradeResponseObject
   */
  createdAt: IndexerIsoString;
  /**
   *
   * @type {string}
   * @memberof TradeResponseObject
   */
  createdAtHeight: string;
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerTradeType {
  LIMIT = 'LIMIT',
  LIQUIDATED = 'LIQUIDATED',
  DELEVERAGED = 'DELEVERAGED',
}
/**
 *
 * @export
 * @interface TraderSearchResponse
 */
export interface IndexerTraderSearchResponse {
  /**
   *
   * @type {IndexerTraderSearchResponseObject}
   * @memberof TraderSearchResponse
   */
  result?: IndexerTraderSearchResponseObject | null;
}
/**
 *
 * @export
 * @interface TraderSearchResponseObject
 */
export interface IndexerTraderSearchResponseObject {
  /**
   *
   * @type {string}
   * @memberof TraderSearchResponseObject
   */
  address: string;
  /**
   *
   * @type {number}
   * @memberof TraderSearchResponseObject
   */
  subaccountNumber: number;
  /**
   *
   * @type {string}
   * @memberof TraderSearchResponseObject
   */
  subaccountId: string;
  /**
   *
   * @type {string}
   * @memberof TraderSearchResponseObject
   */
  username: string;
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerTradingRewardAggregationPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}
/**
 *
 * @export
 * @interface TransferBetweenResponse
 */
export interface IndexerTransferBetweenResponse {
  /**
   *
   * @type {number}
   * @memberof TransferBetweenResponse
   */
  pageSize?: number | null;
  /**
   *
   * @type {number}
   * @memberof TransferBetweenResponse
   */
  totalResults?: number | null;
  /**
   *
   * @type {number}
   * @memberof TransferBetweenResponse
   */
  offset?: number | null;
  /**
   *
   * @type {Array<IndexerTransferResponseObject>}
   * @memberof TransferBetweenResponse
   */
  transfersSubset: Array<IndexerTransferResponseObject>;
  /**
   *
   * @type {string}
   * @memberof TransferBetweenResponse
   */
  totalNetTransfers: string;
}
/**
 *
 * @export
 * @interface TransferResponse
 */
export interface IndexerTransferResponse {
  /**
   *
   * @type {number}
   * @memberof TransferResponse
   */
  pageSize?: number | null;
  /**
   *
   * @type {number}
   * @memberof TransferResponse
   */
  totalResults?: number | null;
  /**
   *
   * @type {number}
   * @memberof TransferResponse
   */
  offset?: number | null;
  /**
   *
   * @type {Array<IndexerTransferResponseObject>}
   * @memberof TransferResponse
   */
  transfers: Array<IndexerTransferResponseObject>;
}
/**
 *
 * @export
 * @interface TransferResponseObject
 */
export interface IndexerTransferResponseObject {
  /**
   *
   * @type {string}
   * @memberof TransferResponseObject
   */
  id: string;
  /**
   *
   * @type {IndexerTransferResponseObjectSender}
   * @memberof TransferResponseObject
   */
  sender: IndexerTransferResponseObjectSender;
  /**
   *
   * @type {IndexerTransferResponseObjectSender}
   * @memberof TransferResponseObject
   */
  recipient: IndexerTransferResponseObjectSender;
  /**
   *
   * @type {string}
   * @memberof TransferResponseObject
   */
  size: string;
  /**
   *
   * @type {string}
   * @memberof TransferResponseObject
   */
  createdAt: string;
  /**
   *
   * @type {string}
   * @memberof TransferResponseObject
   */
  createdAtHeight: string;
  /**
   *
   * @type {string}
   * @memberof TransferResponseObject
   */
  symbol: string;
  /**
   *
   * @type {IndexerTransferType}
   * @memberof TransferResponseObject
   */
  type: IndexerTransferType;
  /**
   *
   * @type {string}
   * @memberof TransferResponseObject
   */
  transactionHash: string;
}
/**
 *
 * @export
 * @interface TransferResponseObjectSender
 */
export interface IndexerTransferResponseObjectSender {
  /**
   *
   * @type {number}
   * @memberof TransferResponseObjectSender
   */
  subaccountNumber?: number | null;
  /**
   *
   * @type {string}
   * @memberof TransferResponseObjectSender
   */
  address: string;
}
/**
 *
 * @export
 * @enum {string}
 */
export enum IndexerTransferType {
  TRANSFERIN = 'TRANSFER_IN',
  TRANSFEROUT = 'TRANSFER_OUT',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
}
/**
 *
 * @export
 * @interface VaultHistoricalPnl
 */
export interface IndexerVaultHistoricalPnl {
  /**
   *
   * @type {string}
   * @memberof VaultHistoricalPnl
   */
  ticker: string;
  /**
   *
   * @type {Array<IndexerPnlTicksResponseObject>}
   * @memberof VaultHistoricalPnl
   */
  historicalPnl: Array<IndexerPnlTicksResponseObject>;
}
/**
 *
 * @export
 * @interface VaultPosition
 */
export interface IndexerVaultPosition {
  /**
   *
   * @type {string}
   * @memberof VaultPosition
   */
  ticker: string;
  /**
   *
   * @type {IndexerAssetPositionResponseObject}
   * @memberof VaultPosition
   */
  assetPosition: IndexerAssetPositionResponseObject;
  /**
   *
   * @type {IndexerPerpetualPositionResponseObject}
   * @memberof VaultPosition
   */
  perpetualPosition?: IndexerPerpetualPositionResponseObject | null;
  /**
   *
   * @type {string}
   * @memberof VaultPosition
   */
  equity: string;
}
/**
 *
 * @export
 * @interface VaultsHistoricalPnlResponse
 */
export interface IndexerVaultsHistoricalPnlResponse {
  /**
   *
   * @type {Array<IndexerVaultHistoricalPnl>}
   * @memberof VaultsHistoricalPnlResponse
   */
  vaultsPnl: Array<IndexerVaultHistoricalPnl>;
}
