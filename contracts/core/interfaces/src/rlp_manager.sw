// SPDX-License-Identifier: Apache-2.0
library;

use std::{
    hash::*,
    b512::B512
};
use helpers::{
    utils::*
};

abi RLPManager {
    fn get_revision() -> u8;

    #[storage(read, write)]
    fn initialize(
        vault_router: ContractId,
        rusd: ContractId,
        rlp: ContractId,
        shorts_tracker: ContractId,
        cooldown_duration: u64
    );
 
    /* 
          ____     _       _           _       
         / / /    / \   __| |_ __ ___ (_)_ __  
        / / /    / _ \ / _` | '_ ` _ \| | '_ \ 
       / / /    / ___ \ (_| | | | | | | | | | |
      /_/_/    /_/   \_\__,_|_| |_| |_|_|_| |_|                         
    */
    #[storage(read, write)]
    fn upgrade_and_withdraw(
        asset: AssetId,
        new_rlp_contract_receiver: ContractId,
    );

    #[storage(read, write)]
    fn set_gov(gov: Identity);

    #[storage(read, write)]
    fn set_vault(vault_router: ContractId);

    #[storage(read, write)]
    fn set_in_private_mode(in_private_mode: bool);

    #[storage(read, write)]
    fn set_shorts_tracker(shorts_tracker: ContractId);

    #[storage(read, write)]
    fn set_shorts_tracker_avg_price_weight(shorts_tracker_avg_price_weight: u64);

    #[storage(read, write)]
    fn set_handler(handler: Identity, is_active: bool);

    #[storage(read, write)]
    fn set_cooldown_duration(cooldown_duration: u64);

    #[storage(read, write)]
    fn set_aum_adjustment(
        aum_addition: u256,
        aum_deduction: u256
    );

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    #[storage(read)]
    fn get_price(maximize: bool) -> u256;

    #[storage(read)]
    fn get_aums() -> Vec<u256>;

    #[storage(read)]
    fn get_aum_in_rusd(maximize: bool) -> u256;

    #[storage(read)]
    fn get_rlp_contract() -> ContractId;

    #[storage(read)]
    fn get_rusd_contract() -> ContractId;

    #[storage(read)]
    fn get_vault() -> ContractId;

    /*
          ____  ____        _     _ _
         / / / |  _ \ _   _| |__ | (_) ___ 
        / / /  | |_) | | | | '_ \| | |/ __|
       / / /   |  __/| |_| | |_) | | | (__ 
      /_/_/    |_|    \__,_|_.__/|_|_|\___|
    */
    #[payable]
    #[storage(read, write)]
    fn add_liquidity(
        asset: AssetId,
        amount: u64,
        min_rusd: u64,
        min_rlp: u64
    ) -> u256;

    #[payable]
    #[storage(read, write)]
    fn add_liquidity_for_account(
        account: Identity,
        asset: AssetId,
        amount: u64,
        min_rusd: u64,
        min_rlp: u64
    ) -> u256;

    #[payable]
    #[storage(read, write)]
    fn remove_liquidity(
        asset_out: AssetId,
        rlp_amount: u64,
        min_out: u64,
        receiver: Identity
    ) -> u256;

    #[payable]
    #[storage(read, write)]
    fn remove_liquidity_for_account(
        account: Identity,
        asset_out: AssetId,
        rlp_amount: u64,
        min_out: u64,
        receiver: Identity
    ) -> u256;
}
