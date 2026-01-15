// SPDX-License-Identifier: Apache-2.0
library;

use std::hash::*;
use signed_int::i256::I256;

pub struct Position {
    pub size: u256,
    pub collateral: u256,
    pub average_price: u256,
    pub cumulative_funding_rate: u256,
    pub reserve_amount: u256, // TODO
    pub realized_pnl: I256, // TODO
    pub last_increased_time: u64, // TODO
}
pub struct PositionKey {
    pub account: Identity,
    pub index_asset: b256,
    pub is_long: bool,
}
pub struct FundingInfo {
    pub total_short_sizes: u256,
    pub total_long_sizes: u256,
    pub long_cumulative_funding_rate: u256,
    pub short_cumulative_funding_rate: u256,
    pub last_funding_time: u64,
}
pub enum PositionSettlementStatus {
    Success: (),
    InsufficientCollateral: (),
    InsufficientReserves: (),
}
abi Vault {
    /// Get the revision of the contract
    fn get_revision() -> u8;
    #[storage(read, write)]
    fn initialize(gov: Identity);
    /*
          ____     _       _           _       
         / / /    / \   __| |_ __ ___ (_)_ __  
        / / /    / _ \ / _` | '_ ` _ \| | '_ \ 
       / / /    / ___ \ (_| | | | | | | | | | |
      /_/_/    /_/   \_\__,_|_| |_| |_|_|_| |_|                         
    */
    #[storage(write)]
    fn set_liquidator(liquidator: Identity, is_active: bool);
    #[storage(read, write)]
    fn set_fees(
        liquidity_fee_basis_points: u64,
        position_fee_basis_points: u64,
        liquidation_fee_basis_points: u64,
    );
    #[storage(read, write)]
    fn withdraw_fees(receiver: Identity) -> u64;
    #[storage(read, write)]
    fn set_asset_config(asset: b256, max_leverage: u256);
    #[storage(read, write)]
    fn clear_asset_config(asset: b256);
    #[storage(write)]
    fn set_approved_router(router: Identity, is_active: bool);
    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    fn get_position_key(account: Identity, index_asset: b256, is_long: bool) -> b256;
    #[storage(read)]
    fn get_position_pnl(account: Identity, index_asset: b256, is_long: bool) -> (bool, u256);
    #[storage(read)]
    fn get_pnl(
        index_asset: b256,
        size: u256,
        average_price: u256,
        is_long: bool,
    ) -> (bool, u256);
    #[storage(read)]
    fn get_position_by_key(position_key: b256) -> Position;
    #[storage(read)]
    fn get_max_price(asset: b256) -> u256;
    #[storage(read)]
    fn get_min_price(asset: b256) -> u256;
    #[storage(read)]
    fn get_total_reserves() -> u256;
    #[storage(read)]
    fn get_total_liquidity() -> u256;
    #[storage(read)]
    fn get_fee_reserve() -> u256;
    #[storage(read)]
    fn is_asset_whitelisted(asset: b256) -> bool;
    #[storage(read)]
    fn get_base_asset() -> AssetId;
    fn get_lp_asset() -> AssetId;
    #[storage(read)]
    fn get_position_leverage(account: Identity, index_asset: b256, is_long: bool) -> u256;
    #[storage(read)]
    fn get_position_funding_rate(account: Identity, index_asset: b256, is_long: bool) -> (u256, bool);

    #[storage(read)]
    fn get_liquidation_fee_basis_points() -> u64;
    #[storage(read)]
    fn get_liquidity_fee_basis_points() -> u64;
    #[storage(read)]
    fn get_position_fee_basis_points() -> u64;
    #[storage(read)]
    fn is_liquidator(account: Identity) -> bool;
    #[storage(read)]
    fn validate_liquidation(
        account: Identity,
        index_asset: b256,
        is_long: bool,
        should_raise: bool,
    ) -> (u256, u256);
    #[storage(read)]
    fn get_add_liquidity_amount(base_asset_amount: u64) -> (u64, u64, u64);
    #[storage(read)]
    fn get_remove_liquidity_amount(lp_asset_amount: u64) -> (u64, u64, u64, u64);
    #[storage(read)]
    fn get_funding_info(asset: b256) -> FundingInfo;
    /*
          ____  ____        _     _ _
         / / / |  _ \ _   _| |__ | (_) ___ 
        / / /  | |_) | | | | '_ \| | |/ __|
       / / /   |  __/| |_| | |_) | | | (__ 
      /_/_/    |_|    \__,_|_.__/|_|_|\___|
    */
    #[payable]
    #[storage(read, write)]
    fn add_liquidity(receiver: Identity) -> u64;
    #[payable]
    #[storage(read, write)]
    fn remove_liquidity(receiver: Identity) -> u64;
    #[payable]
    #[storage(read, write)]
    fn increase_position(
        account: Identity,
        index_asset: b256,
        size_delta: u256,
        is_long: bool,
    ) -> (u256, u256);
    #[storage(read, write)]
    fn decrease_position(
        account: Identity,
        index_asset: b256,
        collateral_delta: u256,
        size_delta: u256,
        is_long: bool,
        receiver: Identity,
    ) -> (u256, u256, u256);
    #[storage(read, write)]
    fn liquidate_position(
        account: Identity,
        index_asset: b256,
        is_long: bool,
        fee_receiver: Identity,
    );
}
impl Hash for PositionKey {
    fn hash(self, ref mut state: Hasher) {
        self.account.hash(state);
        self.index_asset.hash(state);
        self.is_long.hash(state);
    }
}
impl Position {
    pub fn default() -> Self {
        Position {
            size: 0,
            collateral: 0,
            average_price: 0,
            cumulative_funding_rate: 0,
            reserve_amount: 0,
            realized_pnl: I256::zero(),
            last_increased_time: 0,
        }
    }
}
