// SPDX-License-Identifier: Apache-2.0
contract;

/*
 ____  _                _         _____               _             
/ ___|| |__   ___  _ __| |_ ___  |_   _| __ __ _  ___| | _____ _ __ 
\___ \| '_ \ / _ \| '__| __/ __|   | || '__/ _` |/ __| |/ / _ \ '__|
 ___) | | | | (_) | |  | |_\__ \   | || | | (_| | (__|   <  __/ |   
|____/|_| |_|\___/|_|   \__|___/   |_||_|  \__,_|\___|_|\_\___|_|   
*/

mod errors;
use std::{
    context::*,
    revert::require,
};
use std::hash::*;
use core_interfaces::{
    shorts_tracker::ShortsTracker,
    vault::Vault,
};
use helpers::{
    zero::*, 
    utils::*, 
    signed_256::*
};
use errors::*;

storage {
    // gov is not restricted to an `Address` (EOA) or a `Contract` (external)
    // because this can be either a regular EOA (Address) or a Multisig (Contract)
    gov: Identity = ZERO_IDENTITY,
    is_initialized: bool = false,
    is_global_short_data_ready: bool = false,
    
    vault: ContractId = ZERO_CONTRACT,

    // data: StorageMap<b256, b256> = StorageMap {},
    is_handler: StorageMap<Identity, bool> = StorageMap {},
    global_short_average_prices: StorageMap<AssetId, u256> = StorageMap {},
}

// Event
struct GlobalShortDataUpdated {
    asset: AssetId,
    global_short_size: u256,
    global_short_average_price: u256
}

impl ShortsTracker for Contract {
    #[storage(read, write)]
    fn initialize(vault: ContractId) {
        require(!storage.is_initialized.read(), Error::ShortsTrackerAlreadyInitialized);
        require(!vault.is_zero(), Error::ShortsTrackerVaultZero);
        
        storage.is_initialized.write(true);
        storage.gov.write(get_sender());
        storage.vault.write(vault);
    }

    /*
          ____     _       _           _       
         / / /    / \   __| |_ __ ___ (_)_ __  
        / / /    / _ \ / _` | '_ ` _ \| | '_ \ 
       / / /    / ___ \ (_| | | | | | | | | | |
      /_/_/    /_/   \_\__,_|_| |_| |_|_|_| |_|                         
    */
    #[storage(read, write)]
    fn set_handler(handler: Identity, is_active: bool) {
        _only_gov();

        require(!handler.is_zero(), Error::ShortsTrackerHandlerZero);
        storage.is_handler.insert(handler, is_active);
    }

    #[storage(read, write)]
    fn update_global_short_data(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool,
        size_delta: u256,
        mark_price: u256,
        is_increase: bool
    ) {
        _only_handler();

        if is_long || size_delta == 0 {
            return;
        }

        if !storage.is_global_short_data_ready.read() {
            return;
        }

        let (global_short_size, global_short_average_price) = _get_next_global_short_data(
            account,
            collateral_asset,
            index_asset,
            mark_price,
            size_delta,
            is_increase
        );

        storage.global_short_average_prices.insert(index_asset, global_short_average_price);

        log(GlobalShortDataUpdated {
            asset: index_asset,
            global_short_size,
            global_short_average_price
        });
    }

    #[storage(read, write)]
    fn set_init_data(
        assets: Vec<AssetId>,
        average_prices: Vec<u256>,
    ) {
        _only_gov();
        require(!storage.is_global_short_data_ready.read(), Error::ShortsTrackerAlreadyMigrated);
        require(assets.len() == average_prices.len(), Error::ShortsTrackerInvalidLen);

        let mut i = 0;
        while i < assets.len() {
            storage.global_short_average_prices.insert(
                assets.get(i).unwrap(), 
                average_prices.get(i).unwrap()
            );
            i += 1;
        }

        storage.is_global_short_data_ready.write(true);
    }

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    #[storage(read)]
    fn is_global_short_data_ready() -> bool {
        storage.is_global_short_data_ready.read()
    }

