import type { FC } from 'react';
import { $decimalValue, DecimalCalculator } from 'fuel-ts-sdk';
import { PositionSize } from 'fuel-ts-sdk/trading';
import { formatCurrency } from '@/lib/formatCurrency';
import * as $ from './Summary.css';

export interface SummaryProps {
  totalPositionSize: PositionSize;
  decreaseAmount: string;
}

export const Summary: FC<SummaryProps> = ({ decreaseAmount, totalPositionSize }) => {
  const remainingSize = (() => {
    if (!decreaseAmount) return $decimalValue(totalPositionSize).toDecimalString();

    const decrease = PositionSize.fromDecimalString(decreaseAmount);
    const remaining = DecimalCalculator.value(totalPositionSize).subtractBy(decrease).calculate();

    return $decimalValue(remaining).toDecimalString();
  })();

  return (
    <>
      <div className={$.summaryRow}>
        <span className={$.summaryLabel}>Decrease Amount</span>
        <span className={$.summaryValue}>{formatCurrency(Number(decreaseAmount))} USDC</span>
      </div>
      <div className={$.summaryRow}>
        <span className={$.summaryLabel}>Remaining Size</span>
        <span className={$.summaryValue}>{formatCurrency(Number(remainingSize))} USDC</span>
      </div>
    </>
  );
};
