import { useEffect, useRef } from 'react';

/**
 * indicate whether the current render is the first render (when the component was mounted)
 * @returns {boolean} flag to determine first render.
 * @note Using useRef hook to avoid the extra rerender.
 */
export const useIsFirstRender = () => {
  const isFirstRender = useRef(true);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  return isFirstRender.current;
};
