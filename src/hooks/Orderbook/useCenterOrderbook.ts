import { useEffect, type RefObject } from 'react';

type Props = {
  marketId: string;
  orderbookRef: RefObject<HTMLDivElement>;
  disabled: boolean;
};

/**
 * @description Center Orderbook on load and market change
 * Assumed that the two sides are the same height
 */
export const useCenterOrderbook = ({ marketId, orderbookRef, disabled }: Props) => {
  const orderbookEl = orderbookRef.current;
  const { clientHeight, scrollHeight } = orderbookEl ?? {};
  const shouldScroll = scrollHeight && clientHeight && scrollHeight > clientHeight;

  useEffect(() => {
    if (orderbookEl && shouldScroll && !disabled) {
      orderbookEl.scrollTo({ top: (scrollHeight - clientHeight) / 2 });
    }
  }, [shouldScroll, marketId]);
};
