import { MarketsList } from './markets-view/MarketsList';
import PortfolioOverview from './portfolio-overview/PortfolioOverview';

const MarketsMobile = () => {
  return (
    <div tw="flexColumn relative h-full overflow-auto">
      <div tw="flexColumn h-20 min-h-20">
        <PortfolioOverview />
      </div>
      <div tw="flexColumn h-full">
        <MarketsList />
      </div>
    </div>
  );
};

export default MarketsMobile;
