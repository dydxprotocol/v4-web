import PortfolioOverview from './PortfolioOverview';

const MarketsMobile = () => {
  return (
    <div tw="flexColumn relative h-full overflow-auto">
      <div tw="flexColumn h-20 min-h-20">
        <PortfolioOverview />
      </div>
      <div tw="flexColumn">Market Table Placeholder</div>
    </div>
  );
};

export default MarketsMobile;
