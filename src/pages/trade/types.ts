import { MarginMode } from '@/abacus-ts/summaryTypes';

export enum MarketTypeFilter {
  AllMarkets = 'AllMarkets',
  Cross = 'Cross',
  Isolated = 'Isolated',
}

export function marketTypeMatchesFilter(type: 'Isolated' | 'Cross', filter?: MarketTypeFilter) {
  return (
    filter == null ||
    filter === MarketTypeFilter.AllMarkets ||
    (type === 'Isolated' && filter === MarketTypeFilter.Isolated) ||
    (type === 'Cross' && filter === MarketTypeFilter.Cross)
  );
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
