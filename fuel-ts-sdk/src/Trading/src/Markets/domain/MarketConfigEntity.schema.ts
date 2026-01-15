import { z } from 'zod';
import { PercentageValue } from '@sdk/shared/models/decimals';
import { AssetIdSchema, MarketConfigIdSchema } from '@sdk/shared/types';
import { decimalValueSchema } from '@sdk/shared/utils/DecimalCalculator/utils/zod';
import type { MarketConfigEntity } from './MarketConfigEntity';

export const MarketConfigEntitySchema = z.object({
  id: MarketConfigIdSchema,
  asset: AssetIdSchema,
  initialMarginFraction: decimalValueSchema(PercentageValue),
  maintenanceMarginFraction: decimalValueSchema(PercentageValue),
  tickSizeDecimals: z.number().int(),
  stepSizeDecimals: z.number().int(),
}) satisfies z.ZodType<MarketConfigEntity, z.ZodTypeDef, unknown>;
