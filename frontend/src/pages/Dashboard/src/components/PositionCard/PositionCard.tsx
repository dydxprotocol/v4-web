import type { FC } from 'react';
import { type PositionEntity } from 'fuel-ts-sdk/trading';
import * as $ from './PositionCard.css';
import { CardHeader } from './components/CardHeader';
import { LiquidationFooter } from './components/LiquidationFooter';
import { PositionPnL } from './components/PositionPnL';
import { EntryPrice, MarkPrice, PositionSize } from './components/PositionStats';
import { PositionCardContext } from './lib/PositionCardContext';

type PositionCardProps = {
  position: PositionEntity;
};

export const PositionCard: FC<PositionCardProps> = ({ position }) => {
  return (
    <PositionCardContext.Provider value={position}>
      <div css={$.positionCard}>
        <CardHeader />

        <PositionPnL />

        <div css={$.statsRow}>
          <PositionSize />
          <EntryPrice />
          <MarkPrice />
        </div>

        <LiquidationFooter />
      </div>
    </PositionCardContext.Provider>
  );
};
