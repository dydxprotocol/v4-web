import type { WalletBalancesEntity, WalletEntity } from '@sdk/Accounts/src/Wallet/domain';
import type { CurrentUserState } from '@sdk/Accounts/src/Wallet/infrastructure/redux/CurrentUser/types';
import type { RequestStatus } from '@sdk/shared/lib/redux';
import { DecimalValue } from '@sdk/shared/models/DecimalValue';
import { address, assetId } from '@sdk/shared/types';

export const TEST_ADDRESS = address(
  '0x1234567890123456789012345678901234567890123456789012345678901234'
);
export const TEST_USDC_ASSET_ID = assetId('0xusdc');
export const TEST_BTC_ASSET_ID = assetId('0xbtc');
export const TEST_ETH_ASSET_ID = assetId('0xeth');

/**
 * Create test wallet balances
 */
export function createTestWalletBalances(
  overrides: Partial<WalletBalancesEntity> = {}
): WalletBalancesEntity {
  return {
    [TEST_USDC_ASSET_ID]: DecimalValue.fromFloat(1000),
    [TEST_BTC_ASSET_ID]: DecimalValue.fromFloat(0.5),
    ...overrides,
  };
}

/**
 * Create a test wallet entity
 */
export function createTestWalletEntity(overrides: Partial<WalletEntity> = {}): WalletEntity {
  return {
    address: TEST_ADDRESS,
    balances: createTestWalletBalances(),
    ...overrides,
  };
}

/**
 * Create a test current user state
 */
export function createTestCurrentUserState(
  overrides: Partial<CurrentUserState> = {}
): CurrentUserState {
  return {
    data: createTestWalletEntity(),
    status: 'fulfilled' as RequestStatus,
    error: null,
    ...overrides,
  };
}

/**
 * Create an uninitialized current user state
 */
export function createUninitializedCurrentUserState(): CurrentUserState {
  return {
    data: undefined,
    status: 'uninitialized',
    error: undefined,
  };
}

/**
 * Create a pending current user state
 */
export function createPendingCurrentUserState(): CurrentUserState {
  return {
    data: undefined,
    status: 'pending',
    error: null,
  };
}

/**
 * Create a rejected current user state
 */
export function createRejectedCurrentUserState(errorMessage: string): CurrentUserState {
  return {
    data: null,
    status: 'rejected',
    error: errorMessage,
  };
}
