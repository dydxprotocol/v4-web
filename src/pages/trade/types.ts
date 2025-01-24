import { MarginMode } from '@/bonsai/types/summaryTypes';

export enum MarketTypeFilter {
  AllMarkets = 'AllMarkets',
  Cross = 'Cross',
  Isolated = 'Isolated',
}

export function marginModeMatchesFilter(type: MarginMode, filter?: MarketTypeFilter) {
  return (
    filter == null ||
    filter === MarketTypeFilter.AllMarkets ||
    (type === 'ISOLATED' && filter === MarketTypeFilter.Isolated) ||
    (type === 'CROSS' && filter === MarketTypeFilter.Cross)
  );
}

export enum PanelView {
  AllMarkets = 'AllMarkets',
  CurrentMarket = 'CurrentMarket',
}
