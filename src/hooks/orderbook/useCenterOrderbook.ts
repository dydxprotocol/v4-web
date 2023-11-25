import { type RefObject, useEffect } from 'react';

type ElementProps = {
  marketId: string;
  orderbookRef: RefObject<HTMLDivElement>;
};

/**
 * @description Center Orderbook on load and market change
 * Assumed that the two sides are the same height
 */
export const useCenterOrderbook = ({ marketId, orderbookRef }: ElementProps) => {
  useEffect(() => {
    if (orderbookRef.current) {
      const { clientHeight, scrollHeight } = orderbookRef.current;
      orderbookRef.current.scrollTo({ top: (scrollHeight - clientHeight) / 2 });
    }
  }, [orderbookRef.current, marketId]);
};
