import { DEFAULT_QUOTE_ASSET } from '@/constants/markets';

import { Nullable } from '@/lib/typeUtils';

/**
 *
 * @param fullBaseAsset contains base asset, occassionally accompanied (comma-separated) by dex and address. i.e. 'baseAsset,dex,address'
 * @param part base, dex or address
 * @returns base asset or dex or address from the full base asset.
 */
export const getDisplayableAssetFromBaseAsset = (
  fullBaseAsset: Nullable<string>,
  part?: 'base' | 'dex' | 'address'
): string => {
  if (!fullBaseAsset) return '';
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
  if (part === 'full') return fullBaseAsset!;
  return getDisplayableAssetFromBaseAsset(fullBaseAsset!, part);
};

/**
 *
 * @param market contains base asset, occassionally accompanied (comma-separated) by dex and address. i.e. 'baseAsset,dex,address-quoteAsset'
 * @returns a displayable market id by removing the dex and address data.
 */
export const getDisplayableTickerFromMarket = (market: string): string => {
  const [fullBaseAsset, quoteAsset] = market.split('-');
  const base = getDisplayableAssetFromBaseAsset(fullBaseAsset!);

  if (!base || !quoteAsset || !fullBaseAsset) return '';

  return `${base}-${quoteAsset}`;
};

export const getTickerFromMarketmapId = (marketmapId: string): string => {
  return marketmapId.replace('/', '-');
};

export const getAssetFromMarketId = (marketId: string): string => {
  return marketId.split('-')[0]!;
};

/**
 * @param assetId
 * @returns the internal ticker of a market
 */
export const getMarketIdFromAsset = (assetId: string, quoteAsset: string = DEFAULT_QUOTE_ASSET) => {
  return `${assetId}-${quoteAsset}`;
};

const SKIP_NATIVE_DENOM_SUFFIX = 'native';

/**
 * cosmjs and wagmi expect this 0x address to represent a chain's native token address.
 * skip has a unique format that differs from this.
 */
export const WAGMI_COSMJS_NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const isNativeDenom = (denom: string | undefined): boolean => {
  if (!denom) return false;
  return denom === WAGMI_COSMJS_NATIVE_TOKEN_ADDRESS || denom.endsWith(SKIP_NATIVE_DENOM_SUFFIX);
};

export const getAssetDescriptionStringKeys = (assetId: string) => ({
  primary: `APP.__ASSETS.${assetId}.PRIMARY`,
  secondary: `APP.__ASSETS.${assetId}.SECONDARY`,
});
