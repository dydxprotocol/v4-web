import { type FC, useCallback, useMemo } from 'react';
import { calculateTotalExposure } from 'fuel-ts-sdk/trading';
import { WalletContext } from '@/contexts/wallet';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useAwaited } from '@/lib/use-awaited';
import { usePolling } from '@/lib/use-polling';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { PositionCard } from './position-card.component';
import * as styles from './positions-list.css';

export const PositionsList: FC = () => {
  const trading = useTradingSdk();
  const { getUserAddress } = useRequiredContext(WalletContext);
  const userAddress = useAwaited(useMemo(() => getUserAddress(), [getUserAddress]));
  const positions = useSdkQuery(() => trading.getAccountWatchedAssetPositions(userAddress));

  const totalExposure = calculateTotalExposure(positions);

  usePolling(
    useCallback(() => {
      if (userAddress) trading.fetchPositionsByAccount(userAddress, true);
    }, [trading, userAddress])
  );

  return (
    <>
      {positions.length > 0 && (
        <div css={styles.positionsContainer}>
          <div css={styles.totalExposure}>
            Total Exposure: ${totalExposure.toFloat().toFixed(2)}
          </div>
          {positions.map((position) => (
            <PositionCard key={position.revisionId} position={position} />
          ))}
        </div>
      )}
    </>
  );
};
