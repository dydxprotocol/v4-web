import { type FC } from 'react';
import * as $ from './asset-size-input.css';

type VolatileInputProps = {
  size: string;
  onSizeChange: (size: string) => void;
  onFocus: () => void;
  usdPrice: number;
  assetName: string;
  leverage?: number;
  label: string;
};

export const AssetSizeInput: FC<VolatileInputProps> = ({
  assetName,
  onFocus,
  onSizeChange,
  size,
  usdPrice,
  leverage,
  label,
}) => (
  <div className={$.container}>
    <label className={$.label}>{label}</label>
    <div className={$.inputWrapper}>
      <input
        type="text"
        className={$.input}
        value={size}
        onChange={(e) => onSizeChange(e.target.value)}
        onFocus={onFocus}
        placeholder="0.0"
      />
      <div className={$.assetBadge}>{assetName}</div>
    </div>
    <div className={$.footer}>
      <span className={$.usdValue}>${usdPrice.toFixed(2)}</span>
      {leverage && <span className={$.leverage}>Leverage: {leverage}x</span>}
    </div>
  </div>
);
