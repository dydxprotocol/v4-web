import { ClobModule, ComplianceReason, FeeTierModule } from '@dydxprotocol/v4-client-js';
import { type BigNumber } from 'bignumber.js';

import {
  IndexerAPITimeInForce,
  IndexerOrderSide,
  IndexerOrderType,
  IndexerPerpetualPositionResponseObject,
  IndexerTransferResponseObject,
} from '@/types/indexer/indexerApiGen';
import {
  IndexerCompositeFillObject,
  IndexerWsBaseMarketObject,
  IndexerWsTradeResponseObject,
} from '@/types/indexer/indexerManual';

import { ToPrimitives } from '@/lib/abacus/parseToPrimitives';

type ReplaceBigNumberInUnion<T> = T extends string ? BigNumber : T;

// Helper type to select properties that can be strings (including in unions)
type SelectStringProperties<T> = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [P in keyof T]: NonNullable<T[P]> extends string | infer U ? P : never;
}[keyof T];

// Main type that converts specified properties from string to BigNumber
type ConvertStringToBigNumber<T, K extends SelectStringProperties<T>> = {
  [P in keyof T]: P extends K ? ReplaceBigNumberInUnion<T[P]> : T[P];
};

export type MarketInfo = IndexerWsBaseMarketObject & {
  assetId: string;
  displayableAsset: string;
  displayableTicker: string;
  effectiveInitialMarginFraction: number | null;
  openInterestUSDC: number;
  percentChange24h: number | null;
  stepSizeDecimals: number;
  tickSizeDecimals: number;
};
export type MarketsInfo = { [marketId: string]: MarketInfo };

export type SubaccountSummaryCore = {
  quoteBalance: BigNumber;
  valueTotal: BigNumber;
  notionalTotal: BigNumber;
  initialRiskTotal: BigNumber;
  maintenanceRiskTotal: BigNumber;
};

export type SubaccountSummaryDerived = {
  freeCollateral: BigNumber;
  equity: BigNumber;

  leverage: BigNumber | null;
  marginUsage: BigNumber | null;
};

export type SubaccountSummary = SubaccountSummaryCore & SubaccountSummaryDerived;
export type GroupedSubaccountSummary = SubaccountSummaryDerived;

export type SubaccountPositionBase = ConvertStringToBigNumber<
  IndexerPerpetualPositionResponseObject,
  | 'size'
  | 'maxSize'
  | 'entryPrice'
  | 'realizedPnl'
  | 'createdAtHeight'
  | 'sumOpen'
  | 'sumClose'
  | 'netFunding'
  | 'unrealizedPnl'
  | 'exitPrice'
>;

export type MarginMode = 'ISOLATED' | 'CROSS';

export type PositionUniqueId = string & { ___brand: 'POSITION_UNIQUE_ID' };

export type SubaccountPositionDerivedCore = {
  uniqueId: PositionUniqueId;
  assetId: string;
  marginMode: MarginMode;

  signedSize: BigNumber; // indexer size is signed by default but we make it obvious here
  unsignedSize: BigNumber; // always positive
  notional: BigNumber; // always positive
  value: BigNumber; // can be negative

  adjustedImf: BigNumber;
  adjustedMmf: BigNumber;

  initialRisk: BigNumber;
  maintenanceRisk: BigNumber;
  maxLeverage: BigNumber | null;

  // these are just copied from the perpetual position for aesthetic reasons honestly
  baseEntryPrice: BigNumber;
  baseNetFunding: BigNumber;
};

export type SubaccountPositionDerivedExtra = {
  // all these depend on the subaccount being calculated
  leverage: BigNumber | null;
  marginValueMaintenance: BigNumber;
  marginValueInitial: BigNumber;
  liquidationPrice: BigNumber | null;

  updatedUnrealizedPnl: BigNumber;
  updatedUnrealizedPnlPercent: BigNumber | null;
};

export type SubaccountPosition = Omit<SubaccountPositionBase, 'size'> &
  SubaccountPositionDerivedCore &
  SubaccountPositionDerivedExtra;

export enum OrderStatus {
  Canceled = 'CANCELED',
  Canceling = 'BEST_EFFORT_CANCELED',
  Filled = 'FILLED',
  Open = 'OPEN',
  Pending = 'PENDING',
  Untriggered = 'UNTRIGGERED',
  PartiallyFilled = 'PARTIALLY_FILLED',
  PartiallyCanceled = 'PARTIALLY_CANCELED',
}

export enum OrderFlags {
  SHORT_TERM = '0',
  LONG_TERM = '64',
  CONDITIONAL = '32',
}

export type SubaccountOrder = {
  subaccountNumber: number;
  id: string;
  clientId: string | undefined;
  positionUniqueId: PositionUniqueId; // market + subaccount, can map to a unique position if/when it exists
  type: IndexerOrderType;
  side: IndexerOrderSide;
  status: OrderStatus | undefined;
  timeInForce: IndexerAPITimeInForce | undefined;
  marketId: string;
  displayId: string;
  clobPairId: number | undefined;
  orderFlags: string | undefined;
  price: BigNumber;
  triggerPrice: BigNumber | undefined;
  size: BigNumber;
  remainingSize: BigNumber | undefined;
  totalFilled: BigNumber | undefined;
  goodTilBlock: number | undefined;
  goodTilBlockTimeMilliseconds: number | undefined;
  goodTilBlockTimeSeconds: number | undefined;
  createdAtHeight: number | undefined;
  expiresAtMilliseconds: number | undefined;
  updatedAtMilliseconds: number | undefined;
  updatedAtHeight: number | undefined;
  postOnly: boolean;
  reduceOnly: boolean;
  removalReason: string | undefined;
  marginMode: MarginMode | undefined;
};

