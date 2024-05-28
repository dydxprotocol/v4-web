export enum IsolatedPanelFilter {
  AllMarkets = 'AllMarkets',
  Cross = 'Cross',
  Isolated = 'Isolated',
}

export function marketTypeMatchesFilter(type: 'isolated' | 'cross', filter?: IsolatedPanelFilter) {
  return (
    filter == null ||
    filter === IsolatedPanelFilter.AllMarkets ||
    (type === 'cross' && filter === IsolatedPanelFilter.Cross) ||
    (type === 'isolated' && filter === IsolatedPanelFilter.Isolated)
  );
}
