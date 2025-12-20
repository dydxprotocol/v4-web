import { z } from 'zod';

/**
 * Address - Fuel blockchain address
 */
export const AddressSchema = z.string().min(1, 'Address cannot be empty').brand<'Address'>();
export type Address = z.infer<typeof AddressSchema>;
export const address = (str: string): Address => AddressSchema.parse(str);
export const safeAddress = (str: string): Address | undefined => {
  const result = AddressSchema.safeParse(str);
  return result.success ? result.data : undefined;
};

/**
 * AssetId - Fuel asset identifier
 */
export const AssetIdSchema = z.string().min(1, 'Asset ID cannot be empty').brand<'AssetId'>();
export type AssetId = z.infer<typeof AssetIdSchema>;
export const assetId = (str: string): AssetId => AssetIdSchema.parse(str);
export const safeAssetId = (str: string): AssetId | undefined => {
  const result = AssetIdSchema.safeParse(str);
  return result.success ? result.data : undefined;
};

/**
 * PositionId - Unique position identifier
 */
export const PositionIdSchema = z.string().min(1, 'Position ID cannot be empty').brand<'PositionId'>();
export type PositionId = z.infer<typeof PositionIdSchema>;
export const positionId = (str: string): PositionId => PositionIdSchema.parse(str);
export const safePositionId = (str: string): PositionId | undefined => {
  const result = PositionIdSchema.safeParse(str);
  return result.success ? result.data : undefined;
};

/**
 * PriceId - Unique price identifier
 */
export const PriceIdSchema = z.string().min(1, 'Price ID cannot be empty').brand<'PriceId'>();
export type PriceId = z.infer<typeof PriceIdSchema>;
export const priceId = (str: string): PriceId => PriceIdSchema.parse(str);
export const safePriceId = (str: string): PriceId | undefined => {
  const result = PriceIdSchema.safeParse(str);
  return result.success ? result.data : undefined;
};

/**
 * CandleId - Unique candle identifier
 */
export const CandleIdSchema = z.string().min(1, 'Candle ID cannot be empty').brand<'CandleId'>();
export type CandleId = z.infer<typeof CandleIdSchema>;
export const candleId = (str: string): CandleId => CandleIdSchema.parse(str);
export const safeCandleId = (str: string): CandleId | undefined => {
  const result = CandleIdSchema.safeParse(str);
  return result.success ? result.data : undefined;
};
