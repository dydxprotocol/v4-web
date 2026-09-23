import { useCallback, useEffect, useRef } from 'react';

export const useAnimationFrame = (callback: (_: number) => void, enabled = true) => {
  const requestRef = useRef<number | undefined>();
  const previousTimeRef = useRef<number | undefined>();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current != null) {
      const deltaTime = time - previousTimeRef.current;
      callbackRef.current(deltaTime);
    }
    previousTimeRef.current = time;

    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!enabled) {
      previousTimeRef.current = undefined;
      return undefined;
    }

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate, enabled]);
};
