import { z } from 'zod';
import { OraclePrice } from '@/shared/models/decimals';
import { AssetIdSchema, AssetPriceIdSchema } from '@/shared/types';
import { decimalValueSchema } from '@/shared/utils/DecimalCalculator';
import type { AssetPriceEntity } from './AssetPriceEntity';

export const AssetPriceEntitySchema = z.object({
  id: AssetPriceIdSchema,
  assetId: AssetIdSchema,
  value: decimalValueSchema(OraclePrice),
  timestamp: z.number().int(),
}) satisfies z.ZodType<AssetPriceEntity, z.ZodTypeDef, unknown>;
