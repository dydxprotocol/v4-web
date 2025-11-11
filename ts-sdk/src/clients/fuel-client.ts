import { Account, BN, Provider } from 'fuels';
import { Fungible } from './types/contracts/Fungible';
import { Vault } from './types/contracts/Vault';

export interface FuelClientConfig {
  providerUrl: string;
  vaultContractId: string;
  usdcAssetId: string;
  rlpAssetId?: string;
}

export interface LiquidityPreview {
  rlpTokensToReceive: string;
  amountAfterFees: string;
  feeBasisPoints: number;
  feeAmount: string;
}

export interface LiquidityDepositParams {
  usdcAmount: string;
  minRlpAmount?: string;
  receiverAddress?: string;
}

export interface LiquidityDepositResult {
  transactionId: string;
  rlpReceived: string;
  gasUsed: BN;
  status: 'success' | 'failure';
}

export class FuelClient {
  private provider: Provider | null = null;
  private config: FuelClientConfig;

  constructor(config: FuelClientConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.provider = new Provider(this.config.providerUrl);
  }

  private getVaultContract(account: Account): Vault {
    if (!this.provider) {
      throw new Error('Provider not initialized. Call connect() first.');
    }
    return new Vault(this.config.vaultContractId, account);
  }

  private getUsdcContract(account: Account): Fungible {
    if (!this.provider) {
      throw new Error('Provider not initialized. Call connect() first.');
    }
    return new Fungible(this.config.usdcAssetId, account);
  }

  async previewLiquidityDeposit(
    account: Account,
    usdcAmount: string
  ): Promise<LiquidityPreview> {
    const vault = this.getVaultContract(account);
    const amountInUnits = this.toContractUnits(usdcAmount, 6);

    const { value } = await vault.functions
      .get_add_liquidity_amount(amountInUnits)
      .get();

    const [mintAmount, amountAfterFees, feeBasisPoints] = value;

    return {
      rlpTokensToReceive: this.fromContractUnits(mintAmount.toString(), 6),
      amountAfterFees: this.fromContractUnits(amountAfterFees.toString(), 6),
      feeBasisPoints: feeBasisPoints.toNumber(),
      feeAmount: (parseFloat(usdcAmount) - parseFloat(this.fromContractUnits(amountAfterFees.toString(), 6))).toFixed(6)
    };
  }

  async depositLiquidity(
    account: Account,
    params: LiquidityDepositParams
  ): Promise<LiquidityDepositResult> {
    await this.validateDeposit(account, params);

    const vault = this.getVaultContract(account);
    const amountInUnits = this.toContractUnits(params.usdcAmount, 6);
    const receiverAddress = params.receiverAddress || account.address.toB256();
    
    try {
      const call = vault.functions
        .add_liquidity({ 
          Address: { bits: receiverAddress } 
        })
        .callParams({
          forward: [amountInUnits, this.config.usdcAssetId],
        });

      const result = await call.call();
      const { value } = await result.waitForResult();

      return {
        transactionId: result.transactionId,
        rlpReceived: this.fromContractUnits(value.toString(), 6),
        gasUsed: new BN(0),
        status: 'success'
      };
    } catch (error) {
      throw new Error(`Liquidity deposit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateDeposit(
    account: Account,
    params: LiquidityDepositParams
  ): Promise<void> {
    const amount = parseFloat(params.usdcAmount);

    if (amount < 100) {
      throw new Error('Minimum deposit is 100 USDC');
    }

    const balance = await this.getUsdcBalance(account);
    if (parseFloat(balance) < amount) {
      throw new Error(`Insufficient USDC balance. Required: ${amount}, Available: ${balance}`);
    }

    const poolStats = await this.getPoolStatistics(account);
    const maxDeposit = Math.min(poolStats.tvl * 0.1, 1_000_000);

    if (amount > maxDeposit) {
      throw new Error(`Deposit amount exceeds maximum. Max allowed: ${maxDeposit.toFixed(2)} USDC`);
    }

    const vault = this.getVaultContract(account);
    const { value: isPaused } = await vault.functions.is_paused().get();
    if (isPaused) {
      throw new Error('Pool is currently paused');
    }
  }

  async getUsdcBalance(account: Account): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const balance = await account.getBalance(this.config.usdcAssetId);
    return this.fromContractUnits(balance.toString(), 6);
  }

  async getRlpBalance(account: Account): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const rlpAssetId = this.config.rlpAssetId || await this.getRlpAssetId(account);
    const balance = await account.getBalance(rlpAssetId);
    return this.fromContractUnits(balance.toString(), 6);
  }

  private async getRlpAssetId(account: Account): Promise<string> {
    const vault = this.getVaultContract(account);
    const { value } = await vault.functions.get_lp_asset().get();
    return value.bits;
  }

  async getPoolStatistics(account: Account): Promise<{
    tvl: number;
    totalRlpSupply: string;
    isPaused: boolean;
  }> {
    const vault = this.getVaultContract(account);
    
    const [totalAssetsResult, isPausedResult, rlpAssetId] = await Promise.all([
      vault.functions.total_assets().get(),
      vault.functions.is_paused().get(),
      this.getRlpAssetId(account)
    ]);

    const totalAssets = totalAssetsResult.value;
    const isPaused = isPausedResult.value;
    const totalSupplyResult = await vault.functions.total_supply({ bits: rlpAssetId }).get();
    const totalSupply = totalSupplyResult.value ? totalSupplyResult.value : new BN(0);

    return {
      tvl: parseFloat(this.fromContractUnits(totalAssets.toString(), 6)),
      totalRlpSupply: this.fromContractUnits(totalSupply.toString(), 6),
      isPaused
    };
  }

  async calculateDepositFee(account: Account, usdcAmount: string): Promise<string> {
    const preview = await this.previewLiquidityDeposit(account, usdcAmount);
    return preview.feeAmount;
  }

  private toContractUnits(amount: string, decimals: number): BN {
    const [integer, decimal = '0'] = amount.split('.');
    const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals);
    const fullAmount = integer + paddedDecimal;
    return new BN(fullAmount);
  }

  private fromContractUnits(amount: string, decimals: number): string {
    const amountStr = amount.padStart(decimals + 1, '0');
    const integerPart = amountStr.slice(0, -decimals) || '0';
    const decimalPart = amountStr.slice(-decimals);
    return `${integerPart}.${decimalPart}`.replace(/\.?0+$/, '');
  }
}

