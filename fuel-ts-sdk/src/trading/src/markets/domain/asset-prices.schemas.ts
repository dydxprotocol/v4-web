import { z } from 'zod';
import { OraclePrice } from '@/shared/models/decimals';
import { AssetIdSchema, AssetPriceIdSchema } from '@/shared/types';
import { decimalValueSchema } from '@/shared/utils/decimalCalculator';
import type { AssetPrice } from './asset-prices.entity';

export const AssetPriceSchema = z.object({
  id: AssetPriceIdSchema,
  assetId: AssetIdSchema,
  value: decimalValueSchema(OraclePrice),
  timestamp: z.number().int(),
}) satisfies z.ZodType<AssetPrice, z.ZodTypeDef, unknown>;
