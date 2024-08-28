/**
 *
 * @param fullBaseAsset contains base asset, occassionally accompanied (comma-separated) by dex and address. i.e. 'baseAsset,dex,address'
 * @param part
 * @returns base asset or dex or address from the full base asset.
 */
export const getDisplayableAssetFromBaseAsset = (
  fullBaseAsset: string,
  part?: 'base' | 'dex' | 'address'
): string => {
  const [base = '', dex = '', address = ''] = fullBaseAsset.split(',');
  if (part === 'dex') return dex;
  if (part === 'address') return address;
  return base;
};

/**
 *
 * @param market contains base asset, occassionally accompanied (comma-separated) by dex and address. i.e. 'baseAsset,dex,address-quoteAsset'
 * @returns a displayable market id by removing the dex and address data.
 */
export const getDisplayableTickerFromMarket = (market: string): string => {
  const [fullBaseAsset, quoteAsset] = market.split('-');
  const base = getDisplayableAssetFromBaseAsset(fullBaseAsset);

  if (!base || !quoteAsset || !fullBaseAsset) return '';

  return `${base}-${quoteAsset}`;
};
