export enum MarketTypeFilter {
  AllMarkets = 'AllMarkets',
  Cross = 'Cross',
  Isolated = 'Isolated',
}

export function marketTypeMatchesFilter(type: 'isolated' | 'cross', filter?: MarketTypeFilter) {
  return (
    filter == null ||
    filter === MarketTypeFilter.AllMarkets ||
    (type === 'cross' && filter === MarketTypeFilter.Cross) ||
    (type === 'isolated' && filter === MarketTypeFilter.Isolated)
  );
}
