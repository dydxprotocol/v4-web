import { type RefObject, useEffect, useState } from 'react';

export const useSpreadRowScrollListener = ({
  orderbookRef,
  spreadRowRef,
}: {
  orderbookRef: RefObject<HTMLDivElement>;
  spreadRowRef: RefObject<HTMLDivElement>;
}) => {
  const [displaySide, setDisplaySide] = useState<string>();

  useEffect(() => {
    const onScroll = () => {
      if (spreadRowRef.current) {
        const { top } = spreadRowRef.current.getBoundingClientRect();
        const { scrollHeight, scrollTop } = orderbookRef.current || {};

        if (scrollHeight !== undefined && scrollTop !== undefined) {
          if (top > scrollHeight / 2) {
            setDisplaySide('bottom');
          } else if (scrollTop > scrollHeight / 2) {
            setDisplaySide('top');
          } else {
            setDisplaySide(undefined);
          }
        } else {
          setDisplaySide(undefined);
        }
      }
    };

    orderbookRef.current?.addEventListener('scroll', onScroll, false);

    return () => {
      orderbookRef.current?.removeEventListener('scroll', onScroll, false);
    };
  }, [orderbookRef.current]);

  return { displaySide };
};
