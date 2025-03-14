import { MarketsTable } from '@/views/tables/MarketsTable';

import PortfolioOverview from './PortfolioOverview';

export const MarketsMobile = () => {
  return (
    <div tw="flexColumn h-full overflow-hidden">
      <div tw="flexColumn h-20">
        <PortfolioOverview />
      </div>
      <div tw="flexColumn overflow-y-auto">
        <MarketsTable />
      </div>
    </div>
  );
};
