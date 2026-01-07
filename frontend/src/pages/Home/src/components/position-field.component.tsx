import type { DecimalValue } from 'fuel-ts-sdk';
import { propify } from '@/lib/propify';
import * as styles from '../Home.css';

export const SizeField = propify(PositionField, {
  label: 'Size',
  precision: 4,
});

export const CollateralField = propify(PositionField, {
  label: 'Collateral',
  precision: 2,
});

export const PnLField = propify(PositionField, {
  label: 'PnL',
  precision: 2,
});

export const RealizedPnLField = propify(PositionField, {
  label: 'Realized PnL',
  precision: 2,
});

export const PositionFeeField = propify(PositionField, {
  label: 'Position Fee',
  precision: 4,
});

export const FundingRateField = propify(PositionField, {
  label: 'Funding Rate',
  precision: 6,
});

export const LeverageField = propify(PositionField, {
  label: 'Leverage',
  precision: 2,
});

type PositionFieldProps = {
  label: string;
  value: DecimalValue;
  precision: number;
  variant?: 'default' | 'profit' | 'loss';
};

function PositionField({ label, value, variant = 'default', precision }: PositionFieldProps) {
  const getValueStyles = () => {
    const baseStyles = [styles.fieldValue];
    if (variant === 'profit') baseStyles.push(styles.profitPositive);
    if (variant === 'loss') baseStyles.push(styles.profitNegative);
    return baseStyles;
  };

  const symbol = (() => {
    if (variant === 'profit') return '+';
    return '';
  })();

  return (
    <div css={styles.positionField}>
      <span css={styles.fieldLabel}>{label}</span>
      <span css={getValueStyles()}>
        {symbol}
        {value.toFloat().toFixed(precision)}
      </span>
    </div>
  );
}
