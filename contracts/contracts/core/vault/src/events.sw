// SPDX-License-Identifier: Apache-2.0
library;

use signed_int::i256::I256;
use core_interfaces::vault::Position;
pub struct SetGov {
    pub gov: Identity,
}
pub struct SetPaused {
    pub is_paused: bool,
}
pub struct SetApprovedRouter {
    pub account: Identity,
    pub router: Identity,
    pub is_active: bool,
}
pub struct SetAssetConfig {
    pub asset: b256,
    pub max_leverage: u256,
}
pub struct ClearAssetConfig {
    pub asset: b256,
}
pub struct SetFees {
    pub liquidity_fee_basis_points: u64,
    pub position_fee_basis_points: u64,
    pub liquidation_fee_basis_points: u64,
}
pub struct SetLiquidator {
    pub liquidator: Identity,
    pub is_active: bool,
}
pub struct AddLiquidity {
    pub account: Identity,
    pub base_asset_amount: u64,
    pub lp_asset_amount: u64,
    pub fee: u64,
}
pub struct RemoveLiquidity {
    pub account: Identity,
    pub base_asset_amount: u64,
    pub lp_asset_amount: u64,
    pub fee: u64,
}
pub struct WithdrawFees {
    pub receiver: Identity,
    pub amount: u64,
}
pub struct RegisterPositionByKey {
    pub position_key: b256,
    pub account: Identity,
    pub index_asset: b256,
    pub is_long: bool,
}
pub struct IncreasePosition {
    pub key: b256,
    pub collateral_delta: u256, // transferred from the user to the vault
    pub size_delta: u256, // requested by the user
    pub price: u256, // the current price of the asset
    pub out_average_price: u256, // the average price of the position after the increase
    pub out_liquidity_fee: u256, // the liquidity fee paid, increases the total liquidity and the total reserves
    pub out_protocol_fee: u256, // the protocol fee paid to the protocol
    pub funding_rate: u256, // the calculated funding rate of the position
    pub out_funding_rate: u256, // the actual funding rate of the position paid or received, not greater than funding_rate
    pub funding_rate_has_profit: bool, // whether the funding rate has profit
    pub pnl_delta: u256, // the calculated pnl delta of the position
    pub out_pnl_delta: u256, // the actual pnl delta of the position paid or received, not greater than pnl_delta
    pub pnl_delta_has_profit: bool, // whether the pnl delta has profit
    pub cumulative_funding_rate: u256, // the cumulative funding rate after the increase
}
pub struct DecreasePosition {
    pub key: b256,
    pub collateral_delta: u256, // requested by the user
    pub size_delta: u256, // requested by the user
    pub price: u256, // the current price of the asset
    pub out_average_price: u256, // the average price of the position after the decrease
    pub out_liquidity_fee: u256, // the liquidity fee paid, increases the total liquidity and the total reserves
    pub out_protocol_fee: u256, // the protocol fee paid to the protocol
    pub funding_rate: u256, // the calculated funding rate of the position
    pub out_funding_rate: u256, // the actual funding rate of the position paid or received, not greater than funding_rate
    pub funding_rate_has_profit: bool, // whether the funding rate has profit
    pub pnl_delta: u256, // the calculated pnl delta of the position
    pub out_pnl_delta: u256, // the actual pnl delta of the position paid or received, not greater than pnl_delta
    pub pnl_delta_has_profit: bool, // whether the pnl delta has profit
    pub cumulative_funding_rate: u256, // the cumulative funding rate after the decrease
    pub amount_out: u256, // the amount of the asset received by the user
    pub receiver: Identity, // the receiver of the amount
}
pub struct ClosePosition {
    pub key: b256,
}
pub struct LiquidatePosition {
    pub key: b256,
    pub price: u256, // the current price of the asset
    pub out_liquidity_fee: u256, // the liquidity fee paid, increases the total liquidity and the total reserves
    pub out_protocol_fee: u256, // the protocol fee paid to the protocol
    pub out_liquidation_fee: u256, // the liquidation fee paid to the liquidator
    pub funding_rate: u256, // the calculated funding rate of the position
    pub out_funding_rate: u256, // the actual funding rate of the position paid or received, not greater than funding_rate
    pub funding_rate_has_profit: bool, // whether the funding rate has profit
    pub pnl_delta: u256, // the calculated pnl delta of the position
    pub out_pnl_delta: u256, // the actual pnl delta of the position paid or received, not greater than pnl_delta
    pub pnl_delta_has_profit: bool, // whether the pnl delta has profit
    pub cumulative_funding_rate: u256, // the cumulative funding rate after the liquidation
    pub fee_receiver: Identity, // the receiver of the fee
}
pub struct UpdateFundingInfo {
    pub asset: b256,
    pub total_short_sizes: u256,
    pub total_long_sizes: u256,
    pub long_cumulative_funding_rate: u256,
    pub short_cumulative_funding_rate: u256,
}
