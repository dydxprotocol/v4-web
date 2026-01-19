import type { ChangeEvent, FC } from 'react';
import * as $ from './SizeInput.css';

export interface SizeInputProps {
  amountToDecrease: string;
  onChange: (nextValue: string) => void;
  assetSymbol: string;
}

export const SizeInput: FC<SizeInputProps> = ({ amountToDecrease, onChange, assetSymbol }) => {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onChange(value.slice(0, 13));
    }
  };

  return (
    <>
      <label className={$.inputLabel}>Amount to Decrease</label>
      <div className={$.inputWrapper}>
        <input
          type="text"
          inputMode="decimal"
          className={$.input}
          placeholder="0.00"
          value={amountToDecrease || ''}
          onChange={handleInputChange}
        />
        <span className={$.inputSuffix}>{assetSymbol}</span>
      </div>
    </>
  );
};
