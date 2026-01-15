import type { InferDecimalValueType } from '@/shared/models/DecimalValue';
import { createDecimalValueSchema } from '@/shared/models/DecimalValue';

export const PositionSize = createDecimalValueSchema(6, 'PositionSize');
export type PositionSize = InferDecimalValueType<typeof PositionSize>;

export const PositionFee = createDecimalValueSchema(9, 'PositionFee');
export type PositionFee = InferDecimalValueType<typeof PositionFee>;

export const FundingRate = createDecimalValueSchema(9, 'FundingRate');
export type FundingRate = InferDecimalValueType<typeof FundingRate>;

export const PnlDelta = createDecimalValueSchema(9, 'PnlDelta');
export type PnlDelta = InferDecimalValueType<typeof PnlDelta>;

export const RealizedPnl = createDecimalValueSchema(9, 'RealizedPnl');
export type RealizedPnl = InferDecimalValueType<typeof RealizedPnl>;
