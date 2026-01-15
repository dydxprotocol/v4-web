import { z } from 'zod';
import { OraclePrice } from '@sdk/shared/models/decimals';
import { AssetIdSchema, AssetPriceIdSchema } from '@sdk/shared/types';
import { decimalValueSchema } from '@sdk/shared/utils/DecimalCalculator';
import type { AssetPriceEntity } from './AssetPriceEntity';

export const AssetPriceEntitySchema = z.object({
  id: AssetPriceIdSchema,
  assetId: AssetIdSchema,
  value: decimalValueSchema(OraclePrice),
  timestamp: z.number().int(),
}) satisfies z.ZodType<AssetPriceEntity, z.ZodTypeDef, unknown>;