    #[storage(read)]
    fn get_global_short_average_prices(asset: AssetId) -> u256 {
        storage.global_short_average_prices.get(asset).try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_next_global_short_data(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        next_price: u256,
        size_delta: u256,
        is_increase: bool
    ) -> (u256, u256) {
        _get_next_global_short_data(
            account,
            collateral_asset,
            index_asset,
            next_price,
            size_delta,
            is_increase
        )
    }

    fn get_next_global_average_price(
        average_price: u256,
        next_price: u256,
        next_size: u256,
        delta: u256,
        realized_pnl: Signed256
    ) -> u256 {
        _get_next_global_average_price(
            average_price,
            next_price,
            next_size,
            delta,
            realized_pnl
        )
    }

    fn get_next_delta(
        delta: u256,
        average_price: u256,
        next_price: u256,
        realized_pnl: Signed256
    ) -> (bool, u256) {
        _get_next_delta(
            delta,
            average_price,
            next_price,
            realized_pnl
        )
    }

    #[storage(read)]
    fn get_realized_pnl(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        size_delta: u256,
        is_increase: bool 
    ) -> Signed256 {
        _get_realized_pnl(
            account,
            collateral_asset,
            index_asset,
            size_delta,
            is_increase
        )
    }
}

/*
    ____  ___       _                        _ 
   / / / |_ _|_ __ | |_ ___ _ __ _ __   __ _| |
  / / /   | || '_ \| __/ _ \ '__| '_ \ / _` | |
 / / /    | || | | | ||  __/ |  | | | | (_| | |
/_/_/    |___|_| |_|\__\___|_|  |_| |_|\__,_|_|
*/
#[storage(read)]
fn _only_gov() {
    require(get_sender() == storage.gov.read(), Error::ShortsTrackerForbidden);
}

#[storage(read)]
fn _only_handler() {
    require(
        storage.is_handler.get(get_sender())
            .try_read().unwrap_or(false),
        Error::ShortsTrackerForbidden
    );
}

#[storage(read)]
fn _get_next_global_short_data(
    account: Identity,
    collateral_asset: AssetId,
    index_asset: AssetId,
    next_price: u256,
    size_delta: u256,
    is_increase: bool
) -> (u256, u256) {
    let realized_pnl = _get_realized_pnl(
        account,
        collateral_asset,
        index_asset,
        size_delta,
        is_increase
    );
    let avg_price = storage.global_short_average_prices.get(index_asset)
        .try_read().unwrap_or(0);
    let price_delta = if avg_price > next_price { 
        avg_price - next_price 
    } else { 
        next_price - avg_price 
    };

    let vault = abi(Vault, storage.vault.read().into());
    let size = vault.get_global_short_sizes(index_asset);

    let next_size = if is_increase { size + size_delta } else { size - size_delta };

    if next_size == 0 {
        return (0, 0);
    }

    if avg_price == 0 {
        return (next_size, next_price);
    }

    let delta = size * price_delta / avg_price;

    let next_average_price = _get_next_global_average_price(
        avg_price,
        next_price,
        next_size,
        delta,
        realized_pnl,
    );

    (next_size, next_average_price)
}

fn _get_next_global_average_price(
    average_price: u256,
    next_price: u256,
    next_size: u256,
    delta: u256,
    realized_pnl: Signed256
) -> u256 {
    let (has_profit, next_delta) = _get_next_delta(
        delta,
        average_price,
        next_price,
        realized_pnl
    );

    let denom = if has_profit { next_size - next_delta } else { next_size + next_delta };
    let next_average_price = next_price * next_size / denom;

    next_average_price
}

fn _get_next_delta(
    delta_: u256,
    average_price: u256,
    next_price: u256,
    realized_pnl: Signed256
) -> (bool, u256) {
    // global delta 10000, realised pnl 1000 => new pnl 9000
    // global delta 10000, realised pnl -1000 => new pnl 11000
    // global delta -10000, realised pnl 1000 => new pnl -11000
    // global delta -10000, realised pnl -1000 => new pnl -9000
    // global delta 10000, realised pnl 11000 => new pnl -1000 (flips sign)
    // global delta -10000, realised pnl -11000 => new pnl 1000 (flips sign)
    
    let mut has_profit = average_price > next_price;

    // @TODO: check this (delta)
    let mut delta: u256 = delta_;
    let value = realized_pnl.value;
    
    if has_profit {
        // global shorts pnl is positive
        if !realized_pnl.is_neg {
            if value > delta {
                delta = value - delta;
                has_profit = false;
            } else {
                delta = delta - value;
            }
        } else {
            // We want to add the positive value of the realized pnl to the global delta
            delta = delta + value;
        }

        return (has_profit, delta);
    }

    if !realized_pnl.is_neg {
        delta = delta + value;
    } else {
        if value > delta {
            delta = value - delta;
            has_profit = true;
        } else {
            delta = delta - value;
        }
    }

    (has_profit, delta)
}

#[storage(read)]
fn _get_realized_pnl(
    account: Identity,
    collateral_asset: AssetId,
    index_asset: AssetId,
    size_delta: u256,
    is_increase: bool 
) -> Signed256 {
    if is_increase {
        return Signed256::from(0);
    }

    let vault = abi(Vault, storage.vault.read().into());

    let position_key = vault.get_position_key(account, collateral_asset, index_asset, false);
    let position = vault.get_position_by_key(position_key);

    let size = position.size;
    
    let (has_profit, delta) = vault.get_delta(
        index_asset,
        size,
        position.average_price,
        false,
        position.last_increased_time
    );

    // get the proportional change in pnl
    let adjusted_delta = size_delta * delta / size;

    Signed256::from_u256(adjusted_delta, if has_profit { false } else { true })
}