import type { InferDecimalValueType } from '@sdk/shared/models/DecimalValue';
import { createDecimalValueSchema } from '@sdk/shared/models/DecimalValue';
import type { AssetId } from '@sdk/shared/types';

export interface MarketStatsEntity {
  assetId: AssetId;
  openInterestLong: OpenInterest;
  openInterestShort: OpenInterest;
  volume24h: TradeVolume;
  priceChange24h: number | null;
}

export const TradeVolume = createDecimalValueSchema(6, 'TradeVolume');
export type TradeVolume = InferDecimalValueType<typeof TradeVolume>;

export const OpenInterest = createDecimalValueSchema(6, 'OpenInterest');
export type OpenInterest = InferDecimalValueType<typeof OpenInterest>;
