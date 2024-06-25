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