export enum SubaccountFillType {
  LIMIT = 'LIMIT',
  LIQUIDATED = 'LIQUIDATED',
  DELEVERAGED = 'DELEVERAGED',
  MARKET = 'MARKET',
}

export type SubaccountFill = Omit<IndexerCompositeFillObject, 'type'> & {
  marginMode: MarginMode;
  type: SubaccountFillType | undefined;
};

export type LiveTrade = IndexerWsTradeResponseObject;

export type PendingIsolatedPosition = {
  marketId: string;
  displayId: string;
  assetId: string;
  displayableAsset: string;
  equity: BigNumber;
  orders: SubaccountOrder[];
};

export type AccountStats = {
  takerNotional: string;
  makerNotional: string;
};

export interface ApiState {
  status: ApiStatus;
  haltedBlock?: number | undefined;
  trailingBlocks?: number | undefined;
}

export enum ApiStatus {
  UNKNOWN = 'UNKNOWN',
  VALIDATOR_DOWN = 'VALIDATOR_DOWN',
  VALIDATOR_HALTED = 'VALIDATOR_HALTED',
  INDEXER_DOWN = 'INDEXER_DOWN',
  INDEXER_HALTED = 'INDEXER_HALTED',
  INDEXER_TRAILING = 'INDEXER_TRAILING',
  NORMAL = 'NORMAL',
}

export type AssetData = {
  assetId: string;
  name: string;
  logo: string;
  price: number | null;
  marketCap: number | null;
  volume24h: number | null;
  percentChange24h: number | null;
  reportedMarketCap: number | null;
  sectorTags: string[] | null;
  tickSizeDecimals: number;
  urls: {
    website: string | null;
    technicalDoc: string | null;
    cmc: string | null;
  };
};

export type AssetDataForPerpetualMarketSummary = Omit<
  AssetData,
  'assetId' | 'price' | 'percentChange24h' | 'tickSizeDecimals' | 'volume24h' | 'tickSizeDecimals'
>;

export type AllAssetData = {
  [assetId: string]: AssetData;
};

export type PerpetualMarketSparklines = {
  [period: string]: {
    [marketId: string]: number[];
  };
};

export type PerpetualMarketSummary = MarketInfo &
  AssetDataForPerpetualMarketSummary & {
    sparkline24h: number[];
    isNew: boolean;
    spotVolume24h: number | null;
    isFavorite: boolean;
    isUnlaunched: boolean;
  };

export type PerpetualMarketSummaries = {
  [marketId: string]: PerpetualMarketSummary;
};

export type UserFeeTier = NonNullable<ToPrimitives<FeeTierModule.QueryUserFeeTierResponse['tier']>>;
export type EquityTiers = NonNullable<
  ToPrimitives<ClobModule.QueryEquityTierLimitConfigurationResponse['equityTierLimitConfig']>
>;
export type FeeTiers = NonNullable<
  ToPrimitives<FeeTierModule.QueryPerpetualFeeParamsResponse['params']>
>;
export type ConfigTiers = {
  feeTiers: FeeTiers | undefined;
  equityTiers: EquityTiers | undefined;
};

export interface FeeTierSummary {
  id: string;
  tier: string;
  symbol: string;
  volume: number;
  totalShare?: number;
  makerShare?: number;
  maker?: number;
  taker?: number;
}

export interface EquityTierSummary {
  requiredTotalNetCollateralUSD: number;
  nextLevelRequiredTotalNetCollateralUSD?: number;
  maxOrders: number;
}

export interface EquityTiersSummary {
  shortTermOrderEquityTiers: EquityTierSummary[];
  statefulOrderEquityTiers: EquityTierSummary[];
}

export interface UserStats {
  feeTierId?: string;
  makerFeeRate?: number;
  takerFeeRate?: number;
  makerVolume30D?: number;
  takerVolume30D?: number;
}

export type AccountBalances = {
  usdcAmount?: string;
  chainTokenAmount?: string;
};

export type SubaccountTransfer = IndexerTransferResponseObject;

export type AggregatedTradingReward = {
  amount: number;
  cumulativeAmount: number;
  date: number;
};

export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  FIRST_STRIKE_CLOSE_ONLY = 'FIRST_STRIKE_CLOSE_ONLY',
  FIRST_STRIKE = 'FIRST_STRIKE',
  CLOSE_ONLY = 'CLOSE_ONLY',
  BLOCKED = 'BLOCKED',
  UNKNOWN = 'UNKNOWN',
}
export interface ComplianceResponse {
  status: ComplianceStatus;
  reason?: ComplianceReason;
  updatedAt?: string;
}
export type Compliance = ComplianceResponse & { geo?: string };
