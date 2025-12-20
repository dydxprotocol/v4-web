import { OraclePrice, PercentageValue } from '@/shared/models/decimals';
import { AssetIdSchema } from '@/shared/types';
import { decimalValueSchema } from '@/shared/utils/decimalCalculator';
import { z } from 'zod';

export const OraclePriceSchema = z.object({
  assetId: AssetIdSchema,
  price: decimalValueSchema(OraclePrice),
  timestamp: z.number().int(),
});

export const MarketConfigSchema = z.object({
  initialMarginFraction: z.bigint(),
  maintenanceMarginFraction: decimalValueSchema(PercentageValue),
  tickSizeDecimals: z.number().int(),
  stepSizeDecimals: z.number().int(),
});
