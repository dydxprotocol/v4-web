// SPDX-License-Identifier: Apache-2.0
library;

use helpers::{
    signed_256::Signed256,
};
use core_interfaces::vault::Position;

pub struct SetGov {
    pub gov: Identity,
}

pub struct SetRusdContract {
    pub rusd_contr: ContractId
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
    pub asset: AssetId,
    pub asset_decimals: u32,
    pub asset_weight: u64,
    pub min_profit_bps: u64,
    pub max_rusd_amount: u256,
    pub is_stable: bool,
    pub is_shortable: bool
}

pub struct ClearAssetConfig {
    pub asset: AssetId,
}

pub struct SetMaxRusdAmount {
    pub asset: AssetId,
    pub max_rusd_amount: u256,
}

pub struct SetFees {
    pub tax_basis_points: u64,
    pub stable_tax_basis_points: u64,
    pub mint_burn_fee_basis_points: u64,
    pub swap_fee_basis_points: u64,
    pub stable_swap_fee_basis_points: u64,
    pub margin_fee_basis_points: u64,
    pub liquidation_fee_usd: u256,
    pub min_profit_time: u64,
    pub has_dynamic_fees: bool
}

pub struct WriteLastFundingTime {
    pub asset: AssetId,
    pub last_funding_time: u64,
}

pub struct WritePosition {
    pub position_key: b256,
    pub position: Position
}

pub struct WriteFeeReserve {
    pub asset: AssetId,
    pub fee_reserve: u256,
}

pub struct WriteGlobalShortAveragePrice {
    pub asset: AssetId,
    pub global_short_average_price: u256,
}

pub struct SetMaxGlobalShortSize {
    pub asset: AssetId,
    pub max_global_short_size: u256,
}

pub struct SetLiquidator {
    pub liquidator: Identity,
    pub is_active: bool,
}

pub struct SetBufferAmount {
    pub asset: AssetId,
    pub buffer_amount: u256,
}

pub struct SetPricefeedProvider {
    pub pricefeed_provider: ContractId,
}

pub struct BuyRUSD {
    pub account: Identity,
    pub asset: AssetId,
    pub asset_amount: u64,
    pub rusd_amount: u256,
    pub fee_basis_points: u256,
}

pub struct SellRUSD {
    pub account: Identity,
    pub asset: AssetId,
    pub asset_amount: u64,
    pub rusd_amount: u256,
    pub fee_basis_points: u256,
}

pub struct CollectSwapFees {
    pub asset: AssetId,
    pub fee_usd: u256,
    pub fee_assets: u64,
}

pub struct DirectPoolDeposit {
    pub asset: AssetId,
    pub amount: u256,
}

pub struct Swap {
    pub account: Identity,
    pub asset_in: AssetId,
    pub asset_out: AssetId,
    pub amount_in: u256,
    pub amount_out: u256,
    pub amount_out_after_fees: u64,
    pub fee_basis_points: u256,
}

pub struct WithdrawFees {
    pub asset: AssetId,
    pub receiver: Identity,
    pub amount: u64
}

pub struct RegisterPositionByKey {
    pub position_key: b256,
    pub account: Identity,
    pub collateral_asset: AssetId,
    pub index_asset: AssetId,
    pub is_long: bool
}

pub struct IncreasePosition {
    pub key: b256,
    pub account: Identity,
    pub collateral_asset: AssetId,
    pub index_asset: AssetId,
    pub collateral_delta: u256,
    pub size_delta: u256,
    pub is_long: bool,
    pub price: u256,
    pub fee: u256,
}

pub struct DecreasePosition {
    pub key: b256,
    pub account: Identity,
    pub collateral_asset: AssetId,
    pub index_asset: AssetId,
    pub collateral_delta: u256,
    pub size_delta: u256,
    pub is_long: bool,
    pub price: u256,
    pub fee: u256,
}

pub struct ClosePosition {
    pub key: b256,
    pub size: u256,
    pub collateral: u256,
    pub average_price: u256,
    pub entry_funding_rate: u256,
    pub reserve_amount: u256,
    pub realized_pnl: Signed256,
}

pub struct LiquidatePosition {
    pub key: b256,
    pub account: Identity,
    pub collateral_asset: AssetId,
    pub index_asset: AssetId,
    pub is_long: bool,
    pub size: u256,
    pub collateral: u256,
    pub reserve_amount: u256,
    pub realized_pnl: Signed256,
    pub mark_price: u256,
}

pub struct UpdatePnl {
    pub key: b256,
    pub has_profit: bool,
    pub delta: u256,
}

pub struct CollectMarginFees {
    pub asset: AssetId,
    pub fee_usd: u256,
    pub fee_assets: u256,
}

pub struct SetFundingRateInfo {
    pub funding_interval: u64,
    pub funding_rate_factor: u64,
    pub stable_funding_rate_factor: u64
}

pub struct SetMaxLeverage {
    pub asset: AssetId,
    pub max_leverage: u256,
}

pub struct UpdateFundingRate {
    pub asset: AssetId,
    pub funding_rate: u256,
}

pub struct UpdateGlobalShortSize {
    pub asset: AssetId,
    pub global_short_size: u256
}

pub struct WritePoolAmount {
    pub asset: AssetId,
    pub pool_amount: u256,
}

pub struct WriteRusdAmount {
    pub asset: AssetId,
    pub rusd_amount: u256,
}

pub struct WriteReservedAmount {
    pub asset: AssetId,
    pub reserved_amount: u256,
}

pub struct WriteGuaranteedAmount {
    pub asset: AssetId,
    pub guaranteed_amount: u256,
}

pub struct UpgradeVault {
    pub new_vault: ContractId,
    pub asset: AssetId,
    pub amount: u64,
}
