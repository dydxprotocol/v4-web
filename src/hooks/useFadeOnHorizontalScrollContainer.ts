import { RefObject, useCallback, useEffect, useState } from 'react';

/**
 * @description Apply horizontal fade to scroll container when scrollable
 * Assumed that the two sides are the same height
 */
export const useFadeOnHorizontalScrollContainer = ({
  scrollRef,
}: {
  scrollRef?: RefObject<HTMLDivElement>;
}) => {
  const [showFadeStart, setShowFadeStart] = useState(false);
  const [showFadeEnd, setShowFadeEnd] = useState(false);

  const scrollContainer = scrollRef?.current;

  const onScroll = useCallback(() => {
    if (scrollRef?.current) {
      const { clientWidth, scrollWidth, scrollLeft } = scrollRef.current;
      const scrollStart =
        clientWidth != null &&
        scrollWidth != null &&
        scrollLeft != null &&
        scrollWidth > clientWidth &&
        scrollLeft > 0;
      const scrollEnd =
        clientWidth != null &&
        scrollWidth != null &&
        scrollLeft != null &&
        scrollWidth > clientWidth + scrollLeft;

      setShowFadeStart(scrollStart);
      setShowFadeEnd(scrollEnd);
    }
  }, [scrollRef]);

  // Set fade on initial mount of container
  useEffect(() => {
    onScroll();
  });

  // Adjust fade on scroll of container
  useEffect(() => {
    scrollContainer?.addEventListener('scroll', onScroll, false);
    return () => {
      scrollContainer?.removeEventListener('scroll', onScroll, false);
    };
  }, [onScroll, scrollContainer]);

  return {
    showFadeStart,
    showFadeEnd,
  };
};
