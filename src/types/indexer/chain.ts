// Staking Rewards
export interface OnChainStakingRewardsResponse {
  rewards?: OnChainStakingReward[];
  total?: OnChainStakingRewardAmount[];
}

export interface OnChainStakingReward {
  validatorAddress?: string;
  reward?: OnChainStakingRewardAmount[];
}

export interface OnChainStakingRewardAmount {
  denom?: string;
  amount?: string;
}

// Rewards Parameters
export interface OnChainRewardsParamsResponse {
  params?: OnChainRewardsParams;
}

export interface OnChainRewardsParams {
  treasuryAccount?: string;
  denom?: string;
  denomExponent?: number;
  marketId?: number;
  feeMultiplierPpm?: number;
}

// Equity Tiers
export interface OnChainEquityTiersResponse {
  equityTierLimitConfig?: OnChainEquityTiers;
}

export interface OnChainEquityTiers {
  shortTermOrderEquityTiers?: OnChainEquityTier[];
  statefulOrderEquityTiers?: OnChainEquityTier[];
}

export interface OnChainEquityTier {
  usdTncRequired?: string;
  limit?: number;
}

// Transactions
export interface ChainError {
  message: string;
  line?: number;
  column?: number;
  stack?: string;
}

export interface OnChainTransactionErrorResponse {
  error: ChainError;
}

export interface ChainEvent {
  type: string;
  attributes: ChainEventAttribute[];
}

export interface ChainEventAttribute {
  key: string;
  value: string;
}

export interface OnChainTransactionSuccessResponse {
  height?: number;
  hash?: string;
  code?: number;
  tx: string;
  txIndex?: number;
  gasUsed?: string;
  gasWanted?: string;
  events?: ChainEvent[];
}

// Vault Deposit Withdraw Slippage
export interface OnChainVaultDepositWithdrawSlippageResponse {
  sharesToWithdraw: OnChainNumShares;
  expectedQuoteQuantums: number;
}

// User Fee Tier
export interface OnChainUserFeeTierResponse {
  index?: number;
  tier?: OnChainUserFeeTier;
}

export interface OnChainUserFeeTier {
  name?: string;
  absoluteVolumeRequirement?: string;
  totalVolumeShareRequirementPpm?: number;
  makerVolumeShareRequirementPpm?: number;
  makerFeePpm?: number;
  takerFeePpm?: number;
}

// Delegation
export interface OnChainDelegationResponse {
  delegationResponses?: OnChainDelegationObject[];
  pagination?: OnChainAccountPagination;
}

export interface OnChainDelegationObject {
  delegation?: OnChainDelegationInfo;
  balance?: OnChainAccountBalanceObject;
}

export interface OnChainDelegationInfo {
  delegatorAddress?: string;
  validatorAddress?: string;
  shares?: string;
}

export interface OnChainAccountPagination {
  nextKey?: string;
  total?: string;
}

// Fee Tiers
export interface OnChainFeeTiersResponse {
  params?: OnChainFeeTierParams;
}

export interface OnChainFeeTierParams {
  tiers?: OnChainFeeTier[];
}

export interface OnChainFeeTier {
  name?: string;
  absoluteVolumeRequirement?: string;
  totalVolumeShareRequirementPpm?: number;
  makerVolumeShareRequirementPpm?: number;
  makerFeePpm?: number;
  takerFeePpm?: number;
}

// Token Price
export interface OnChainTokenPriceResponse {
  marketPrice?: OnChainTokenPrice;
}

export interface OnChainTokenPrice {
  price?: string;
  id?: number;
  exponent?: number;
}

// Account Balance
export interface OnChainAccountBalanceObject {
  denom?: string;
  amount?: string;
}

// Withdrawal Capacity
export interface OnChainWithdrawalCapacityResponse {
  limiterCapacityList?: OnChainLimiterCapacity[];
}

export interface OnChainLimiterCapacity {
  limiter?: OnChainLimiter;
  capacity?: string;
}

export interface OnChainLimiter {
  period?: OnChainLimiterPeriod;
  baselineMinimum?: string;
  baselineTvlPpm?: number;
}

export interface OnChainLimiterPeriod {
  seconds?: string;
  nanos?: number;
}

// Unbonding
export interface OnChainUnbondingResponse {
  unbondingResponses?: OnChainUnbondingObject[];
  pagination?: OnChainAccountPagination;
}

export interface OnChainUnbondingObject {
  delegatorAddress?: string;
  validatorAddress?: string;
  entries?: OnChainUnbondingEntry[];
}

export interface OnChainUnbondingEntry {
  creationHeight?: string;
  completionTime?: string;
  initialBalance?: string;
  balance?: string;
  unbondingId?: string;
  unbondingOnHoldRefCount?: string;
}

// Account Vault
export interface OnChainShareUnlock {
  shares?: OnChainNumShares;
  unlockBlockHeight?: number;
}

export interface OnChainNumShares {
  numShares?: number;
}

export interface OnChainAccountVaultResponse {
  address?: string;
  shares?: OnChainNumShares;
  shareUnlocks?: OnChainShareUnlock[];
  equity?: number;
  withdrawableEquity?: number;
}

// Withdrawal And Transfer Gating Status
export interface OnChainWithdrawalAndTransferGatingStatusResponse {
  negativeTncSubaccountSeenAtBlock?: number;
  chainOutageSeenAtBlock?: number;
  withdrawalsAndTransfersUnblockedAtBlock?: number;
}

// User Stats
export interface OnChainUserStatsResponse {
  takerNotional?: string;
  makerNotional?: string;
}
