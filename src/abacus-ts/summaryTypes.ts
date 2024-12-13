import {
  IndexerAPITimeInForce,
  IndexerOrderSide,
  IndexerOrderType,
  IndexerPerpetualPositionResponseObject,
} from '@/types/indexer/indexerApiGen';
import { type BigNumber } from 'bignumber.js';

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

export type SubaccountPositionDerivedCore = {
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
  marginValue: BigNumber;
  liquidationPrice: BigNumber | null;

  updatedUnrealizedPnl: BigNumber;
  updatedUnrealizedPnlPercent: BigNumber | null;
};

export type SubaccountPosition = SubaccountPositionBase &
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

export type SubaccountOrder = {
  subaccountNumber: number;
  id: string;
  clientId: string | null;
  type: IndexerOrderType;
  side: IndexerOrderSide;
  status: OrderStatus;
  timeInForce: IndexerAPITimeInForce | null;
  marketId: string;
  displayId: string;
  clobPairId: number | null;
  orderFlags: string | null;
  price: BigNumber;
  triggerPrice: BigNumber | null;
  trailingPercent: BigNumber | null;
  size: BigNumber;
  remainingSize: BigNumber | null;
  totalFilled: BigNumber | null;
  goodTilBlock: number | null;
  goodTilBlockTime: number | null;
  createdAtHeight: number | null;
  createdAtMilliseconds: number | null;
  unfillableAtMilliseconds: number | null;
  expiresAtMilliseconds: number | null;
  updatedAtMilliseconds: number | null;
  postOnly: boolean;
  reduceOnly: boolean;
  cancelReason: string | null;
  marginMode: MarginMode | null;
};
