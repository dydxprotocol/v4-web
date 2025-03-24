import { useMemo, useState } from 'react';

import { ListOnScrollProps } from 'react-window';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { MarketsList } from './markets-view/MarketsList';
import PortfolioOverview from './portfolio-overview/PortfolioOverview';

// Config values for the animation
const PORTFOLIO_MAX_HEIGHT = 320; // Starting height in pixels

const MarketsMobile = () => {
  const stringGetter = useStringGetter();
  const [scrollPosition, setScrollPosition] = useState(0);

  const onScroll = (listProps: ListOnScrollProps) => {
    setScrollPosition(listProps.scrollOffset);
  };

  // Calculate portfolio styles based on scroll position
  const portfolioStyles = useMemo(() => {
    // Calculate translateY to move the element off screen
    const translateY = -Math.min(scrollPosition, PORTFOLIO_MAX_HEIGHT);

    return {
      maxHeight: `${PORTFOLIO_MAX_HEIGHT + translateY}px`,
      transform: `translateY(${translateY}px)`,
      transition: 'height 0.1s ease-out',
    } satisfies React.CSSProperties;
  }, [scrollPosition]);

  return (
    <div tw="flexColumn relative h-full">
      <div style={portfolioStyles}>
        <PortfolioOverview />
      </div>
      <div tw="row h-2 px-1.25 font-small-bold">{stringGetter({ key: STRING_KEYS.MARKETS })}</div>
      <div tw="flex-1">
        <MarketsList onScroll={onScroll} />
      </div>
    </div>
  );
};

export default MarketsMobile;
