import { z } from 'zod';
import { PercentageValue } from '@/shared/models/decimals';
import { AssetIdSchema, MarketConfigIdSchema } from '@/shared/types';
import { decimalValueSchema } from '@/shared/utils/decimalCalculator/utils/zod';
import type { MarketConfig } from './market-configs.types';

export const MarketConfigSchema = z.object({
  id: MarketConfigIdSchema,
  asset: AssetIdSchema,
  initialMarginFraction: decimalValueSchema(PercentageValue),
  maintenanceMarginFraction: decimalValueSchema(PercentageValue),
  tickSizeDecimals: z.number().int(),
  stepSizeDecimals: z.number().int(),
}) satisfies z.ZodType<MarketConfig, z.ZodTypeDef, unknown>;
