import { OraclePrice, PercentageValue } from '@/shared/models/decimals';
import { createStoreService } from '@/shared/lib/store-service';
import type { RootState } from '@/shared/lib/redux';
import { assetId } from '@/shared/types';
import { describe, expect, it } from 'vitest';

import type { MarketConfig } from '../../src/markets/domain';
import { createMarketDataService } from '../../src/markets/services/market-data.service';

const createMockStore = (state: Partial<RootState>) => {
  return {
    getState: () => state as RootState,
    dispatch: () => {},
  } as any;
};

describe('Markets Service', () => {
  describe('getMarketConfig', () => {
    it('should return market configuration when data is fulfilled', () => {
      const asset = assetId('0xeth');
      const mockConfig: MarketConfig = {
        initialMarginFraction: 50000000000000000n,
        maintenanceMarginFraction: PercentageValue.fromBigInt(25000000000000000n),
        tickSizeDecimals: 2,
        stepSizeDecimals: 4,
      };

      const mockStore = createMockStore({
        trading: {
          markets: {
            marketConfigs: {
              data: { [asset]: mockConfig },
              fetchStatus: 'fulfilled',
              error: null,
            },
            oraclePrices: {
              data: {},
              fetchStatus: 'idle',
              error: null,
            },
          },
          positions: {
            data: {},
            fetchStatus: 'idle',
            error: null,
          },
        },
      });

      const storeService = createStoreService(mockStore);
      const service = createMarketDataService(storeService);
      const result = service.getMarketConfig(asset);

      expect(result.status).toBe('fulfilled');
      if (result.status === 'fulfilled') {
        expect(result.data.initialMarginFraction).toBe(50000000000000000n);
        expect(result.data.maintenanceMarginFraction.value).toBe(25000000000000000n);
        expect(result.data.tickSizeDecimals).toBe(2);
        expect(result.data.stepSizeDecimals).toBe(4);
      }
    });

    it('should return idle status when data not yet fetched', () => {
      const asset = assetId('0xeth');

      const mockStore = createMockStore({
        trading: {
          markets: {
            marketConfigs: {
              data: {},
              fetchStatus: 'idle',
              error: null,
            },
            oraclePrices: {
              data: {},
              fetchStatus: 'idle',
              error: null,
            },
          },
          positions: {
            data: {},
            fetchStatus: 'idle',
            error: null,
          },
        },
      });

      const storeService = createStoreService(mockStore);
      const service = createMarketDataService(storeService);
      const result = service.getMarketConfig(asset);

      expect(result.status).toBe('idle');
    });

    it('should return pending status when data is loading', () => {
      const asset = assetId('0xeth');

      const mockStore = createMockStore({
        trading: {
          markets: {
            marketConfigs: {
              data: {},
              fetchStatus: 'pending',
              error: null,
            },
            oraclePrices: {
              data: {},
              fetchStatus: 'idle',
              error: null,
            },
          },
          positions: {
            data: {},
            fetchStatus: 'idle',
            error: null,
          },
        },
      });

      const storeService = createStoreService(mockStore);
      const service = createMarketDataService(storeService);
      const result = service.getMarketConfig(asset);

      expect(result.status).toBe('pending');
    });

    it('should return rejected status on error', () => {
      const asset = assetId('0xeth');

      const mockStore = createMockStore({
        trading: {
          markets: {
            marketConfigs: {
              data: {},
              fetchStatus: 'rejected',
              error: 'Network error',
            },
            oraclePrices: {
              data: {},
              fetchStatus: 'idle',
              error: null,
            },
          },
          positions: {
            data: {},
            fetchStatus: 'idle',
            error: null,
          },
        },
      });

      const storeService = createStoreService(mockStore);
      const service = createMarketDataService(storeService);
      const result = service.getMarketConfig(asset);

      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.error).toBe('Network error');
      }
    });
  });

  describe('getOraclePrice', () => {
    it('should return oracle price when data is fulfilled', () => {
      const asset = assetId('0xeth');
      const mockPrice = OraclePrice.fromBigInt(2000000000000000000000n);

      const mockStore = createMockStore({
        trading: {
          markets: {
            oraclePrices: {
              data: { [asset]: mockPrice },
              fetchStatus: 'fulfilled',
              error: null,
            },
            marketConfigs: {
              data: {},
              fetchStatus: 'idle',
              error: null,
            },
          },
          positions: {
            data: {},
            fetchStatus: 'idle',
            error: null,
          },
        },
      });

      const storeService = createStoreService(mockStore);
      const service = createMarketDataService(storeService);
      const result = service.getOraclePrice(asset);

      expect(result.status).toBe('fulfilled');
      if (result.status === 'fulfilled') {
        expect(result.data.value).toBe(2000000000000000000000n);
      }
    });

    it('should return idle status when price not yet fetched', () => {
      const asset = assetId('0xeth');

      const mockStore = createMockStore({
        trading: {
          markets: {
            oraclePrices: {
              data: {},
              fetchStatus: 'idle',
              error: null,
            },
            marketConfigs: {
              data: {},
              fetchStatus: 'idle',
              error: null,
            },
          },
          positions: {
            data: {},
            fetchStatus: 'idle',
            error: null,
          },
        },
      });

      const storeService = createStoreService(mockStore);
      const service = createMarketDataService(storeService);
      const result = service.getOraclePrice(asset);

      expect(result.status).toBe('idle');
    });

    it('should return rejected status on error', () => {
      const asset = assetId('0xeth');

      const mockStore = createMockStore({
        trading: {
          markets: {
            oraclePrices: {
              data: {},
              fetchStatus: 'rejected',
              error: 'Failed to fetch oracle price',
            },
            marketConfigs: {
              data: {},
              fetchStatus: 'idle',
              error: null,
            },
          },
          positions: {
            data: {},
            fetchStatus: 'idle',
            error: null,
          },
        },
      });

      const storeService = createStoreService(mockStore);
      const service = createMarketDataService(storeService);
      const result = service.getOraclePrice(asset);

      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.error).toBe('Failed to fetch oracle price');
      }
    });
  });

  describe('getOraclePrices', () => {
    it('should return multiple oracle prices when data is fulfilled', () => {
      const ethAsset = assetId('0xeth');
      const btcAsset = assetId('0xbtc');
      const ethPrice = OraclePrice.fromBigInt(2000000000000000000000n);
      const btcPrice = OraclePrice.fromBigInt(40000000000000000000000n);

      const mockStore = createMockStore({
        trading: {
          markets: {
            oraclePrices: {
              data: {
                [ethAsset]: ethPrice,
                [btcAsset]: btcPrice,
              },
              fetchStatus: 'fulfilled',
              error: null,
            },
            marketConfigs: {
              data: {},
              fetchStatus: 'idle',
              error: null,
            },
          },
          positions: {
            data: {},
            fetchStatus: 'idle',
            error: null,
          },
        },
      });

      const storeService = createStoreService(mockStore);
      const service = createMarketDataService(storeService);
      const result = service.getOraclePrices([ethAsset, btcAsset]);

      expect(result.status).toBe('fulfilled');
      if (result.status === 'fulfilled') {
        expect(result.data.size).toBe(2);
        expect(result.data.get(ethAsset)?.value).toBe(2000000000000000000000n);
        expect(result.data.get(btcAsset)?.value).toBe(40000000000000000000000n);
      }
    });

    it('should return empty map when no prices found', () => {
      const asset = assetId('0xnonexistent');

      const mockStore = createMockStore({
        trading: {
          markets: {
            oraclePrices: {
              data: {},
              fetchStatus: 'fulfilled',
              error: null,
            },
            marketConfigs: {
              data: {},
              fetchStatus: 'idle',
              error: null,
            },
          },
          positions: {
            data: {},
            fetchStatus: 'idle',
            error: null,
          },
        },
      });

      const storeService = createStoreService(mockStore);
      const service = createMarketDataService(storeService);
      const result = service.getOraclePrices([asset]);

      expect(result.status).toBe('fulfilled');
      if (result.status === 'fulfilled') {
        expect(result.data.size).toBe(0);
      }
    });

    it('should handle partial results', () => {
      const ethAsset = assetId('0xeth');
      const btcAsset = assetId('0xbtc');
      const ethPrice = OraclePrice.fromBigInt(2000000000000000000000n);

      const mockStore = createMockStore({
        trading: {
          markets: {
            oraclePrices: {
              data: {
                [ethAsset]: ethPrice,
              },
              fetchStatus: 'fulfilled',
              error: null,
            },
            marketConfigs: {
              data: {},
              fetchStatus: 'idle',
              error: null,
            },
          },
          positions: {
            data: {},
            fetchStatus: 'idle',
            error: null,
          },
        },
      });

      const storeService = createStoreService(mockStore);
      const service = createMarketDataService(storeService);
      const result = service.getOraclePrices([ethAsset, btcAsset]);

      expect(result.status).toBe('fulfilled');
      if (result.status === 'fulfilled') {
        expect(result.data.size).toBe(1);
        expect(result.data.has(ethAsset)).toBe(true);
        expect(result.data.has(btcAsset)).toBe(false);
      }
    });
  });
});
