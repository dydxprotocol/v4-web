import { type FC, useCallback } from 'react';
import { $decimalValue } from 'fuel-ts-sdk';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { usePolling } from '@/lib/usePolling';
import { PositionCard } from './PositionCard';
import * as styles from './PositionsList.css';

export const PositionsList: FC = () => {
  const trading = useTradingSdk();
  const userAddress = useSdkQuery((sdk) => sdk.accounts.getCurrentUserAddress());
  const positions = useSdkQuery(() => trading.getCurrentAccountOpenPositions());

  const totalExposure = useSdkQuery(trading.getCurrentAccountTotalExposure);

  usePolling(
    useCallback(() => {
      if (userAddress) trading.fetchPositionsByAccount(userAddress, true);
    }, [trading, userAddress])
  );

  if (positions.length === 0) return null;

  return (
    <div css={styles.positionsContainer}>
      <div css={styles.header}>
        <span css={styles.headerTitle}>Open Positions ({positions.length})</span>
        <div css={styles.headerStats}>
          <div css={styles.statItem}>
            <span css={styles.statLabel}>Exposure</span>
            <span css={styles.statValue}>
              $
              {$decimalValue(totalExposure)
                .toFloat()
                .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
      <div css={styles.positionCards}>
        {positions.map((position) => (
          <PositionCard key={position.revisionId} position={position} />
        ))}
      </div>
    </div>
  );
};
