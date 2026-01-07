import type { FC } from 'react';
import { type Position, calculateTotalCollateral } from 'fuel-ts-sdk/trading';
import * as styles from '../Home.css';
import { PositionCard } from './position-card.component';

type PositionsListProps = {
  positions: Position[];
};

export const PositionsList: FC<PositionsListProps> = ({ positions }) => {
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
