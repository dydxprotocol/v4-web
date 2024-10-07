import { useEffect, useState } from 'react';

import { useAppSelector } from '@/state/appTypes';
import { getLatestOrderClientId } from '@/state/localOrdersSelectors';

/**
 * @description This hook will fire a callback when the latest order has been updated to a non-pending state from the Indexer.
 * @param { callback: () => void }
 */
export const useOnLastOrderIndexed = ({ callback }: { callback: () => void }) => {
  const [unIndexedClientId, setUnIndexedClientId] = useState<string | undefined>();
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
