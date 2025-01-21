import { Asset } from '@skip-go/client';

import { Nullable } from '@/constants/abacus';
import { isTokenCctp } from '@/constants/cctp';
import { DEFAULT_QUOTE_ASSET } from '@/constants/markets';
import { NetworkType } from '@/constants/transfers';

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

export const getDefaultTokenDenomFromAssets = (assets: Asset[]): string | undefined => {
  const cctpToken = assets.find((asset) => {
    return isTokenCctp(asset);
  });
  const nativeChainToken = assets.find((asset) => {
    return isNativeDenom(asset.denom);
  });
  const uusdcToken = assets.find((asset) => {
    return asset.denom === 'uusdc' || asset.originDenom === 'uusdc';
  });
  // If not cctp, native chain, or usdc token, default to the first item in the list
  const defaultTokenDenom =
    cctpToken?.denom ?? nativeChainToken?.denom ?? uusdcToken?.denom ?? assets[0]?.denom;
  return defaultTokenDenom;
};

export const getDefaultChainIDFromNetworkType = (networkType: NetworkType): string | undefined => {
  if (networkType === 'evm') return '1';
  if (networkType === 'svm') return 'solana';
  if (networkType === 'cosmos') return 'noble-1';
  return undefined;
};

export const getAssetDescriptionStringKeys = (assetId: string) => ({
  primary: `APP.__ASSETS.${assetId}.PRIMARY`,
  secondary: `APP.__ASSETS.${assetId}.SECONDARY`,
});
