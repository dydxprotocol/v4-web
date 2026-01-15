import { type FC, useCallback, useMemo } from 'react';
import { $decimalValue } from 'fuel-ts-sdk';
import { calculateTotalExposure } from 'fuel-ts-sdk/trading';
import { WalletContext } from '@/contexts/WalletContext';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useAwaited } from '@/lib/useAwaited';
import { usePolling } from '@/lib/usePolling';
import { useRequiredContext } from '@/lib/useRequiredContext';
import { PositionCard } from './PositionCard';
import * as styles from './PositionsList.css';

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
            Total Exposure: ${$decimalValue(totalExposure).toFloat().toFixed(2)}
          </div>
          {positions.map((position) => (
            <PositionCard key={position.revisionId} position={position} />
          ))}
        </div>
      )}
    </>
  );
};
