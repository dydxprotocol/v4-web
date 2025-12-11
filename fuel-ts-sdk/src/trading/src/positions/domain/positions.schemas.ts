import { PositionChange } from '@/generated/graphql';
import { AddressSchema, AssetIdSchema, PositionIdSchema } from '@/shared/types';
import { z } from 'zod';

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
