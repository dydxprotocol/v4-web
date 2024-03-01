import { useEffect } from 'react';

type ElementProps = {
  callback?: () => void;
  periodInMs?: number;
};

export const useInterval = ({ callback, periodInMs = 1000 }: ElementProps) => {
  useEffect(() => {
    callback?.();

    const interval = setInterval(() => {
      callback?.();
    }, periodInMs);

    return () => clearInterval(interval);
  }, [callback, periodInMs]);
};
