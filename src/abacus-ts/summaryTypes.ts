import { IndexerPerpetualPositionResponseObject } from '@/types/indexer/indexerApiGen';
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
  initialRiskTotal: BigNumber;
};

export type SubaccountSummaryDerived = {
  notionalTotal: BigNumber;

  freeCollateral: BigNumber;
  equity: BigNumber;

  leverage: BigNumber;
  marginUsage: BigNumber;
};

export type SubaccountSummary = SubaccountSummaryCore & SubaccountSummaryDerived;

// type SubaccountPositionCore = ConvertStringToBigNumber<
//   IndexerPerpetualPositionResponseObject,
//   | 'size'
//   | 'maxSize'
//   | 'entryPrice'
//   | 'realizedPnl'
//   | 'createdAtHeight'
//   | 'sumOpen'
//   | 'sumClose'
//   | 'netFunding'
//   | 'unrealizedPnl'
//   | 'exitPrice'
// >;

export type SubaccountPositionBase = IndexerPerpetualPositionResponseObject;

export type SubaccountPositionDerivedArgs = {
  marketConfigs: {
    effectiveInitialMarginFraction: BigNumber;
    maintenanceMarginFraction: BigNumber;
  };
  marketOraclePrice: BigNumber;
  containingSubaccountInfo: SubaccountSummaryCore;
};

export type SubaccountPositionDerivedCore = {
  marginMode: 'ISOLATED' | 'CROSS';

  signedSize: BigNumber;
  size: BigNumber;
  notional: BigNumber; // always positive
  value: BigNumber; // can be negative

  adjustedImf: BigNumber;
  adjustedMmf: BigNumber;

  initialRiskTotal: BigNumber;
  maxLeverage: BigNumber | null;
};

export type SubaccountPositionDerivedExtra = {
  // all these depend on the subaccount being calculated
  leverage: BigNumber;
  marginValue: BigNumber;
  liquidationPrice: BigNumber;

  updatedUnrealizedPnl: BigNumber;
  updatedUnrealizedPnlPercent: BigNumber;
};
