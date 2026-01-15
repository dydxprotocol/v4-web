import { UsdValue } from '@sdk/shared/models/decimals';
import { DecimalCalculator } from '@sdk/shared/utils/DecimalCalculator';
import type { MarketConfigEntity } from '../MarketConfigEntity';

export const calculateMaintenanceMargin = (
  marketConfig: MarketConfigEntity,
  notional: UsdValue
): UsdValue =>
  DecimalCalculator.value(notional)
    .multiplyBy(marketConfig.maintenanceMarginFraction)
    .calculate(UsdValue);
