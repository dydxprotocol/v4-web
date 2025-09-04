// SPDX-License-Identifier: Apache-2.0
library;

use std::hash::*;

use helpers::{
    signed_256::*,
};

pub struct Position {
    pub size: u256,
    pub collateral: u256,
    pub average_price: u256,
    pub entry_funding_rate: u256,
    pub reserve_amount: u256,
    pub realized_pnl: Signed256,
    pub last_increased_time: u64
}

pub struct PositionKey {
    pub account: Identity,
    pub collateral_asset: AssetId,
    pub index_asset: AssetId,
    pub is_long: bool,
}

abi Vault {
    /// Get the revision of the contract
    fn get_revision() -> u8;
    
    #[storage(read, write)]
    fn initialize(
        gov: Identity,
        rusd: AssetId,
        rusd_contr: ContractId,
    );

    /*
          ____     _       _           _       
         / / /    / \   __| |_ __ ___ (_)_ __  
        / / /    / _ \ / _` | '_ ` _ \| | '_ \ 
       / / /    / ___ \ (_| | | | | | | | | | |
      /_/_/    /_/   \_\__,_|_| |_| |_|_|_| |_|                         
    */
    #[storage(write)]
    fn set_gov(gov: Identity);

    #[storage(write)]
    fn set_liquidator(
        liquidator: Identity, 
        is_active: bool
    );

    #[storage(write)]
    fn set_pricefeed_provider(pricefeed_provider: ContractId);

     #[storage(write)]
    fn set_max_leverage(
        asset: AssetId,
        max_leverage: u256
    );

    #[storage(write)]
    fn set_buffer_amount(
        asset: AssetId, 
        buffer_amount: u256
    );

    #[storage(write)]
    fn set_max_rusd_amount(
        asset: AssetId, 
        max_rusd_amount: u256
    );

    #[storage(write)]
    fn set_max_global_short_size(
        asset: AssetId, 
        max_global_short_size: u256
    );

    #[storage(read, write)]
    fn set_fees(
        tax_basis_points: u64,
        stable_tax_basis_points: u64,
        mint_burn_fee_basis_points: u64,
        swap_fee_basis_points: u64,
        stable_swap_fee_basis_points: u64,
        margin_fee_basis_points: u64,
        liquidation_fee_usd: u256,
        min_profit_time: u64,
        has_dynamic_fees: bool,
    );

    #[storage(read, write)]
    fn set_funding_rate(
        funding_interval: u64, 
        funding_rate_factor: u64, 
        stable_funding_rate_factor: u64
    );

    #[storage(read, write)]
    fn withdraw_fees(
        asset: AssetId, 
        receiver: Identity
    ) -> u64;

    #[storage(read, write)]
    fn set_asset_config(
        asset: AssetId,
        asset_decimals: u32,
        asset_weight: u64,
        min_profit_bps: u64,
        max_rusd_amount: u256,
        is_stable: bool,
        is_shortable: bool
    );

    #[storage(read, write)]
    fn clear_asset_config(asset: AssetId);

    #[storage(write)]
    fn set_approved_router(
        router: Identity, 
        is_active: bool
    );

    #[storage(write)]
    fn set_router(router: ContractId);

    #[storage(write)]
    fn set_rusd_amount(
        asset: AssetId, 
        amount: u256
    );

    #[storage(read)]
    fn upgrade_vault(
        new_vault: ContractId, 
        asset: AssetId, 
        amount: u64
    );

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    fn get_position_key(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool,
    ) -> b256;

    #[storage(read)]
    fn get_position_delta(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool,
    ) -> (bool, u256);

    #[storage(read)]
    fn get_delta(
        index_asset: AssetId,
        size: u256,
        average_price: u256,
        is_long: bool,
        last_increased_time: u64
    ) -> (bool, u256);

    #[storage(read)]
    fn get_entry_funding_rate(
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool 
    ) -> u256;

    #[storage(read)]
    fn get_funding_fee(
        collateral_asset: AssetId,
        size: u256,
        entry_funding_rate: u256
    ) -> u256;

    #[storage(read)]
    fn get_position_by_key(position_key: b256) -> Position;

    #[storage(read)]
    fn get_position_fee(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool,
        size_delta: u256,
    ) -> u256;

    #[storage(read)]
    fn get_global_short_sizes(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_global_short_average_prices(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_guaranteed_usd(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_max_price(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_min_price(asset: AssetId) -> u256;

    #[storage(read)]
    fn asset_to_usd_min(
        asset: AssetId, 
        asset_amount: u256
    ) -> u256;

    #[storage(read)]
    fn usd_to_asset_max(
        asset: AssetId, 
        usd_amount: u256
    ) -> u256;

    #[storage(read)]
    fn usd_to_asset_min(
        asset: AssetId, 
        usd_amount: u256
    ) -> u256;

    #[storage(read)]
    fn usd_to_asset(
        asset: AssetId, 
        usd_amount: u256, 
        price: u256
    ) -> u256;

    #[storage(read)]
    fn get_pool_amounts(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_fee_reserves(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_reserved_amount(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_rusd_amount(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_max_rusd_amounts(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_buffer_amounts(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_asset_weights(asset: AssetId) -> u64;

    #[storage(read)]
    fn get_redemption_amount(
        asset: AssetId, 
        rusd_amount: u256
    ) -> u256; 

    #[storage(read)]
    fn get_redemption_collateral(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_redemption_collateral_usd(asset: AssetId) -> u256;
    
    #[storage(read)]
    fn get_pricefeed_provider() -> ContractId;

    #[storage(read)]
    fn get_all_whitelisted_assets_length() -> u64;

    #[storage(read)]
    fn get_whitelisted_asset_by_index(index: u64) -> AssetId;

    #[storage(read)]
    fn is_asset_whitelisted(asset: AssetId) -> bool;

    #[storage(read)]
    fn get_asset_decimals(asset: AssetId) -> u32;

    #[storage(read)]
    fn is_stable_asset(asset: AssetId) -> bool;

    #[storage(read)]
    fn is_shortable_asset(asset: AssetId) -> bool;

    #[storage(read)]
    fn get_position_leverage(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool,
    ) -> u256;

    #[storage(read)]
    fn get_cumulative_funding_rate(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_fee_basis_points(
        asset: AssetId,
        rusd_delta: u256,
        fee_basis_points: u256,
        tax_basis_points: u256,
        increment: bool
    ) -> u256;

    #[storage(read)]
    fn get_liquidation_fee_usd() -> u256;

    #[storage(read)]
    fn get_tax_basis_points() -> u64;

    #[storage(read)]
    fn get_stable_tax_basis_points() -> u64;

    #[storage(read)]
    fn get_mint_burn_fee_basis_points() -> u64;

    #[storage(read)]
    fn get_swap_fee_basis_points() -> u64;

    #[storage(read)]
    fn get_stable_swap_fee_basis_points() -> u64;

    #[storage(read)]
    fn get_margin_fee_basis_points() -> u64;

    #[storage(read)]
    fn get_min_profit_time() -> u64;

    #[storage(read)]
    fn get_has_dynamic_fees() -> bool;

    #[storage(read)]
    fn get_target_rusd_amount(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_utilization(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_next_funding_rate(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_global_short_delta(asset: AssetId) -> (bool, u256);

    #[storage(read)]
    fn is_liquidator(account: Identity) -> bool;

    #[storage(read)]
    fn validate_liquidation(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool,
        should_raise: bool,
    ) -> (u256, u256);

    #[storage(read)]
    fn get_buy_rusd_amount(
        asset: AssetId,
        asset_amount: u64
    ) -> (u256, u256, u256);

    #[storage(read)]
    fn get_sell_rusd_amount(
        asset: AssetId,
        rusd_amount: u256
    ) -> (u256, u64, u256);

    #[storage(read)]
    fn get_swap_amounts(
        asset_in: AssetId,
        amount_in: u256,
        asset_out: AssetId,
    ) -> (u256, u64, u256, u256);

    #[storage(read)]
    fn adjust_for_decimals(
        amount: u256, 
        asset_div: AssetId, 
        asset_mul: AssetId
    ) -> u256;
    
    /*
          ____  ____        _     _ _
         / / / |  _ \ _   _| |__ | (_) ___ 
        / / /  | |_) | | | | '_ \| | |/ __|
       / / /   |  __/| |_| | |_) | | | (__ 
      /_/_/    |_|    \__,_|_.__/|_|_|\___|
    */
    #[storage(read, write)]
    fn update_cumulative_funding_rate(collateral_asset: AssetId);

    /// deposit into the pool without minting RUSD tokens
    /// useful in allowing the pool to become over-collaterised
    #[payable]
    #[storage(read, write)]
    fn direct_pool_deposit(asset: AssetId);

    #[payable]
    #[storage(read, write)]
    fn buy_rusd(asset: AssetId, receiver: Identity) -> u256;

    #[payable]
    #[storage(read, write)]
    fn sell_rusd(asset: AssetId, receiver: Identity) -> u256;

    #[payable]
    #[storage(read, write)]
    fn swap(asset_in: AssetId, asset_out: AssetId, receiver: Identity) -> u64;

    #[payable]
    #[storage(read, write)]
    fn increase_position(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        size_delta: u256,
        is_long: bool 
    );

    #[storage(read, write)]
    fn decrease_position(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        collateral_delta: u256,
        size_delta: u256,
        is_long: bool,
        receiver: Identity
    ) -> u256;

    #[storage(read, write)]
    fn liquidate_position(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool,
        fee_receiver: Identity
    );
}

impl Hash for PositionKey {
    fn hash(self, ref mut state: Hasher) {
        self.account.hash(state);
        self.collateral_asset.hash(state);
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
            entry_funding_rate: 0,
            reserve_amount: 0,
            realized_pnl: Signed256::from(0),
            last_increased_time: 0,
        }
    }
}