// SPDX-License-Identifier: Apache-2.0
library;

use helpers::{
    signed_256::*,
};

abi ShortsTracker {
    #[storage(read, write)]
    fn initialize(vault_router: ContractId);

    /*
          ____     _       _           _       
         / / /    / \   __| |_ __ ___ (_)_ __  
        / / /    / _ \ / _` | '_ ` _ \| | '_ \ 
       / / /    / ___ \ (_| | | | | | | | | | |
      /_/_/    /_/   \_\__,_|_| |_| |_|_|_| |_|                         
    */
    #[storage(read, write)]
    fn set_handler(handler: Identity, is_active: bool);

    #[storage(read, write)]
    fn update_global_short_data(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool,
        size_delta: u256,
        mark_price: u256,
        is_increase: bool
    );

    #[storage(read, write)]
    fn set_init_data(
        assets: Vec<AssetId>,
        average_prices: Vec<u256>,
    );

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    #[storage(read)]
    fn is_global_short_data_ready() -> bool;

    #[storage(read)]
    fn get_global_short_average_prices(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_next_global_short_data(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        next_price: u256,
        size_delta: u256,
        is_increase: bool
    ) -> (u256, u256);

    fn get_next_global_average_price(
        average_price: u256,
        next_price: u256,
        next_size: u256,
        delta: u256,
        realized_pnl: Signed256
    ) -> u256;

    fn get_next_delta(
        delta: u256,
        average_price: u256,
        next_price: u256,
        realized_pnl: Signed256
    ) -> (bool, u256);

    #[storage(read)]
    fn get_realized_pnl(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        size_delta: u256,
        is_increase: bool 
    ) -> Signed256;
}