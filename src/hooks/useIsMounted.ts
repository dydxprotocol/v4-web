import { useCallback, useEffect, useRef } from 'react';

/**
 * @description Custom hook that determines if the component is currently mounted.
 * @url https://usehooks-ts.com/react-hook/use-is-mounted
 */
export function useIsMounted(): () => boolean {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
}
