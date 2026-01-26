import {
  selectAllMarketConfigs,
  selectMarketConfigByAsset,
  selectMarketConfigById,
  selectMarketConfigsError,
  selectMarketConfigsFetchStatus,
  selectMarketConfigsState,
} from '@sdk/Trading/src/Markets/infrastructure/redux/MarketConfigs/selectors';
import { marketConfigsAdapter } from '@sdk/Trading/src/Markets/infrastructure/redux/MarketConfigs/types';
import type { RootState } from '@sdk/shared/lib/redux';
import { assetId, marketConfigId } from '@sdk/shared/types';
import { describe, expect, it } from 'vitest';
import { createTestMarketConfig } from '../test-fixtures/markets';

function createMockRootState(
  marketConfigsState = marketConfigsAdapter.getInitialState({
    fetchStatus: 'uninitialized' as const,
    error: null,
  })
): RootState {
  return {
    trading: {
      markets: {
        marketConfigs: marketConfigsState,
        assetPrices: {} as any,
        assets: {} as any,
      },
      positions: {} as any,
    },
    accounts: {
      wallet: {} as any,
    },
  } as RootState;
}

describe('MarketConfigs Selectors', () => {
  describe('selectMarketConfigsState', () => {
    it('should select the market configs state from root state', () => {
      const initialState = marketConfigsAdapter.getInitialState({
        fetchStatus: 'fulfilled' as const,
        error: null,
      });
      const state = createMockRootState(initialState);

      const result = selectMarketConfigsState(state);

      expect(result).toBe(initialState);
      expect(result.fetchStatus).toBe('fulfilled');
    });
  });

  describe('selectAllMarketConfigs', () => {
    it('should return empty array when no configs', () => {
      const state = createMockRootState();

      const result = selectAllMarketConfigs(state);

      expect(result).toEqual([]);
    });

    it('should return all market configs', () => {
      const config1 = createTestMarketConfig({ id: marketConfigId('config-1') });
      const config2 = createTestMarketConfig({ id: marketConfigId('config-2') });
      const marketConfigsState = marketConfigsAdapter.addMany(
        marketConfigsAdapter.getInitialState({ fetchStatus: 'fulfilled' as const, error: null }),
        [config1, config2]
      );
      const state = createMockRootState(marketConfigsState);

      const result = selectAllMarketConfigs(state);

      expect(result).toHaveLength(2);
    });
  });

  describe('selectMarketConfigById', () => {
    it('should return config by id', () => {
      const config = createTestMarketConfig({ id: marketConfigId('config-1') });
      const marketConfigsState = marketConfigsAdapter.addOne(
        marketConfigsAdapter.getInitialState({ fetchStatus: 'fulfilled' as const, error: null }),
        config
      );
      const state = createMockRootState(marketConfigsState);

      const result = selectMarketConfigById(state, marketConfigId('config-1'));

      expect(result).toEqual(config);
    });

    it('should return undefined for non-existent id', () => {
      const state = createMockRootState();

      const result = selectMarketConfigById(state, marketConfigId('non-existent'));

      expect(result).toBeUndefined();
    });
  });

  describe('selectMarketConfigsFetchStatus', () => {
    it('should return uninitialized status', () => {
      const state = createMockRootState();

      const result = selectMarketConfigsFetchStatus(state);

      expect(result).toBe('uninitialized');
    });

    it('should return fulfilled status', () => {
      const marketConfigsState = marketConfigsAdapter.getInitialState({
        fetchStatus: 'fulfilled' as const,
        error: null,
      });
      const state = createMockRootState(marketConfigsState);

      const result = selectMarketConfigsFetchStatus(state);

      expect(result).toBe('fulfilled');
    });

    it('should return pending status', () => {
      const marketConfigsState = marketConfigsAdapter.getInitialState({
        fetchStatus: 'pending' as const,
        error: null,
      });
      const state = createMockRootState(marketConfigsState);

      const result = selectMarketConfigsFetchStatus(state);

      expect(result).toBe('pending');
    });
  });

  describe('selectMarketConfigsError', () => {
    it('should return null when no error', () => {
      const state = createMockRootState();

      const result = selectMarketConfigsError(state);

      expect(result).toBeNull();
    });

    it('should return error message', () => {
      const marketConfigsState = marketConfigsAdapter.getInitialState({
        fetchStatus: 'rejected' as const,
        error: 'Failed to fetch market configs',
      });
      const state = createMockRootState(marketConfigsState);

      const result = selectMarketConfigsError(state);

      expect(result).toBe('Failed to fetch market configs');
    });
  });

  describe('selectMarketConfigByAsset', () => {
    it('should return config by asset id', () => {
      const btcAssetId = assetId('0xbtc');
      const ethAssetId = assetId('0xeth');
      const btcConfig = createTestMarketConfig({
        id: marketConfigId('config-btc'),
        asset: btcAssetId,
      });
      const ethConfig = createTestMarketConfig({
        id: marketConfigId('config-eth'),
        asset: ethAssetId,
      });
      const marketConfigsState = marketConfigsAdapter.addMany(
        marketConfigsAdapter.getInitialState({ fetchStatus: 'fulfilled' as const, error: null }),
        [btcConfig, ethConfig]
      );
      const state = createMockRootState(marketConfigsState);

      const result = selectMarketConfigByAsset(state, btcAssetId);

      expect(result).toEqual(btcConfig);
    });

    it('should return undefined for non-existent asset', () => {
      const config = createTestMarketConfig({ asset: assetId('0xbtc') });
      const marketConfigsState = marketConfigsAdapter.addOne(
        marketConfigsAdapter.getInitialState({ fetchStatus: 'fulfilled' as const, error: null }),
        config
      );
      const state = createMockRootState(marketConfigsState);

      const result = selectMarketConfigByAsset(state, assetId('0xnonexistent'));

      expect(result).toBeUndefined();
    });
  });
});
