// SPDX-License-Identifier: Apache-2.0
library;

use std::{
    string::String,
    b512::B512
};

abi YieldAsset {
    /*
          ____     _       _           _       
         / / /    / \   __| |_ __ ___ (_)_ __  
        / / /    / _ \ / _` | '_ ` _ \| | '_ \ 
       / / /    / ___ \ (_| | | | | | | | | | |
      /_/_/    /_/   \_\__,_|_| |_| |_|_|_| |_|                         
    */
    #[storage(read, write)]
    fn set_gov(gov: Identity);

    /// handler responsible for updating the user's staked balance
    /// different from `gov` because this is a hot wallet solely for the purposes of signing staked balance updates
    /// if this handler is compromised, it would lead to incorrect rewards calculations which over time could
    /// add up, but are insignificant in the short term
    /// rather than having `gov` to be a hot wallet to sign messages on the go which increases the potential attack surface
    #[storage(read, write)]
    fn set_staked_balance_handler(staked_balance_handler: Address);

    #[storage(read, write)]
    fn set_yield_trackers(yield_trackers: Vec<ContractId>);

    #[storage(read, write)]
    fn set_admin(
        account: Identity,
        active: bool,
    );

    #[storage(read, write)]
    fn add_nonstaking_account(account: Identity);

    #[storage(read, write)]
    fn remove_nonstaking_account(account: Identity);

    #[storage(read)]
    fn recover_claim(
        account: Identity,
        receiver: Identity,
    );

    #[storage(read)]
    fn claim(receiver: Identity);

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    /// Returns the AssetId of the `YieldAsset` asset
    fn get_id() -> AssetId;

    #[storage(read)]
    fn total_staked() -> u64;

    /*
          ____  ____        _     _ _
         / / / |  _ \ _   _| |__ | (_) ___ 
        / / /  | |_) | | | | '_ \| | |/ __|
       / / /   |  __/| |_| | |_) | | | (__ 
      /_/_/    |_|    \__,_|_.__/|_|_|\___|
    */
    #[storage(read, write)]
    fn set_user_staked_balance(
        account: Identity,
        amount: u64,
        signature: B512
    );
}