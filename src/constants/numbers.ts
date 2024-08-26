export const USD_DECIMALS = 2;
export const SMALL_USD_DECIMALS = 4;

export const PERCENT_DECIMALS = 2;
export const SMALL_PERCENT_DECIMALS = 4;
export const TINY_PERCENT_DECIMALS = 6;

export const INTEGER_DECIMALS = 0;
export const LEVERAGE_DECIMALS = 2;
export const TOKEN_DECIMALS = 4;
export const LARGE_TOKEN_DECIMALS = 2;
export const FEE_DECIMALS = 3;
export const FUNDING_DECIMALS = 4;

export const QUANTUM_MULTIPLIER = 1_000_000;

export enum NumberSign {
  Positive = 'Positive',
  Negative = 'Negative',
  Neutral = 'Neutral',
}

// Deposit/Withdraw
export const MAX_CCTP_TRANSFER_AMOUNT = 1_000_000;
export const MIN_CCTP_TRANSFER_AMOUNT = 11;
export const MAX_PRICE_IMPACT = 0.02; // 2%
export const DEFAULT_GAS_LIMIT = 160000;
export const COSMOS_GAS_RESERVE = 0.05;
