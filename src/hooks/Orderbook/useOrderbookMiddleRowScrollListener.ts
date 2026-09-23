import { useEffect, useState, type RefObject } from 'react';

export const getOrderbookDisplaySide = ({
  clientHeight,
  parentTop,
  middleTop,
  middleBottom,
}: {
  clientHeight: number;
  parentTop: number;
  middleTop: number;
  middleBottom: number;
}) => {
  if (middleBottom - parentTop > clientHeight) return 'bottom';
  if (middleTop - parentTop < 0) return 'top';
  return undefined;
};

export const useOrderbookMiddleRowScrollListener = ({
  orderbookRef,
  orderbookMiddleRowRef,
}: {
  orderbookRef: RefObject<HTMLDivElement>;
  orderbookMiddleRowRef: RefObject<HTMLDivElement>;
}) => {
  const [displaySide, setDisplaySide] = useState<'top' | 'bottom'>();

  useEffect(() => {
    const orderbook = orderbookRef.current;
    const middleRow = orderbookMiddleRowRef.current;
    if (!orderbook || !middleRow) return undefined;

    let animationFrame: number | undefined;
    const onScroll = () => {
      if (animationFrame != null) return;

      animationFrame = requestAnimationFrame(() => {
        const parentRect = orderbook.getBoundingClientRect();
        const middleRect = middleRow.getBoundingClientRect();
        setDisplaySide(
          getOrderbookDisplaySide({
            clientHeight: orderbook.clientHeight,
            parentTop: parentRect.top,
            middleTop: middleRect.top,
            middleBottom: middleRect.bottom,
          })
        );
        animationFrame = undefined;
      });
    };

    onScroll();
    orderbook.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      orderbook.removeEventListener('scroll', onScroll);
      if (animationFrame != null) cancelAnimationFrame(animationFrame);
    };
  }, [orderbookMiddleRowRef, orderbookRef]);

  return displaySide;
};
