/**
 *
 * @param fullBaseAsset contains base asset, occassionally accompanied (comma-separated) by dex and address. i.e. 'baseAsset,dex,address'
 * @param part base, dex or address
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
 * @param ticker baseAsset-quoteAsset
 * @param part base, dex or address
 * @returns desired part of the base asset from ticker
 */
export const getDisplayableAssetFromTicker = (
  ticker: string,
  part?: 'base' | 'dex' | 'address' | 'full'
): string => {
  const [fullBaseAsset] = ticker.split('-');
  if (part === 'full') return fullBaseAsset;
  return getDisplayableAssetFromBaseAsset(fullBaseAsset, part);
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

export const getTickerFromMarketmapId = (marketmapId: string): string => {
  return marketmapId.replace('/', '-');
};

export const getAssetFromMarketId = (marketId: string): string => {
  return marketId.split('-')[0];
};

const SKIP_NATIVE_DENOM_SUFFIX = 'native';

/**
 * cosmjs uses this 0x address as the chain's native token.
 * skip does not, but we add this value in order to be able to send payloads to cosmjs
 * @todo We may need to add additional logic here if we 'useAccountBalance' on forms that do not follow this format.
 */
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const isNativeDenom = (denom: string | undefined): boolean => {
  if (!denom) return false;
  return denom === NATIVE_TOKEN_ADDRESS || denom?.endsWith(SKIP_NATIVE_DENOM_SUFFIX);
};
