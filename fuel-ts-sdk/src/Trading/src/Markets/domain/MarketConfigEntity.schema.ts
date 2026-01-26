import { zodDecimalValueSchema } from '@sdk/shared/lib/zod';
import { PercentageValue } from '@sdk/shared/models/decimals';
import { AssetIdSchema, MarketConfigIdSchema } from '@sdk/shared/types';
import { z } from 'zod';
import type { MarketConfigEntity } from './MarketConfigEntity';

export const MarketConfigEntitySchema = z.object({
  id: MarketConfigIdSchema,
  asset: AssetIdSchema,
  initialMarginFraction: zodDecimalValueSchema(PercentageValue),
  maintenanceMarginFraction: zodDecimalValueSchema(PercentageValue),
  tickSizeDecimals: z.number().int(),
  stepSizeDecimals: z.number().int(),
}) satisfies z.ZodType<MarketConfigEntity, z.ZodTypeDef, unknown>;
