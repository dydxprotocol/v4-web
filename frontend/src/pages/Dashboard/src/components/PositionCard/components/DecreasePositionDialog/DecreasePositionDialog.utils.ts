import { $decimalValue, DecimalCalculator, RatioOutput } from 'fuel-ts-sdk';
import { PositionSize } from 'fuel-ts-sdk/trading';

export function calculateSliderPercentage(
  sizeToDecrease: string,
  totalPositionSize: PositionSize
): string {
  if (!sizeToDecrease || totalPositionSize.value === '0') return '0';

  const percentage = $decimalValue(
    DecimalCalculator.value(PositionSize.fromDecimalString(sizeToDecrease))
      .multiplyBy(RatioOutput.fromFloat(100))
      .divideBy(totalPositionSize)
      .calculate()
  ).toDecimalString();

  const percentageNum = Number(percentage);
  if (percentageNum <= 0) return '0';
  if (percentageNum >= 100) return '100';

  return percentage;
}

export function calculateSizeFromPercentage(
  percentage: string,
  totalPositionSize: PositionSize
): string {
  if (percentage === '0') return '0';

  const nextPercentageValue = RatioOutput.fromDecimalString(percentage);
  const nextSizeToDecrease = DecimalCalculator.value(totalPositionSize)
    .multiplyBy(nextPercentageValue)
    .divideBy(RatioOutput.fromFloat(100))
    .calculate();

  const result = $decimalValue(nextSizeToDecrease).toDecimalString();
  return result === '0' ? '0' : result;
}

export function isValidDecreaseAmount(amount: string, totalPositionSize: PositionSize): boolean {
  if (amount === '') return false;

  const amountValue = Number(amount);
  if (isNaN(amountValue) || amountValue <= 0) return false;

  const totalSizeValue = Number($decimalValue(totalPositionSize).toDecimalString());
  return amountValue <= totalSizeValue;
}

export function getPositionAction(sliderPercentage: string): 'close' | 'decrease' {
  return sliderPercentage === '100' ? 'close' : 'decrease';
}
