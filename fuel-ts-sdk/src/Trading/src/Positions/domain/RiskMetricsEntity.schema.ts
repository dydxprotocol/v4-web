import { z } from 'zod';
import { PercentageValue, RatioOutput, UsdValue } from '@/shared/models/decimals';
import { decimalValueSchema } from '@/shared/utils/DecimalCalculator';

export const RiskMetricsEntitySchema = z.object({
  initialMargin: decimalValueSchema(UsdValue),
  maintenanceMargin: decimalValueSchema(UsdValue),
  maxLeverage: decimalValueSchema(RatioOutput),
  positionHealth: decimalValueSchema(PercentageValue),
});
