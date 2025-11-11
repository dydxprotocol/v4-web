import { Account } from 'fuels';
import { FuelClient, LiquidityDepositParams, LiquidityDepositResult, LiquidityPreview } from './fuel-client';

export interface LiquidityClientConfig {
  providerUrl: string;
  vaultContractId: string;
  usdcAssetId: string;
  graphqlEndpoint?: string;
}

export interface PoolStatisticsExtended {
  tvl: number;
  totalRlpSupply: string;
  sevenDayApy: number;
  utilizationRate: number;
  isPaused: boolean;
  rlpPrice: number;
}

export interface UserLiquidityPosition {
  usdcDeposited: string;
  rlpBalance: string;
  currentValue: string;
  pnl: string;
  pnlPercentage: number;
}

export class LiquidityClient {
  private fuelClient: FuelClient;
  private config: LiquidityClientConfig;

  constructor(config: LiquidityClientConfig) {
    this.config = config;
    this.fuelClient = new FuelClient({
      providerUrl: config.providerUrl,
      vaultContractId: config.vaultContractId,
      usdcAssetId: config.usdcAssetId
    });
  }

  async connect(): Promise<void> {
    await this.fuelClient.connect();
  }

  async previewDeposit(
    account: Account,
    usdcAmount: string
  ): Promise<LiquidityPreview> {
    return this.fuelClient.previewLiquidityDeposit(account, usdcAmount);
  }

  async deposit(
    account: Account,
    params: LiquidityDepositParams
  ): Promise<LiquidityDepositResult> {
    return this.fuelClient.depositLiquidity(account, params);
  }

  async getPoolStatistics(account: Account): Promise<PoolStatisticsExtended> {
    const contractStats = await this.fuelClient.getPoolStatistics(account);
    let sevenDayApy = 0;
    let utilizationRate = 0;
    let rlpPrice = 1.0;

    if (this.config.graphqlEndpoint) {
      try {
        const indexerStats = await this.fetchIndexerStats();
        sevenDayApy = indexerStats.sevenDayApy || 0;
        utilizationRate = indexerStats.utilizationRate || 0;
        rlpPrice = indexerStats.rlpPrice || 1.0;
      } catch (error) {
        console.warn('Failed to fetch indexer stats, using defaults', error);
      }
    }

    return {
      ...contractStats,
      sevenDayApy,
      utilizationRate,
      rlpPrice
    };
  }

  async getUserPosition(
    account: Account,
    userAddress: string
  ): Promise<UserLiquidityPosition> {
    const [rlpBalance, poolStats] = await Promise.all([
      this.fuelClient.getRlpBalance(account),
      this.getPoolStatistics(account)
    ]);

    const currentValue = (parseFloat(rlpBalance) * poolStats.rlpPrice).toFixed(6);

    let usdcDeposited = currentValue;
    if (this.config.graphqlEndpoint) {
      try {
        const historicalData = await this.fetchUserHistoricalData(userAddress);
        usdcDeposited = historicalData.totalDeposited;
      } catch (error) {
        console.warn('Failed to fetch user historical data', error);
      }
    }

    const pnl = (parseFloat(currentValue) - parseFloat(usdcDeposited)).toFixed(6);
    const pnlPercentage = parseFloat(usdcDeposited) > 0 
      ? (parseFloat(pnl) / parseFloat(usdcDeposited)) * 100 
      : 0;

    return {
      usdcDeposited,
      rlpBalance,
      currentValue,
      pnl,
      pnlPercentage
    };
  }

  async estimateApy(account: Account): Promise<number> {
    const stats = await this.getPoolStatistics(account);
    return stats.sevenDayApy;
  }

  async getUsdcBalance(account: Account): Promise<string> {
    return this.fuelClient.getUsdcBalance(account);
  }

  async calculateFee(account: Account, usdcAmount: string): Promise<string> {
    return this.fuelClient.calculateDepositFee(account, usdcAmount);
  }

  async validateDeposit(
    account: Account,
    usdcAmount: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.fuelClient.previewLiquidityDeposit(account, usdcAmount);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  private async fetchIndexerStats(): Promise<{
    sevenDayApy: number;
    utilizationRate: number;
    rlpPrice: number;
  }> {
    if (!this.config.graphqlEndpoint) {
      throw new Error('GraphQL endpoint not configured');
    }

    const query = `
      query GetPoolStatistics {
        poolStatistics(where: { id: "1" }) {
          sevenDayApy
          utilizationRate
          rlpPrice
        }
      }
    `;

    const response = await fetch(this.config.graphqlEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    
    if (!data.data?.poolStatistics) {
      throw new Error('No pool statistics found in indexer');
    }

    const stats = data.data.poolStatistics;
    
    return {
      sevenDayApy: stats.sevenDayApy / 100,
      utilizationRate: stats.utilizationRate / 100,
      rlpPrice: parseFloat(stats.rlpPrice) / 1_000_000
    };
  }

  private async fetchUserHistoricalData(userAddress: string): Promise<{
    totalDeposited: string;
  }> {
    if (!this.config.graphqlEndpoint) {
      throw new Error('GraphQL endpoint not configured');
    }

    const query = `
      query GetUserLiquidity($provider: String!) {
        liquidity(where: { provider: $provider, latest: true }) {
          stable
          lpAmount
          timestamp
        }
      }
    `;

    const response = await fetch(this.config.graphqlEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { provider: userAddress } })
    });

    const data = await response.json();
    
    if (!data.data?.liquidity) {
      return { totalDeposited: '0' };
    }

    const position = data.data.liquidity;
    return {
      totalDeposited: (parseFloat(position.stable) / 1_000_000).toFixed(6)
    };
  }
}

