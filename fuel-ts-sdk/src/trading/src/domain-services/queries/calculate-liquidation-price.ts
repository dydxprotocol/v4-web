import { OraclePrice, PercentageValue, UsdValue } from '@/shared/models/decimals';
import { MarketConfigId, PositionId } from '@/shared/types';
import { BigIntMath, DecimalCalculator, zero } from '@/shared/utils/decimalCalculator';
import { MarketQueries } from '../../markets';
import { PositionSide, PositionsQueries, getPositionSide } from '../../positions';

export interface CalculateLiquidationPriceDependencies {
  positionsQueries: PositionsQueries;
  marketQueries: MarketQueries;
}

export const createCalculateLiquidationPrice =
  (deps: CalculateLiquidationPriceDependencies) =>
  (
    positionId: PositionId,
    marketConfigId: MarketConfigId,
    equity: UsdValue,
    otherPositionsRisk: UsdValue
  ): OraclePrice => {
    const position = deps.positionsQueries.getPositionById(positionId);
    const marketConfig = deps.marketQueries.getMarketConfigById(marketConfigId);

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
  };
