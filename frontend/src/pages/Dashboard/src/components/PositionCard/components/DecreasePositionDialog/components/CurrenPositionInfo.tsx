import type { FC } from 'react';
import { $decimalValue } from 'fuel-ts-sdk';
import type { PositionSize } from 'fuel-ts-sdk/trading';
import { formatCurrency } from '@/lib/formatCurrency';
import * as $ from './CurrenPositionInfo.css';

export interface CurrenPositionInfoProps {
  currentSize: PositionSize;
  assetSymbol: string;
}

export const CurrenPositionInfo: FC<CurrenPositionInfoProps> = ({ currentSize, assetSymbol }) => {
  return (
    <div css={$.positionInfo}>
      <div>
        <div css={$.positionInfoLabel}>Current Size</div>
        <div css={$.positionInfoValue}>
          {formatCurrency($decimalValue(currentSize).toFloat())} USDC
        </div>
      </div>
      <div tw="text-right">
        <div css={$.positionInfoLabel}>Asset</div>
        <div css={$.positionInfoValue}>{assetSymbol}</div>
      </div>
    </div>
  );
};
