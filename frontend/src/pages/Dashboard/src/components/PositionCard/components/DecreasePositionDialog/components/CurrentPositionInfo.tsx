import type { FC } from 'react';
import { $decimalValue } from 'fuel-ts-sdk';
import type { PositionSize } from 'fuel-ts-sdk/trading';
import { formatNumber } from '@/lib/formatCurrency';
import * as $ from './CurrentPositionInfo.css';

export interface CurrentPositionInfoProps {
  currentSize: PositionSize;
  assetSymbol: string;
  quoteAssetSymbol: string;
}

export const CurrentPositionInfo: FC<CurrentPositionInfoProps> = ({
  currentSize,
  assetSymbol,
  quoteAssetSymbol,
}) => {
  return (
    <div css={$.positionInfo}>
      <div>
        <div css={$.positionInfoLabel}>Current Size</div>
        <div css={$.positionInfoValue}>
          {formatNumber($decimalValue(currentSize).toDecimalString())} {quoteAssetSymbol}
        </div>
      </div>
      <div tw="text-right">
        <div css={$.positionInfoLabel}>Asset</div>
        <div css={$.positionInfoValue}>{assetSymbol}</div>
      </div>
    </div>
  );
};
