import { describe, expect, it } from 'vitest';

import { getDisplayableAssetFromBaseAsset, getDisplayableTickerFromMarket } from '../assetUtils';

describe('getDisplayableAssetFromBaseAsset', () => {
  it('should return the displayable base asset from a dex asset string', () => {
    expect(
      getDisplayableAssetFromBaseAsset(
        'BUFFI,uniswap_v3,0x4c1b1302220d7de5c22b495e78b72f2dd2457d45'
      )
    ).toEqual('BUFFI');
  });

  it('should handle existing base asset with no dex or address', () => {
    expect(getDisplayableAssetFromBaseAsset('ETH')).toEqual('ETH');
  });

  it('should handle empty base strings', () => {
    expect(getDisplayableTickerFromMarket('')).toEqual('');
  });
});

describe('getDisplayableTickerFromMarket', () => {
  it('should return the base asset from a market string', () => {
    expect(
      getDisplayableTickerFromMarket(
        'BUFFI,uniswap_v3,0x4c1b1302220d7de5c22b495e78b72f2dd2457d45-USD'
      )
    ).toEqual('BUFFI-USD');
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
