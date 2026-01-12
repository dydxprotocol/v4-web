import type { FC } from 'react';
import { type AssetId } from 'fuel-ts-sdk';
import { type Position, calculatePositionLeverage } from 'fuel-ts-sdk/trading';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import * as styles from './position-card.css';
import {
  CollateralField,
  FundingRateField,
  LeverageField,
  PnLField,
  PositionFeeField,
  RealizedPnLField,
  SizeField,
} from './position-field.component';

type PositionCardProps = {
  position: Position;
};

export const PositionCard: FC<PositionCardProps> = ({ position }) => {
  const isProfitable = position.pnlDelta.value > 0n;
  const leverage = calculatePositionLeverage(position);

  return (
    <div css={styles.positionCard}>
      <PositionCardHeader
        isLong={position.positionKey.isLong}
        assetId={position.positionKey.indexAssetId}
      />

      <div css={styles.positionGrid}>
        <SizeField value={position.size} />
        <CollateralField value={position.collateralAmount} />
        <LeverageField value={leverage} />
        <PnLField value={position.pnlDelta} variant={isProfitable ? 'profit' : 'loss'} />
        <RealizedPnLField value={position.realizedPnl} />
        <PositionFeeField value={position.positionFee} />
        <FundingRateField value={position.fundingRate} />
      </div>
    </div>
  );
};

type PositionCardHeaderProps = {
  isLong: boolean;
  assetId: AssetId;
};

function PositionCardHeader({ isLong, assetId }: PositionCardHeaderProps) {
  const tradingSdk = useTradingSdk();
  const asset = useSdkQuery(() => tradingSdk.getAssetById(assetId));
  const symbol = asset?.symbol ?? assetId.slice(0, 8) + '...';
  return (
    <div css={styles.positionHeader}>
      <span css={[styles.positionSide, isLong ? styles.longPosition : styles.shortPosition]}>
        {isLong ? 'LONG' : 'SHORT'}
      </span>
      <span css={styles.fieldValue}>Asset: {symbol}</span>
    </div>
  );
}
