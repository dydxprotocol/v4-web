// SPDX-License-Identifier: Apache-2.0
library;

pub const BASIS_POINTS_DIVISOR: u64 = 10_000;
pub const FUNDING_RATE_PRECISION: u256 = 1_000_000_000_000;
pub const FUNDING_RATE_FACTOR_BASE: u256 = 1_000_000_000;
pub const FUNDING_RATE_INTERVAL: u64 = 1; // 1 second
pub const FUNDING_RATE_FACTOR: u256 = 23; // 1 / 1_000_000_000, 2 promiles a day
pub const PRICE_PRECISION: u256 = 1000000000000000000u256; // 10 ** 18;
pub const MIN_LEVERAGE: u64 = 10_000; // 1x
pub const MAX_FEE_BASIS_POINTS: u64 = 500; // 5%
pub const DEFAULT_LIQUIDATION_FEE: u256 = 5; // 5 USDC (without decimals)
pub const MAX_LIQUIDATION_FEE: u256 = 5; // 100 USDC (without decimals)
pub const LP_ASSET_NAME: str[18] = __to_str_array("StarBoard LP Token");
pub const LP_ASSET_SYMBOL: str[4] = __to_str_array("SBLP");
