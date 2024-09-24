import { describe, expect, it } from 'vitest';

import {
  getDisplayableAssetFromBaseAsset,
  getDisplayableAssetFromTicker,
  getDisplayableTickerFromMarket,
  getTickerFromMarketmapId,
} from '../assetUtils';

const ASSET_WITH_DEX_AND_ADDRESS = 'BUFFI,uniswap_v3,0x4c1b1302220d7de5c22b495e78b72f2dd2457d45';

describe('getDisplayableAssetFromBaseAsset', () => {
  it('should return the displayable base asset from a dex asset string', () => {
    expect(getDisplayableAssetFromBaseAsset(ASSET_WITH_DEX_AND_ADDRESS)).toEqual('BUFFI');
  });

  it('should handle existing base asset with no dex or address', () => {
    expect(getDisplayableAssetFromBaseAsset('ETH')).toEqual('ETH');
  });

  it('should handle empty base strings', () => {
    expect(getDisplayableTickerFromMarket('')).toEqual('');
  });

  it('should return dex from asset string', () => {
    expect(getDisplayableAssetFromBaseAsset(ASSET_WITH_DEX_AND_ADDRESS, 'dex')).toEqual(
      'uniswap_v3'
    );
  });

  it('should return blank if dex is not present', () => {
    expect(getDisplayableAssetFromBaseAsset('BUFFI', 'dex')).toEqual('');
  });

  it('should return address from asset string', () => {
    expect(getDisplayableAssetFromBaseAsset(ASSET_WITH_DEX_AND_ADDRESS, 'address')).toEqual(
      '0x4c1b1302220d7de5c22b495e78b72f2dd2457d45'
    );
  });

  it('should return blank if address is not present', () => {
    expect(getDisplayableAssetFromBaseAsset('BUFFI', 'address')).toEqual('');
  });

  it('should return blank address if invalid asset is provided', () => {
    expect(getDisplayableAssetFromBaseAsset('', 'address')).toEqual('');
  });

  it('should return blank dex if invalid asset is provided', () => {
    expect(getDisplayableAssetFromBaseAsset('', 'dex')).toEqual('');
  });
});

describe('getDisplayableAssetFromTicker', () => {
  it('should return the base asset from a ticker string', () => {
    expect(getDisplayableAssetFromTicker(`${ASSET_WITH_DEX_AND_ADDRESS}-USD`)).toEqual('BUFFI');
  });

  it('should handle existing base asset with no dex or address', () => {
    expect(getDisplayableAssetFromTicker('ETH-USD')).toEqual('ETH');
  });

  it('should handle empty ticker strings', () => {
    expect(getDisplayableAssetFromTicker('')).toEqual('');
  });

  it('should return dex from ticker string', () => {
    expect(getDisplayableAssetFromTicker(`${ASSET_WITH_DEX_AND_ADDRESS}-USD`, 'dex')).toEqual(
      'uniswap_v3'
    );
  });

  it('should return address from ticker string', () => {
    expect(getDisplayableAssetFromTicker(`${ASSET_WITH_DEX_AND_ADDRESS}-USD`, 'address')).toEqual(
      '0x4c1b1302220d7de5c22b495e78b72f2dd2457d45'
    );
  });

  it('should return full base asset from ticker string', () => {
    expect(getDisplayableAssetFromTicker(`${ASSET_WITH_DEX_AND_ADDRESS}-USD`, 'full')).toEqual(
      ASSET_WITH_DEX_AND_ADDRESS
    );
  });
});

describe('getDisplayableTickerFromMarket', () => {
  it('should return the base asset from a market string', () => {
    expect(getDisplayableTickerFromMarket(`${ASSET_WITH_DEX_AND_ADDRESS}-USD`)).toEqual(
      'BUFFI-USD'
    );
  });

  it('should handle existing base asset with no dex or address', () => {
    expect(getDisplayableTickerFromMarket('ETH-USD')).toEqual('ETH-USD');
  });

  it('should handle empty market strings', () => {
    expect(getDisplayableTickerFromMarket('')).toEqual('');
  });

  it('should handle invalid market strings', () => {
    expect(getDisplayableTickerFromMarket('ETH')).toEqual('');
  });
});

describe('getTickerFromMarketmapId', () => {
  it('should return a market ticker from a basic marketmap id', () => {
    expect(getTickerFromMarketmapId('ETH/USD')).toEqual('ETH-USD');
  });

  it('should return a market ticker from a marketmap id w/ dex', () => {
    expect(getTickerFromMarketmapId(`${ASSET_WITH_DEX_AND_ADDRESS}/USD`)).toEqual(
      `${ASSET_WITH_DEX_AND_ADDRESS}-USD`
    );
  });

  it('should handle invalid marketmap id', () => {
    expect(getTickerFromMarketmapId('ETH')).toEqual('ETH');
  });

  it('should handle empty marketmap id', () => {
    expect(getTickerFromMarketmapId('')).toEqual('');
  });
});
