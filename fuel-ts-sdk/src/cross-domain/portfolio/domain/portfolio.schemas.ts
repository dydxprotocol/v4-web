import { PercentageValue, RatioOutput, UsdValue } from '@/shared/models/decimals';
import { decimalValueSchema } from '@/shared/utils/decimalCalculator';
import { z } from 'zod';

export const PortfolioMetricsSchema = z.object({
  equity: decimalValueSchema(UsdValue),
  totalNotional: decimalValueSchema(UsdValue),
  accountLeverage: decimalValueSchema(RatioOutput),
  marginUsage: decimalValueSchema(PercentageValue),
});
