import { useEffect, useState } from 'react';

import { getLatestOrderClientId } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

/**
 * @description This hook will fire a callback when the latest order has been updated to a non-pending state from the Indexer.
 * @param { callback: () => void }
 */
export const useOnLastOrderIndexed = ({ callback }: { callback: () => void }) => {
  const [unIndexedClientId, setUnIndexedClientId] = useState<number | undefined>();
  const latestOrderClientId = useAppSelector(getLatestOrderClientId);

  useEffect(() => {
    if (unIndexedClientId) {
      if (unIndexedClientId === latestOrderClientId) {
        callback();
        setUnIndexedClientId(undefined);
      }
    }
  }, [callback, latestOrderClientId, unIndexedClientId]);

  return {
    setUnIndexedClientId,
  };
};
