import type { InferDecimalValueType } from './DecimalValue';
import { createDecimalValueSchema } from './DecimalValue';

export const OraclePrice = createDecimalValueSchema(18, 'OraclePrice');
export type OraclePrice = InferDecimalValueType<typeof OraclePrice>;

export const UsdValue = createDecimalValueSchema(9, 'UsdValue');
export type UsdValue = InferDecimalValueType<typeof UsdValue>;

export const PercentageMultiplier = createDecimalValueSchema(0, 'PercentageMultiplier');
export type PercentageMultiplier = InferDecimalValueType<typeof PercentageMultiplier>;

export const PercentageValue = createDecimalValueSchema(0, 'PercentageValue');
export type PercentageValue = InferDecimalValueType<typeof PercentageValue>;

export const RatioOutput = createDecimalValueSchema(18, 'RatioOutput');
export type RatioOutput = InferDecimalValueType<typeof RatioOutput>;

export const CollateralAmount = createDecimalValueSchema(6, 'CollateralAmount');
export type CollateralAmount = InferDecimalValueType<typeof CollateralAmount>;

export const Usdc = createDecimalValueSchema(18, 'Usdc');
export type Usdc = InferDecimalValueType<typeof Usdc>;

export const Btc = createDecimalValueSchema(18, 'Btc');
export type Btc = InferDecimalValueType<typeof Btc>;

export const Bnb = createDecimalValueSchema(18, 'Bnb');
export type Bnb = InferDecimalValueType<typeof Bnb>;

export const Eth = createDecimalValueSchema(18, 'Eth');
export type Eth = InferDecimalValueType<typeof Eth>;
