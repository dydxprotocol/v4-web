export const getDisplayableAssetFromBaseAsset = (
  fullBaseAsset: string,
  part?: 'base' | 'dex' | 'address'
): string => {
  const [base = '', dex = '', address = ''] = fullBaseAsset.split(',');
  if (part === 'dex') return dex;
  if (part === 'address') return address;
  return base;
};

export const getDisplayableTickerFromMarket = (market: string): string => {
  const [fullBaseAsset, quoteAsset] = market.split('-');
  const base = getDisplayableAssetFromBaseAsset(fullBaseAsset);

  if (!base || !quoteAsset || !fullBaseAsset) return '';

  return `${base}-${quoteAsset}`;
};
