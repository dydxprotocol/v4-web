import { z } from 'zod';
import { PositionChange } from '@/generated/graphql';
import { AddressSchema, AssetIdSchema, PositionIdSchema } from '@/shared/types';

export type PositionKey = z.infer<typeof PositionKeySchema>;
export type Position = z.infer<typeof PositionSchema>;

// Re-export PositionChange from generated types (single source of truth)
export { PositionChange };

export const PositionKeySchema = z.object({
  account: AddressSchema,
  indexAssetId: AssetIdSchema,
  isLong: z.boolean(),
});

export const PositionSchema = z.object({
  id: PositionIdSchema,
  positionKey: PositionKeySchema,
  collateralAmount: z.bigint(),
  size: z.bigint(),
  timestamp: z.number().int(),
  latest: z.boolean(),
  change: z.nativeEnum(PositionChange),
  collateralTransferred: z.bigint(),
  positionFee: z.bigint(),
  fundingRate: z.bigint(),
  pnlDelta: z.bigint(),
  realizedFundingRate: z.bigint(),
  realizedPnl: z.bigint(),
});
