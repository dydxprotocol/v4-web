import { z } from 'zod';
import { PercentageValue, RatioOutput, UsdValue } from '@sdk/shared/models/decimals';
import { decimalValueSchema } from '@sdk/shared/utils/DecimalCalculator';

export const RiskMetricsEntitySchema = z.object({
  initialMargin: decimalValueSchema(UsdValue),
  maintenanceMargin: decimalValueSchema(UsdValue),
  maxLeverage: decimalValueSchema(RatioOutput),
  positionHealth: decimalValueSchema(PercentageValue),
});
