import type { UsdValue } from '@sdk/shared/models/decimals';
import { OraclePrice, PercentageValue } from '@sdk/shared/models/decimals';
import { BigIntMath, DecimalCalculator, zero } from '@sdk/shared/utils/DecimalCalculator';
import type { MarketConfigEntity } from '../../Markets';
import type { PositionEntity } from '../../Positions';
import { PositionSide, getPositionSide } from '../../Positions';

export const calculateLiquidationPrice = (
  position: PositionEntity,
  marketConfig: MarketConfigEntity,
  equity: UsdValue,
  otherPositionsRisk: UsdValue
): OraclePrice => {
  if (!position) return zero(OraclePrice);

  const side = getPositionSide(position);
  const size = BigIntMath.abs(position.size);

  if (size.value === '0') return zero(OraclePrice);

  const addOrSubtract = side === PositionSide.LONG ? 'add' : 'subtractBy';
  const mmfCoefficient = DecimalCalculator.value(PercentageValue.fromFloat(1))
    [addOrSubtract](marketConfig.maintenanceMarginFraction)
    .calculate(PercentageValue);

  return DecimalCalculator.inNumerator((b) =>
    b.value(equity).subtractBy(otherPositionsRisk).subtractBy(position.collateralAmount)
  )
    .inDenominator((b) => b.value(size).multiplyBy(mmfCoefficient))
    .calculate(OraclePrice);
};
