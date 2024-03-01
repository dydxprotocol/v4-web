import React, { useEffect } from 'react';

import useLatest from 'use-latest';

export type Handler = (event: MouseEvent) => void;

export const useOnClickOutside = ({
  onClickOutside,
  ref,
}: {
  onClickOutside: Handler | null;
  ref: React.RefObject<HTMLElement>;
}) => {
  const onClickOutsideRef = useLatest(onClickOutside);

  useEffect(() => {
    if (!onClickOutside) return;

    const handleClickOutside: (e: MouseEvent) => void = (e) => {
      if (ref.current && onClickOutsideRef.current && !ref.current.contains(e.target as Node)) {
        onClickOutsideRef.current(e);
      }
    };

    const timeoutId = setTimeout(() => {
      globalThis.addEventListener('click', handleClickOutside);
    }, 1);

    return () => {
      clearTimeout(timeoutId);
      globalThis.removeEventListener('click', handleClickOutside);
    };
  }, [!onClickOutside]);
};
