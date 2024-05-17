import { useCallback, useEffect, useRef } from 'react';

export const useAnimationFrame = (callback: (_: number) => void, deps: React.DependencyList) => {
  const requestRef = useRef<number | undefined>();
  const previousTimeRef = useRef<number | undefined>();

  const animate = useCallback(async (time: number) => {
    if (previousTimeRef.current != null) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;

    requestRef.current = requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
