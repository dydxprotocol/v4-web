import type { FC } from 'react';
import {
  CollateralAmount,
  address,
  assetId,
  positionRevisionId,
  positionStableId,
} from 'fuel-ts-sdk';
import {
  FundingRate,
  PnlDelta,
  type Position,
  PositionChange,
  PositionFee,
  PositionSize,
  RealizedPnl,
  calculateTotalCollateral,
} from 'fuel-ts-sdk/trading';
import { PositionCard } from './position-card.component';
import * as styles from './positions-list.css';

const YOUR_ADDRESS = '0x4f56874bcB38132aef9E488Bb2145a0f27F1F5540F469E8724560074c4590339';
const MOCK_TIMESTAMP = 1736251200000; // Static timestamp for mock data

const MOCK_POSITIONS: Position[] = [
  {
    revisionId: positionRevisionId('pos-1'),
    positionKey: {
      id: positionStableId('0xbtc-long-1'),
      account: address(YOUR_ADDRESS),
      indexAssetId: assetId('0x7404e3d104ea7841c3d9e6fd20adfe99b4ad586bc08d8f3bd3afef894cf184de'),
      isLong: true,
    },
    collateralAmount: CollateralAmount.fromFloat(10000),
    size: PositionSize.fromFloat(500000),
    timestamp: MOCK_TIMESTAMP,
    latest: true,
    change: PositionChange.Increase,
    collateralTransferred: CollateralAmount.fromFloat(10000),
    positionFee: PositionFee.fromFloat(50),
    fundingRate: FundingRate.fromFloat(0.01),
    pnlDelta: PnlDelta.fromFloat(25000),
    realizedFundingRate: FundingRate.fromFloat(0),
    realizedPnl: RealizedPnl.fromFloat(0),
  },
  {
    revisionId: positionRevisionId('pos-2'),
    positionKey: {
      id: positionStableId('0xeth-long-1'),
      account: address(YOUR_ADDRESS),
      indexAssetId: assetId('0x59102b37de83bdda9f38ac8254e596f0d9ac61d2035c07936675e87342817160'),
      isLong: true,
    },
    collateralAmount: CollateralAmount.fromFloat(5000),
    size: PositionSize.fromFloat(150000),
    timestamp: MOCK_TIMESTAMP,
    latest: true,
    change: PositionChange.Increase,
    collateralTransferred: CollateralAmount.fromFloat(5000),
    positionFee: PositionFee.fromFloat(25),
    fundingRate: FundingRate.fromFloat(0.01),
    pnlDelta: PnlDelta.fromFloat(5000),
    realizedFundingRate: FundingRate.fromFloat(0),
    realizedPnl: RealizedPnl.fromFloat(0),
  },
  {
    revisionId: positionRevisionId('pos-3'),
    positionKey: {
      id: positionStableId('0xbnb-short-1'),
      account: address(YOUR_ADDRESS),
      indexAssetId: assetId('0x1bc6d6279e196b1fa7b94a792d57a47433858940c1b3500f2a5e69640cd12ef4'),
      isLong: false,
    },
    collateralAmount: CollateralAmount.fromFloat(2000),
    size: PositionSize.fromFloat(20000),
    timestamp: MOCK_TIMESTAMP,
    latest: true,
    change: PositionChange.Increase,
    collateralTransferred: CollateralAmount.fromFloat(2000),
    positionFee: PositionFee.fromFloat(10),
    fundingRate: FundingRate.fromFloat(0.01),
    pnlDelta: PnlDelta.fromFloat(444),
    realizedFundingRate: FundingRate.fromFloat(0),
    realizedPnl: RealizedPnl.fromFloat(0),
  },
];

export const PositionsList: FC = () => {
  const positions = MOCK_POSITIONS;

  if (positions.length === 0) {
    return null;
  }

  const totalCollateral = calculateTotalCollateral(positions);

  return (
    <div css={styles.positionsContainer}>
      <div css={styles.totalCollateral}>
        Total Collateral: ${totalCollateral.toFloat().toFixed(2)}
      </div>
      {positions.map((position) => (
        <PositionCard key={position.revisionId} position={position} />
      ))}
    </div>
  );
};
