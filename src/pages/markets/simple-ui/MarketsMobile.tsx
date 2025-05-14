import { MarketList } from './markets-view/MarketList';
import { PortfolioOverview } from './portfolio-overview/PortfolioOverview';

const MarketsMobile = () => {
  return (
    <div tw="flexColumn relative h-[100vh]">
      <div tw="h-full flex-1">
        <MarketList
          slotTop={{
            content: <PortfolioOverview tw="w-[100vw]" />,
            height: 200,
          }}
        />
      </div>
    </div>
  );
};

export default MarketsMobile;
