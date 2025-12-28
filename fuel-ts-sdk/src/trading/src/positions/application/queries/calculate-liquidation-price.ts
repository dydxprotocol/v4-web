import { OraclePrice, PercentageValue, UsdValue } from '@/shared/models/decimals';
import type { MarketConfig } from '@/trading/src/markets';
import { BigIntMath, DecimalCalculator, zero } from '@/shared/utils/decimalCalculator';
import { getPositionSide, type Position, PositionSide } from '../../domain';

export function calculateLiquidationPrice(
  position: Position,
  marketConfig: MarketConfig,
  equity: UsdValue,
  otherPositionsRisk: UsdValue
): OraclePrice {
  const side = getPositionSide(position);
  const size = BigIntMath.abs(position.size);

  if (size.value === 0n) return zero(OraclePrice);

  const addOrSubtract = side === PositionSide.LONG ? 'add' : 'subtractBy';
  const mmfCoefficient = DecimalCalculator.value(PercentageValue.fromFloat(1))
    [addOrSubtract](marketConfig.maintenanceMarginFraction)
    .calculate(PercentageValue);

  return DecimalCalculator.inNumerator((b) =>
    b.value(equity).subtractBy(otherPositionsRisk).subtractBy(position.collateralAmount)
  )
    .inDenominator((b) => b.value(size).multiplyBy(mmfCoefficient))
    .calculate(OraclePrice);
}
