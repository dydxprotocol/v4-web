import { zodDecimalValueSchema } from '@sdk/shared/lib/zod';
import { OraclePrice } from '@sdk/shared/models/decimals';
import { AssetIdSchema, AssetPriceIdSchema } from '@sdk/shared/types';
import { z } from 'zod';
import type { AssetPriceEntity } from './AssetPriceEntity';

export const AssetPriceEntitySchema = z.object({
  id: AssetPriceIdSchema,
  assetId: AssetIdSchema,
  value: zodDecimalValueSchema(OraclePrice),
  timestamp: z.number().int(),
}) satisfies z.ZodType<AssetPriceEntity, z.ZodTypeDef, unknown>;
