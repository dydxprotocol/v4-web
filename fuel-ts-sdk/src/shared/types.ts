import { z } from 'zod';

/**
 * Address - Fuel blockchain address
 */
export const AddressSchema = z.string().min(1, 'Address cannot be empty').brand<'Address'>();
export type Address = z.infer<typeof AddressSchema>;
export const address = (str?: string): Address => AddressSchema.parse(str);
export const safeAddress = (str?: string): Address | undefined => {
  const result = AddressSchema.safeParse(str);
  return result.success ? result.data : undefined;
};

/**
 * AssetId - Fuel asset identifier
 */
export const AssetIdSchema = z.string().min(1, 'Asset ID cannot be empty').brand<'AssetId'>();
export type AssetId = z.infer<typeof AssetIdSchema>;
export const assetId = (str?: string): AssetId => AssetIdSchema.parse(str);
export const safeAssetId = (str?: string): AssetId | undefined => {
  const result = AssetIdSchema.safeParse(str);
  return result.success ? result.data : undefined;
};

/**
 * ContractId - Fuel contract identifier
 */
export const ContractIdSchema = z
  .string()
  .min(1, 'Contract ID cannot be empty')
  .brand<'ContractId'>();
export type ContractId = z.infer<typeof ContractIdSchema>;
export const contractId = (str?: string): ContractId => ContractIdSchema.parse(str);
export const safeContractId = (str?: string): ContractId | undefined => {
  const result = ContractIdSchema.safeParse(str);
  return result.success ? result.data : undefined;
};

/**
 * PositionStableId - Unique position identifier (permanent ID across all revisions)
 */
export const PositionStableIdSchema = z
  .string()
  .min(1, 'Position Stable ID cannot be empty')
  .brand<'PositionStableId'>();
export type PositionStableId = z.infer<typeof PositionStableIdSchema>;
export const positionStableId = (str?: string): PositionStableId =>
  PositionStableIdSchema.parse(str);
export const safePositionStableId = (str?: string): PositionStableId | undefined => {
  const result = PositionStableIdSchema.safeParse(str);
  return result.success ? result.data : undefined;
};

/**
 * PositionRevisionId - Unique position revision identifier (snapshot/version ID)
 */
export const PositionRevisionIdSchema = z
  .string()
  .min(1, 'Position Revision ID cannot be empty')
  .brand<'PositionRevisionId'>();
export type PositionRevisionId = z.infer<typeof PositionRevisionIdSchema>;
export const positionRevisionId = (str?: string): PositionRevisionId =>
  PositionRevisionIdSchema.parse(str);
export const safePositionRevisionId = (str?: string): PositionRevisionId | undefined => {
  const result = PositionRevisionIdSchema.safeParse(str);
  return result.success ? result.data : undefined;
};

/**
 * AssetPriceId - Unique asset price identifier
 */
export const AssetPriceIdSchema = z
  .string()
  .min(1, 'Asset Price ID cannot be empty')
  .brand<'AssetPriceId'>();
export type AssetPriceId = z.infer<typeof AssetPriceIdSchema>;
export const assetPriceId = (str?: string): AssetPriceId => AssetPriceIdSchema.parse(str);
export const safeAssetPriceId = (str?: string): AssetPriceId | undefined => {
  const result = AssetPriceIdSchema.safeParse(str);
  return result.success ? result.data : undefined;
};

/**
 * CandleId - Unique candle identifier
 */
export const CandleIdSchema = z.string().min(1, 'Candle ID cannot be empty').brand<'CandleId'>();
export type CandleId = z.infer<typeof CandleIdSchema>;
export const candleId = (str?: string): CandleId => CandleIdSchema.parse(str);
export const safeCandleId = (str?: string): CandleId | undefined => {
  const result = CandleIdSchema.safeParse(str);
  return result.success ? result.data : undefined;
};

/**
 * MarketConfigId - Unique market configuration identifier
 */
export const MarketConfigIdSchema = z
  .string()
  .min(1, 'Market Config ID cannot be empty')
  .brand<'MarketConfigId'>();
export type MarketConfigId = z.infer<typeof MarketConfigIdSchema>;
export const marketConfigId = (str?: string): MarketConfigId => MarketConfigIdSchema.parse(str);
export const safeMarketConfigId = (str?: string): MarketConfigId | undefined => {
  const result = MarketConfigIdSchema.safeParse(str);
  return result.success ? result.data : undefined;
};
