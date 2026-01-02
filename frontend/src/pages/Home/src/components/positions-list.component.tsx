import type { FC } from 'react';
import type { Position } from 'fuel-ts-sdk/trading';
import * as styles from '../Home.css';
import { PositionCard } from './position-card.component';

type PositionsListProps = {
  positions: Position[];
};

export const PositionsList: FC<PositionsListProps> = ({ positions }) => {
  if (positions.length === 0) {
    return null;
  }

  return (
    <div css={styles.positionsContainer}>
      {positions.map((position) => (
        <PositionCard key={position.revisionId} position={position} />
      ))}
    </div>
  );
};
