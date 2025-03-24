import { useMemo, useState } from 'react';

import { ListOnScrollProps } from 'react-window';

import { MarketsList } from './markets-view/MarketsList';
import PortfolioOverview from './portfolio-overview/PortfolioOverview';

// Config values for the animation
const PORTFOLIO_MAX_HEIGHT = 320; // Starting height in pixels
const PORTFOLIO_MIN_HEIGHT = 0; // Collapsed height
const COLLAPSE_THRESHOLD = 320; // Scroll threshold for complete collapse

const MarketsMobile = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  const onScroll = (listProps: ListOnScrollProps) => {
    setScrollPosition(listProps.scrollOffset);
  };

  // Calculate portfolio styles based on scroll position
  const portfolioStyles = useMemo(() => {
    // Calculate height based on scroll position
    const heightProgress = Math.min(scrollPosition / COLLAPSE_THRESHOLD, 1);
    const portfolioContainerHeight =
      PORTFOLIO_MAX_HEIGHT - heightProgress * (PORTFOLIO_MAX_HEIGHT - PORTFOLIO_MIN_HEIGHT);

    return {
      height: `${portfolioContainerHeight}px`,
      transform: `translateY(0 - ${portfolioContainerHeight}px)`,
      transition: 'transform 0.1s ease-out',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 2,
    } satisfies React.CSSProperties;
  }, [scrollPosition]);

  return (
    <div tw="flexColumn relative h-full">
      <div style={portfolioStyles}>
        <PortfolioOverview />
      </div>
      <div tw="row sticky top-0 h-2 px-1.25 font-small-bold">Markets</div>
      <div tw="flex-1">
        <MarketsList onScroll={onScroll} />
      </div>
    </div>
  );
};

export default MarketsMobile;
