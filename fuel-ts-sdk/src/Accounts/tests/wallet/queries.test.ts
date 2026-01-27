import { createGetCurrentUserAddressQuery } from '@sdk/Accounts/src/Wallet/application/queries/getCurrentUserAddress';
import { createGetCurrentUserAssetBalanceQuery } from '@sdk/Accounts/src/Wallet/application/queries/getCurrentUserAssetBalance';
import { createGetCurrentUserBalancesQuery } from '@sdk/Accounts/src/Wallet/application/queries/getCurrentUserBalances';
import { createGetCurrentUserDataFetchStatusQuery } from '@sdk/Accounts/src/Wallet/application/queries/getCurrentUserDataFetchStatus';
import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { RootState } from '@sdk/shared/lib/redux';
import { describe, expect, it, vi } from 'vitest';
import {
  TEST_ADDRESS,
  TEST_BTC_ASSET_ID,
  TEST_ETH_ASSET_ID,
  TEST_USDC_ASSET_ID,
  createRejectedCurrentUserState,
  createTestCurrentUserState,
  createTestWalletEntity,
  createUninitializedCurrentUserState,
} from '../test-fixtures/wallet';

function createMockStoreService(currentUserState = createTestCurrentUserState()): StoreService {
  const state = {
    accounts: {
      wallet: {
        currentUser: currentUserState,
      },
    },
  } as RootState;

  return {
    dispatch: vi.fn(),
    select: vi.fn((selector) => selector(state)),
    getState: vi.fn(() => state),
  };
}

describe('Wallet Queries', () => {
  describe('getCurrentUserAddress', () => {
    it('should return the user address when data is available', () => {
      const mockStoreService = createMockStoreService();
      const query = createGetCurrentUserAddressQuery({ storeService: mockStoreService });

      const result = query();

      expect(result).toBe(TEST_ADDRESS);
    });

    it('should return undefined when user data is null', () => {
      const mockStoreService = createMockStoreService(createTestCurrentUserState({ data: null }));
      const query = createGetCurrentUserAddressQuery({ storeService: mockStoreService });

      const result = query();

      expect(result).toBeUndefined();
    });

    it('should return undefined when user data is undefined', () => {
      const mockStoreService = createMockStoreService(createUninitializedCurrentUserState());
      const query = createGetCurrentUserAddressQuery({ storeService: mockStoreService });

      const result = query();

      expect(result).toBeUndefined();
    });
  });

  describe('getCurrentUserAssetBalance', () => {
    it('should return balance for existing asset', () => {
      const mockStoreService = createMockStoreService();
      const query = createGetCurrentUserAssetBalanceQuery({ storeService: mockStoreService });

      const result = query(TEST_USDC_ASSET_ID);

      expect(result).toBeDefined();
      expect(result?.decimals).toBe(9);
    });

    it('should return zero for non-existent asset', () => {
      const mockStoreService = createMockStoreService();
      const query = createGetCurrentUserAssetBalanceQuery({ storeService: mockStoreService });

      const result = query(TEST_ETH_ASSET_ID);

      expect(result.value).toBe('0');
    });

    it('should return zero when assetId is null', () => {
      const mockStoreService = createMockStoreService();
      const query = createGetCurrentUserAssetBalanceQuery({ storeService: mockStoreService });

      const result = query(null);

      expect(result.value).toBe('0');
    });

    it('should return zero when assetId is undefined', () => {
      const mockStoreService = createMockStoreService();
      const query = createGetCurrentUserAssetBalanceQuery({ storeService: mockStoreService });

      const result = query(undefined);

      expect(result.value).toBe('0');
    });

    it('should return zero when user data is not available', () => {
      const mockStoreService = createMockStoreService(createUninitializedCurrentUserState());
      const query = createGetCurrentUserAssetBalanceQuery({ storeService: mockStoreService });

      const result = query(TEST_USDC_ASSET_ID);

      expect(result.value).toBe('0');
    });
  });

  describe('getCurrentUserBalances', () => {
    it('should return all balances when data is available', () => {
      const mockStoreService = createMockStoreService();
      const query = createGetCurrentUserBalancesQuery({ storeService: mockStoreService });

      const result = query();

      expect(result).toBeDefined();
      expect(result![TEST_USDC_ASSET_ID]).toBeDefined();
      expect(result![TEST_BTC_ASSET_ID]).toBeDefined();
    });

    it('should return empty balances object', () => {
      const mockStoreService = createMockStoreService(
        createTestCurrentUserState({
          data: createTestWalletEntity({ balances: {} }),
        })
      );
      const query = createGetCurrentUserBalancesQuery({ storeService: mockStoreService });

      const result = query();

      expect(result).toEqual({});
    });

    it('should return undefined when user data is not available', () => {
      const mockStoreService = createMockStoreService(createUninitializedCurrentUserState());
      const query = createGetCurrentUserBalancesQuery({ storeService: mockStoreService });

      const result = query();

      expect(result).toBeUndefined();
    });
  });

  describe('getCurrentUserDataFetchStatus', () => {
    it('should return fulfilled status', () => {
      const mockStoreService = createMockStoreService();
      const query = createGetCurrentUserDataFetchStatusQuery({ storeService: mockStoreService });

      const result = query();

      expect(result).toBe('fulfilled');
    });

    it('should return uninitialized status', () => {
      const mockStoreService = createMockStoreService(createUninitializedCurrentUserState());
      const query = createGetCurrentUserDataFetchStatusQuery({ storeService: mockStoreService });

      const result = query();

      expect(result).toBe('uninitialized');
    });

    it('should return pending status', () => {
      const mockStoreService = createMockStoreService(
        createTestCurrentUserState({ status: 'pending' })
      );
      const query = createGetCurrentUserDataFetchStatusQuery({ storeService: mockStoreService });

      const result = query();

      expect(result).toBe('pending');
    });

    it('should return rejected status', () => {
      const mockStoreService = createMockStoreService(
        createRejectedCurrentUserState('Connection failed')
      );
      const query = createGetCurrentUserDataFetchStatusQuery({ storeService: mockStoreService });

      const result = query();

      expect(result).toBe('rejected');
    });
  });
});
