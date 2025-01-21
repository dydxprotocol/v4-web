export enum MarketTypeFilter {
  AllMarkets = 'AllMarkets',
  Cross = 'Cross',
  Isolated = 'Isolated',
}

export function marketTypeMatchesFilter(
  type: 'ISOLATED' | 'CROSS' | undefined,
  filter?: MarketTypeFilter
) {
  return (
    filter == null ||
    filter === MarketTypeFilter.AllMarkets ||
    (type === 'ISOLATED' && filter === MarketTypeFilter.Isolated) ||
    ((type === 'CROSS' || type == null) && filter === MarketTypeFilter.Cross)
  );
}

export enum PanelView {
  AllMarkets = 'AllMarkets',
  CurrentMarket = 'CurrentMarket',
}
