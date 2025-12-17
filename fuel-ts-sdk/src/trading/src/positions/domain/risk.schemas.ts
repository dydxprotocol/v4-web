import { PercentageValue, RatioOutput, UsdValue } from '@/shared/models/decimals';
import { decimalValueSchema } from '@/shared/utils/decimalCalculator';
import { z } from 'zod';

export const RiskMetricsSchema = z.object({
  initialMargin: decimalValueSchema(UsdValue),
  maintenanceMargin: decimalValueSchema(UsdValue),
  maxLeverage: decimalValueSchema(RatioOutput),
  positionHealth: decimalValueSchema(PercentageValue),
});
