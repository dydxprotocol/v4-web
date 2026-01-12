import { useEffect } from 'react';

export function usePolling(fetcher: VoidFunction, intervalInMs = 1000) {
  useEffect(() => {
    fetcher();
    const intervalId = setInterval(() => fetcher(), intervalInMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetcher, intervalInMs]);
}
