// SPDX-License-Identifier: Apache-2.0
library;

use std::{
    string::String,
};

abi YieldTracker {
    #[storage(read, write)]
    fn initialize(yield_asset: ContractId);

    /*
          ____     _       _           _       
         / / /    / \   __| |_ __ ___ (_)_ __  
        / / /    / _ \ / _` | '_ ` _ \| | '_ \ 
       / / /    / ___ \ (_| | | | | | | | | | |
      /_/_/    /_/   \_\__,_|_| |_| |_|_|_| |_|                         
    */
    #[storage(read, write)]
    fn set_gov(new_gov: Identity);

    #[storage(read, write)]
    fn set_time_distributor(time_distributor: ContractId);

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    #[storage(read)]
    fn get_assets_per_interval() -> u64;

    #[storage(read)]
    fn claimable(
        account: Identity,
        // staked balance of the account
        yield_asset_staked_balance: u256
    ) -> u256;

    /*
          ____  ____        _     _ _
         / / / |  _ \ _   _| |__ | (_) ___ 
        / / /  | |_) | | | | '_ \| | |/ __|
       / / /   |  __/| |_| | |_) | | | (__ 
      /_/_/    |_|    \__,_|_.__/|_|_|\___|
    */
    /// callable only by the YieldAsset contract for the specific YieldTracker contract
    /// the YieldAsset contract is responsible for retrieving the latest staked balance of an account
    /// since doing so onchain isn't possible with Fuel's UTXO model
    #[storage(read, write)]
    fn update_rewards(
        account: Identity,
        // staked balance of the account
        yield_asset_staked_balance: u256
    );

    /// callable only by the YieldAsset contract for the specific YieldTracker contract
    /// the YieldAsset contract is responsible for retrieving the latest staked balance of an account
    /// since doing so onchain isn't possible with Fuel's UTXO model
    #[storage(read, write)]
    fn claim(
        account: Identity,
        receiver: Identity,
        // staked balance of the account
        yield_asset_staked_balance: u256
    ) -> u256;
}