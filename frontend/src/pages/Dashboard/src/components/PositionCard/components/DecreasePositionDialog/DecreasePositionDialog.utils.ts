import { $decimalValue, DecimalCalculator, RatioOutput } from 'fuel-ts-sdk';
import { PositionSize } from 'fuel-ts-sdk/trading';

export function calculateSliderPercentage(
  sizeToDecrease: string,
  totalPositionSize: PositionSize
): number {
  if (!sizeToDecrease || totalPositionSize.value === '0') return 0;

  const percentage = Math.round(
    $decimalValue(
      DecimalCalculator.value(PositionSize.fromDecimalString(sizeToDecrease))
        .divideBy(totalPositionSize)
        .calculate()
    ).toFloat() * 100
  );

  return Math.min(100, Math.max(0, Number(percentage)));
}

export function calculateSizeFromPercentage(
  percentage: number,
  totalPositionSize: PositionSize
): string {
  if (percentage === 0) return '';

  const nextPercentageValue = RatioOutput.fromFloat(percentage);
  const nextSizeToDecrease = DecimalCalculator.value(totalPositionSize)
    .multiplyBy(nextPercentageValue)
    .divideBy(RatioOutput.fromFloat(100))
    .calculate();

  const result = $decimalValue(nextSizeToDecrease).toDecimalString();
  return result === '0' ? '' : result;
}

export function isValidDecreaseAmount(amount: string, totalPositionSize: PositionSize): boolean {
  if (amount === '') return false;

  const amountValue = Number(amount);
  if (isNaN(amountValue) || amountValue <= 0) return false;

  const totalSizeValue = Number($decimalValue(totalPositionSize).toDecimalString());
  return amountValue <= totalSizeValue;
}

export function getPositionAction(sliderPercentage: number): 'close' | 'decrease' {
  return sliderPercentage === 100 ? 'close' : 'decrease';
}
