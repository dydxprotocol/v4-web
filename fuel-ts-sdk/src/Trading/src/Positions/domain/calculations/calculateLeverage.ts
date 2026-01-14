import type { OraclePrice, UsdValue } from '@/shared/models/decimals';
import { RatioOutput } from '@/shared/models/decimals';
import { DecimalCalculator, zero } from '@/shared/utils/DecimalCalculator';
import type { PositionEntity } from '../../domain';
import { calculateNotional } from './calculateNotional';

export function calculateLeverage(
  positionHistory: PositionEntity[],
  equity: UsdValue,
  oraclePrice: OraclePrice
): RatioOutput {
  if (equity.value <= 0n) {
    return zero(RatioOutput);
  }

  const notional = calculateNotional(positionHistory, oraclePrice);
  return DecimalCalculator.value(notional).divideBy(equity).calculate(RatioOutput);
}
