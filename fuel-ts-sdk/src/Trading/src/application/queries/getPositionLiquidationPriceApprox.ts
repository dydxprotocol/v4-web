import { multimemo } from '@sdk/shared/lib/memo';
import { OraclePrice } from '@sdk/shared/models/decimals';
import type { PositionStableId } from '@sdk/shared/types';
import { DecimalCalculator, zero } from '@sdk/shared/utils/DecimalCalculator';
import { ASSETS_MAX_LEVERAGE, type MarketQueries } from '../../Markets';
import type { PositionsQueries } from '../../Positions';
import { PositionSide } from '../../Positions';

export interface GetPositionLiquidationPriceApproxQueryDependencies {
  positionsQueries: PositionsQueries;
  marketQueries: MarketQueries;
}

export const createGetPositionLiquidationPriceApproxQuery = (
  deps: GetPositionLiquidationPriceApproxQueryDependencies
) => {
  const positionGetter = (positionStableId: PositionStableId) =>
    deps.positionsQueries.getPositionById(positionStableId);

  const getPositionLiquidationPriceApprox = multimemo(
    (position: ReturnType<typeof positionGetter>) => {
      if (!position) return zero(OraclePrice);

      if (position.size.value === '0' || position.entryPrice.value === '0') {
        return zero(OraclePrice);
      }

      const minCollateral = DecimalCalculator.value(position.size)
        .divideBy(ASSETS_MAX_LEVERAGE)
        .calculate(OraclePrice);

      const availableForLoss = DecimalCalculator.value(position.collateral)
        .subtractBy(minCollateral)
        .calculate(OraclePrice);

      if (BigInt(availableForLoss.value) <= 0n) {
        return position.entryPrice;
      }

      const priceChange = DecimalCalculator.value(availableForLoss)
        .multiplyBy(position.entryPrice)
        .divideBy(position.size)
        .calculate(OraclePrice);

      if (position.side === PositionSide.LONG) {
        return DecimalCalculator.value(position.entryPrice)
          .subtractBy(priceChange)
          .calculate(OraclePrice);
      } else {
        return DecimalCalculator.value(position.entryPrice).add(priceChange).calculate(OraclePrice);
      }
    }
  );

  return (positionStableId: PositionStableId) =>
    getPositionLiquidationPriceApprox(positionGetter(positionStableId));
};
