import { type FC } from 'react';
import { formatCurrency } from '@/lib/formatCurrency';
import { useRequiredContext } from '@/lib/useRequiredContext';
import { OrderEntryFormMetaContext } from '../../../contexts';
import * as $ from './AssetSizeInput.css';

type VolatileInputProps = {
  size: string;
  onSizeChange: (size: string) => void;
  onFocus: () => void;
  usdPrice: number;
  assetName: string;
  leverage?: number;
  label: string;
  error?: string;
  onHalf?: () => void;
  onMax?: () => void;
  focused: boolean;
};

export const AssetSizeInput: FC<VolatileInputProps> = ({
  assetName,
  onFocus,
  onSizeChange,
  size,
  usdPrice,
  leverage,
  label,
  error,
  onHalf,
  onMax,
  focused,
}) => {
  const { userBalanceInBaseAsset } = useRequiredContext(OrderEntryFormMetaContext);
  return (
    <div className={$.container({ focused })}>
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
        <span className={$.usdValue}>${formatCurrency(usdPrice)}</span>
        {leverage && <span className={$.leverage}>Leverage: {leverage}x</span>}
        {(onHalf || onMax) && userBalanceInBaseAsset > 0 && (
          <div className={$.quickActions}>
            {onHalf && (
              <button type="button" className={$.quickButton} onClick={onHalf}>
                Half
              </button>
            )}
            {onMax && (
              <button type="button" className={$.quickButton} onClick={onMax}>
                Max
              </button>
            )}
          </div>
        )}
      </div>
      {error && <div className={$.error}>{error}</div>}
    </div>
  );
};
