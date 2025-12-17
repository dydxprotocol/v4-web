import { PercentageValue } from '@/shared/models/decimals';
import { decimalValueSchema } from '@/shared/utils/decimalCalculator';
import { z } from 'zod';

export const MarketConfigSchema = z.object({
  initialMarginFraction: z.bigint(),
  maintenanceMarginFraction: decimalValueSchema(PercentageValue),
  tickSizeDecimals: z.number().int(),
  stepSizeDecimals: z.number().int(),
});
