import { useEffect, useState, type RefObject } from 'react';

export const useOrderbookMiddleRowScrollListener = ({
  orderbookRef,
  orderbookMiddleRowRef,
}: {
  orderbookRef: RefObject<HTMLDivElement>;
  orderbookMiddleRowRef: RefObject<HTMLDivElement>;
}) => {
  const [displaySide, setDisplaySide] = useState<string>();

  useEffect(() => {
    const onScroll = () => {
      if (orderbookMiddleRowRef.current && orderbookRef.current) {
        const { clientHeight } = orderbookRef.current;
        const parent = orderbookRef.current.getBoundingClientRect();
        const middleRow = orderbookMiddleRowRef.current.getBoundingClientRect();
        const middleRowTop = middleRow.top - parent.top;
        const middleRowBottom = middleRow.bottom - parent.top;

        if (middleRowBottom > clientHeight) {
          setDisplaySide('bottom');
        } else if (middleRowTop < 0) {
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
  }, [orderbookRef.current, orderbookMiddleRowRef.current]);

  return displaySide;
};
