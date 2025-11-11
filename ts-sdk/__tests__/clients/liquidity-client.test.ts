import { Account, Provider, Wallet, BN } from 'fuels';
import { FuelClient, LiquidityClient } from '../../src';

// Mock fuels module
jest.mock('fuels', () => ({
  Provider: {
    create: jest.fn(),
  },
  Wallet: jest.fn(),
  Account: jest.fn(),
  BN: jest.fn().mockImplementation((val) => ({
    toString: () => val.toString(),
    toNumber: () => parseInt(val.toString()),
  })),
}));

describe('LiquidityClient', () => {
  let liquidityClient: LiquidityClient;
  let mockAccount: jest.Mocked<Account>;
  let mockProvider: jest.Mocked<Provider>;

  const config = {
    providerUrl: 'https://testnet.fuel.network/v1/graphql',
    vaultContractId: '0x1234567890abcdef',
    usdcAssetId: '0xusdc123',
    graphqlEndpoint: 'http://localhost:4350/graphql',
  };

  beforeEach(() => {
    mockProvider = {
      getBalance: jest.fn(),
    } as any;

    mockAccount = {
      address: {
        toB256: jest.fn().mockReturnValue('0xuser123'),
      },
      getBalance: jest.fn(),
    } as any;

    (Provider.create as jest.Mock).mockResolvedValue(mockProvider);

    liquidityClient = new LiquidityClient(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should initialize provider', async () => {
      await liquidityClient.connect();
      expect(Provider.create).toHaveBeenCalledWith(config.providerUrl);
    });
  });

  describe('previewDeposit', () => {
    it('should return preview of liquidity deposit', async () => {
      const mockVault = {
        functions: {
          get_add_liquidity_amount: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              value: [
                new BN(990000000), // mintAmount (990 RLP with 6 decimals)
                new BN(990000000), // amountAfterFees
                new BN(10),        // feeBasisPoints (0.1%)
              ],
            }),
          }),
        },
      };

      // Mock the getVaultContract private method
      jest.spyOn(FuelClient.prototype as any, 'getVaultContract').mockReturnValue(mockVault);

      await liquidityClient.connect();
      const preview = await liquidityClient.previewDeposit(mockAccount, '1000');

      expect(preview).toMatchObject({
        rlpTokensToReceive: expect.any(String),
        amountAfterFees: expect.any(String),
        feeBasisPoints: 10,
        feeAmount: expect.any(String),
      });
    });

    it('should throw error if provider not initialized', async () => {
      await expect(
        liquidityClient.previewDeposit(mockAccount, '1000')
      ).rejects.toThrow('Provider not initialized');
    });
  });

  describe('deposit', () => {
    it('should successfully deposit liquidity', async () => {
      const mockVault = {
        functions: {
          add_liquidity: jest.fn().mockReturnValue({
            callParams: jest.fn().mockReturnValue({
              call: jest.fn().mockResolvedValue({
                transactionId: '0xtx123',
                value: new BN(990000000),
                gasUsed: new BN(100000),
              }),
            }),
          }),
          is_paused: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: false }),
          }),
          total_assets: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: new BN(10000000000) }),
          }),
          get_lp_asset: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: { bits: '0xrlp123' } }),
          }),
          total_supply: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: new BN(10000000000) }),
          }),
        },
      };

      jest.spyOn(FuelClient.prototype as any, 'getVaultContract').mockReturnValue(mockVault);
      mockAccount.getBalance.mockResolvedValue(new BN(10000000000)); // 10,000 USDC

      await liquidityClient.connect();
      const result = await liquidityClient.deposit(mockAccount, {
        usdcAmount: '1000',
      });

      expect(result).toMatchObject({
        transactionId: '0xtx123',
        rlpReceived: expect.any(String),
        status: 'success',
      });
    });

    it('should reject deposit below minimum (100 USDC)', async () => {
      await liquidityClient.connect();
      
      await expect(
        liquidityClient.deposit(mockAccount, { usdcAmount: '50' })
      ).rejects.toThrow('Minimum deposit is 100 USDC');
    });

    it('should reject deposit with insufficient balance', async () => {
      mockAccount.getBalance.mockResolvedValue(new BN(50000000)); // 50 USDC

      const mockVault = {
        functions: {
          is_paused: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: false }),
          }),
          total_assets: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: new BN(10000000000) }),
          }),
          get_lp_asset: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: { bits: '0xrlp123' } }),
          }),
          total_supply: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: new BN(10000000000) }),
          }),
        },
      };

      jest.spyOn(FuelClient.prototype as any, 'getVaultContract').mockReturnValue(mockVault);

      await liquidityClient.connect();
      
      await expect(
        liquidityClient.deposit(mockAccount, { usdcAmount: '1000' })
      ).rejects.toThrow('Insufficient USDC balance');
    });

    it('should reject deposit when pool is paused', async () => {
      const mockVault = {
        functions: {
          is_paused: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: true }),
          }),
          total_assets: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: new BN(10000000000) }),
          }),
          get_lp_asset: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: { bits: '0xrlp123' } }),
          }),
          total_supply: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: new BN(10000000000) }),
          }),
        },
      };

      jest.spyOn(FuelClient.prototype as any, 'getVaultContract').mockReturnValue(mockVault);
      mockAccount.getBalance.mockResolvedValue(new BN(10000000000));

      await liquidityClient.connect();
      
      await expect(
        liquidityClient.deposit(mockAccount, { usdcAmount: '1000' })
      ).rejects.toThrow('Pool is currently paused');
    });
  });

  describe('getPoolStatistics', () => {
    it('should return pool statistics from contract', async () => {
      const mockVault = {
        functions: {
          total_assets: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: new BN(10000000000) }),
          }),
          is_paused: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: false }),
          }),
          get_lp_asset: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: { bits: '0xrlp123' } }),
          }),
          total_supply: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: new BN(10000000000) }),
          }),
        },
      };

      jest.spyOn(FuelClient.prototype as any, 'getVaultContract').mockReturnValue(mockVault);

      await liquidityClient.connect();
      const stats = await liquidityClient.getPoolStatistics(mockAccount);

      expect(stats).toMatchObject({
        tvl: expect.any(Number),
        totalRlpSupply: expect.any(String),
        isPaused: false,
        sevenDayApy: expect.any(Number),
        utilizationRate: expect.any(Number),
        rlpPrice: expect.any(Number),
      });
    });
  });

  describe('getUserPosition', () => {
    it('should return user liquidity position', async () => {
      mockAccount.getBalance.mockResolvedValue(new BN(1000000000)); // 1000 RLP

      const mockVault = {
        functions: {
          get_lp_asset: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: { bits: '0xrlp123' } }),
          }),
          total_assets: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: new BN(10000000000) }),
          }),
          is_paused: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: false }),
          }),
          total_supply: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ value: new BN(10000000000) }),
          }),
        },
      };

      jest.spyOn(FuelClient.prototype as any, 'getVaultContract').mockReturnValue(mockVault);

      await liquidityClient.connect();
      const position = await liquidityClient.getUserPosition(mockAccount, '0xuser123');

      expect(position).toMatchObject({
        rlpBalance: expect.any(String),
        currentValue: expect.any(String),
        usdcDeposited: expect.any(String),
        pnl: expect.any(String),
        pnlPercentage: expect.any(Number),
      });
    });
  });

  describe('validateDeposit', () => {
    it('should return valid for acceptable deposit', async () => {
      const mockVault = {
        functions: {
          get_add_liquidity_amount: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              value: [new BN(990000000), new BN(990000000), new BN(10)],
            }),
          }),
        },
      };

      jest.spyOn(FuelClient.prototype as any, 'getVaultContract').mockReturnValue(mockVault);

      await liquidityClient.connect();
      const validation = await liquidityClient.validateDeposit(mockAccount, '1000');

      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('should return invalid with error message for bad deposit', async () => {
      jest.spyOn(FuelClient.prototype as any, 'getVaultContract').mockImplementation(() => {
        throw new Error('Mock validation error');
      });

      await liquidityClient.connect();
      const validation = await liquidityClient.validateDeposit(mockAccount, '1000');

      expect(validation.valid).toBe(false);
      expect(validation.error).toBeDefined();
    });
  });

  describe('calculateFee', () => {
    it('should calculate deposit fee', async () => {
      const mockVault = {
        functions: {
          get_add_liquidity_amount: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              value: [new BN(990000000), new BN(990000000), new BN(10)],
            }),
          }),
        },
      };

      jest.spyOn(FuelClient.prototype as any, 'getVaultContract').mockReturnValue(mockVault);

      await liquidityClient.connect();
      const fee = await liquidityClient.calculateFee(mockAccount, '1000');

      expect(fee).toBeDefined();
      expect(parseFloat(fee)).toBeGreaterThanOrEqual(0);
    });
  });
});

