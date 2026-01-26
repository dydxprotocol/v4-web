import { zodDecimalValueSchema } from '@sdk/shared/lib/zod';
import { PercentageValue, RatioOutput, UsdValue } from '@sdk/shared/models/decimals';
import { z } from 'zod';

export const RiskMetricsEntitySchema = z.object({
  initialMargin: zodDecimalValueSchema(UsdValue),
  maintenanceMargin: zodDecimalValueSchema(UsdValue),
  maxLeverage: zodDecimalValueSchema(RatioOutput),
  positionHealth: zodDecimalValueSchema(PercentageValue),
});
