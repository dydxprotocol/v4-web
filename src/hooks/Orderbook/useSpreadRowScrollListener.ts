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
      if (spreadRowRef.current && orderbookRef.current) {
        const { clientHeight } = orderbookRef.current;
        const parent = orderbookRef.current.getBoundingClientRect();
        const spread = spreadRowRef.current.getBoundingClientRect();
        const spreadTop = spread.top - parent.top;
        const spreadBottom = spread.bottom - parent.top;

        if (spreadBottom > clientHeight) {
          setDisplaySide('bottom');
        } else if (spreadTop < 0) {
          setDisplaySide('top');
        } else {
          setDisplaySide(undefined);
        }
      }
    };

    orderbookRef.current?.addEventListener('scroll', onScroll, false);

    return () => {
      orderbookRef.current?.removeEventListener('scroll', onScroll, false);
    };
  }, [orderbookRef.current, spreadRowRef.current]);

  return displaySide;
};
