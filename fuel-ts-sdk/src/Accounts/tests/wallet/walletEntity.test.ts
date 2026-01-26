import {
  WalletBalancesEntitySchema,
  WalletEntitySchema,
} from '@sdk/Accounts/src/Wallet/domain/WalletEntity';
import { DecimalValue } from '@sdk/shared/models/DecimalValue';
import { describe, expect, it } from 'vitest';
import {
  TEST_ADDRESS,
  TEST_BTC_ASSET_ID,
  TEST_USDC_ASSET_ID,
  createTestWalletBalances,
  createTestWalletEntity,
} from '../test-fixtures/wallet';

describe('WalletEntity Schema', () => {
  describe('WalletBalancesEntitySchema', () => {
    it('should validate a valid balances record', () => {
      const balances = createTestWalletBalances();
      const result = WalletBalancesEntitySchema.safeParse(balances);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[TEST_USDC_ASSET_ID]).toBeDefined();
        expect(result.data[TEST_BTC_ASSET_ID]).toBeDefined();
      }
    });

    it('should validate empty balances', () => {
      const result = WalletBalancesEntitySchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data)).toHaveLength(0);
      }
    });

    it('should parse string values into DecimalValue', () => {
      const balances = {
        [TEST_USDC_ASSET_ID]: '1000000000',
      };
      const result = WalletBalancesEntitySchema.safeParse(balances);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[TEST_USDC_ASSET_ID].value).toBe('1000000000');
      }
    });

    it('should parse bigint values into DecimalValue', () => {
      const balances = {
        [TEST_USDC_ASSET_ID]: 1000000000n,
      };
      const result = WalletBalancesEntitySchema.safeParse(balances);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[TEST_USDC_ASSET_ID].value).toBe('1000000000');
      }
    });

    it('should pass through existing DecimalValue instances', () => {
      const decimalValue = DecimalValue.fromFloat(100);
      const balances = {
        [TEST_USDC_ASSET_ID]: decimalValue,
      };
      const result = WalletBalancesEntitySchema.safeParse(balances);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[TEST_USDC_ASSET_ID]).toBe(decimalValue);
      }
    });
  });

  describe('WalletEntitySchema', () => {
    it('should validate a valid wallet entity', () => {
      const wallet = createTestWalletEntity();
      const result = WalletEntitySchema.safeParse(wallet);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.address).toBe(TEST_ADDRESS);
        expect(result.data.balances).toBeDefined();
      }
    });

    it('should validate wallet with empty balances', () => {
      const wallet = createTestWalletEntity({ balances: {} });
      const result = WalletEntitySchema.safeParse(wallet);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data.balances)).toHaveLength(0);
      }
    });

    it('should fail validation for empty address', () => {
      const wallet = {
        address: '',
        balances: {},
      };
      const result = WalletEntitySchema.safeParse(wallet);

      expect(result.success).toBe(false);
    });

    it('should fail validation for missing address', () => {
      const wallet = {
        balances: {},
      };
      const result = WalletEntitySchema.safeParse(wallet);

      expect(result.success).toBe(false);
    });

    it('should fail validation for missing balances', () => {
      const wallet = {
        address: TEST_ADDRESS,
      };
      const result = WalletEntitySchema.safeParse(wallet);

      expect(result.success).toBe(false);
    });

    it('should parse raw data into proper types', () => {
      const rawWallet = {
        address: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        balances: {
          '0xasset1': '5000000000',
          '0xasset2': 10000000000n,
        },
      };
      const result = WalletEntitySchema.safeParse(rawWallet);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.balances['0xasset1'].value).toBe('5000000000');
        expect(result.data.balances['0xasset2'].value).toBe('10000000000');
      }
    });
  });
});
