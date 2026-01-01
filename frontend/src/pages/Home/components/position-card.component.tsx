import type { FC } from 'react';
import { ASSET_ID_TO_ASSET_SYMBOL, type AssetId } from 'fuel-ts-sdk';
import type { Position } from 'fuel-ts-sdk/trading';
import * as styles from '../Home.css';
import {
  CollateralField,
  FundingRateField,
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

  return (
    <div css={styles.positionCard}>
      <PositionCardHeader
        isLong={position.positionKey.isLong}
        assetId={position.positionKey.indexAssetId}
      />

      <div css={styles.positionGrid}>
        <SizeField value={position.size} />
        <CollateralField value={position.collateralAmount} />
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
  const symbol = ASSET_ID_TO_ASSET_SYMBOL[assetId] ?? assetId.slice(0, 8) + '...';
  return (
    <div css={styles.positionHeader}>
      <span css={[styles.positionSide, isLong ? styles.longPosition : styles.shortPosition]}>
        {isLong ? 'LONG' : 'SHORT'}
      </span>
      <span css={styles.fieldValue}>Asset: {symbol}...</span>
    </div>
  );
}
