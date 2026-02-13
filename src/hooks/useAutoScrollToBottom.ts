import { type RefObject, useEffect, useMemo, useRef } from 'react';

import { type Virtualizer } from '@tanstack/react-virtual';
import { debounce } from 'lodash';

const DEBOUNCE_TIME = 200;
const DEFAULT_THRESHOLD = 50;

/**
 * Auto-scrolls a virtualized list to the bottom when new items arrive,
 * but only if the user is already near the bottom. If the user has scrolled
 * up to read older content, new items won't yank them back down.
 *
 * Returns { onScroll } to attach to the scroll container element.
 */
export const useAutoScrollToBottom = ({
  scrollRef,
  virtualizer,
  itemCount,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  itemCount: number;
  threshold?: number;
}) => {
  const isNearBottomRef = useRef(true);

  const onScroll = useMemo(
    () =>
      debounce(() => {
        if (scrollRef.current == null) return;

        const el = scrollRef.current;
        isNearBottomRef.current =
          el.scrollHeight - el.scrollTop - el.clientHeight <= DEFAULT_THRESHOLD;
      }, DEBOUNCE_TIME),
    [scrollRef]
  );

  useEffect(() => {
    if (isNearBottomRef.current) {
      virtualizer.scrollToOffset(virtualizer.getTotalSize(), { align: 'end' });
    }
  }, [itemCount, virtualizer]);

  return { onScroll };
};
