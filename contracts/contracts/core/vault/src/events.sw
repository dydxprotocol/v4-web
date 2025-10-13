// SPDX-License-Identifier: Apache-2.0
library;

use helpers::{
    signed_256::Signed256,
};
use core_interfaces::vault::Position;

pub struct SetGov {
    pub gov: Identity,
}

pub struct SetPaused {
    pub is_paused: bool,
}

pub struct SetRouter {
    pub router: ContractId
}

pub struct SetApprovedRouter {
    pub account: Identity,
    pub router: Identity,
    pub is_active: bool,
}

pub struct SetAssetConfig {
    pub asset: b256,
    pub asset_decimals: u32,
}

pub struct ClearAssetConfig {
    pub asset: b256,
}

pub struct SetFees {
    pub mint_burn_fee_basis_points: u64,
    pub margin_fee_basis_points: u64,
    pub liquidation_fee: u256,
}

pub struct WriteLastFundingTime {
    pub asset: b256,
    pub last_funding_time: u64,
}

pub struct WritePosition {
    pub position_key: b256,
    pub position: Position
}

pub struct WriteFeeReserve {
    pub fee_reserve: u256,
}

pub struct SetLiquidator {
    pub liquidator: Identity,
    pub is_active: bool,
}

pub struct SetBufferAmount {
    pub asset: b256,
    pub buffer_amount: u256,
}

pub struct SetPricefeedProvider {
    pub pricefeed_provider: ContractId,
}

pub struct AddLiquidity {
    pub account: Identity,
    pub stable_asset_amount: u64,
    pub lp_asset_amount: u64,
    pub fee_basis_points: u64,
}

pub struct RemoveLiquidity {
    pub account: Identity,
    pub stable_asset_amount: u64,
    pub lp_asset_amount: u64,
    pub fee_basis_points: u64,
}

pub struct CollectSwapFees {
    pub fee_amount: u64,
}

pub struct WithdrawFees {
    pub receiver: Identity,
    pub amount: u64
}

pub struct RegisterPositionByKey {
    pub position_key: b256,
    pub account: Identity,
    pub index_asset: b256,
    pub is_long: bool
}

pub struct IncreasePosition {
    pub key: b256,
    pub account: Identity,
    pub index_asset: b256,
    pub is_long: bool,
    pub collateral_delta: u256,
    pub size_delta: u256,
    pub price: u256,
    pub average_price: u256,
    pub position_fee: u256,
    pub funding_rate: u256,
    pub funding_rate_has_profit: bool,
    pub cumulative_funding_rate: u256,
}

pub struct DecreasePosition {
    pub key: b256,
    pub account: Identity,
    pub index_asset: b256,
    pub is_long: bool,
    pub collateral_delta: u256,
    pub size_delta: u256,
    pub price: u256,
    pub average_price: u256,
    pub position_fee: u256,
    pub funding_rate: u256,
    pub funding_rate_has_profit: bool,
    pub cumulative_funding_rate: u256,
}

pub struct ClosePosition {
    pub key: b256,
    pub realized_pnl: Signed256,
}

pub struct LiquidatePosition {
    pub key: b256,
    pub account: Identity,
    pub index_asset: b256,
    pub is_long: bool,
    pub collateral: u256,
    pub size: u256,
    pub mark_price: u256,
    pub position_fee: u256,
    pub funding_rate: u256,
    pub funding_rate_has_profit: bool,
    pub cumulative_funding_rate: u256,
}

pub struct UpdatePnl {
    pub key: b256,
    pub has_profit: bool,
    pub delta: u256,
}

pub struct CollectMarginFees {
    pub margin_fees: u256,
}

pub struct SetFundingRateInfo {
    pub funding_interval: u64,
    pub funding_rate_factor: u64,
    pub stable_funding_rate_factor: u64
}

pub struct SetMaxLeverage {
    pub asset: b256,
    pub max_leverage: u256,
}

pub struct WritePoolAmount {
    pub asset: b256,
    pub pool_amount: u256,
}

pub struct WriteReservedAmount {
    pub asset: b256,
    pub reserved_amount: u256,
}

pub struct WriteGuaranteedAmount {
    pub asset: b256,
    pub guaranteed_amount: u256,
}

pub struct UpdateFundingInfo {
    pub asset: b256,
    pub total_short_sizes: u256,
    pub total_long_sizes: u256,
    pub long_cumulative_funding_rate: u256,
    pub short_cumulative_funding_rate: u256,
}
