import { useCallback, useState } from 'react';

import { useInterval } from './useInterval';

export const useNow = ({ intervalMs }: { intervalMs?: number } = { intervalMs: 1_000 }): number => {
  const [now, setNow] = useState(Date.now());

  const updateNow = useCallback(() => {
    setNow(Date.now());
  }, []);

  useInterval({ callback: updateNow, periodInMs: intervalMs });

  return now;
};
