import { useEffect, useMemo, useRef, useState } from 'react';

import { clamp, debounce } from 'lodash';

import { timeUnits } from '@/constants/time';

const PANEL_MIN_HEIGHT = 250;
const PANEL_MAX_HEIGHT = 700;

export function useResizablePanel(startSize: number, syncHeight: (h: number) => void) {
  const [horizontalPanelHeight, setHorizontalPanelHeight] = useState(startSize);
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);
  const startHeightRef = useRef(0);

  const debouncedSync = useMemo(() => debounce(syncHeight, timeUnits.second / 2), [syncHeight]);

  const handleMove = (clientY: number) => {
    const dy = startPosRef.current - clientY;
    const newHeight = clamp(startHeightRef.current + dy, PANEL_MIN_HEIGHT, PANEL_MAX_HEIGHT);
    setHorizontalPanelHeight(newHeight);
    debouncedSync(newHeight);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    setIsDragging(true);
    startPosRef.current = e.clientY;
    startHeightRef.current = horizontalPanelHeight;
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientY);
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    setIsDragging(false);
    handleMove(e.clientY);
  };

  // Add event listeners to window to handle mouse moves outside the component
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  return { handleMouseDown, horizontalPanelHeight, isDragging };
}
