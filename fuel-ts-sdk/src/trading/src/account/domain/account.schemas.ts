import { decimalValueSchema } from '@/shared/utils/decimalCalculator';
import { PercentageValue, RatioOutput, UsdValue } from '@/shared/models/decimals';
import { z } from 'zod';

export const AccountMetricsSchema = z.object({
  equity: decimalValueSchema(UsdValue),
  totalNotional: decimalValueSchema(UsdValue),
  accountLeverage: decimalValueSchema(RatioOutput),
  marginUsage: decimalValueSchema(PercentageValue),
});
