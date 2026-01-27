import { OraclePrice } from '@sdk/shared/models/decimals';
import { DecimalCalculator, zero } from '@sdk/shared/utils/DecimalCalculator';
import type { PositionEntity } from '../PositionsEntity';
import { PositionSide } from '../PositionsEntity';

export function calculateLiquidationPriceApprox(
  position: PositionEntity,
  maxLeverage: number
): OraclePrice {
  if (position.size.value === '0' || position.entryPrice.value === '0') {
    return zero(OraclePrice);
  }

  if (maxLeverage <= 0) {
    return zero(OraclePrice);
  }

  const minCollateral = DecimalCalculator.value(position.size)
    .divideBy(OraclePrice.fromFloat(maxLeverage))
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
