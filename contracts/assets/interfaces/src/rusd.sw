// SPDX-License-Identifier: Apache-2.0
library;

abi RUSD {
    #[storage(read, write)]
    fn initialize(
        vault_router: ContractId,
        staked_balance_handler: Address
    );

    /*
          ____     _       _           _       
         / / /    / \   __| |_ __ ___ (_)_ __  
        / / /    / _ \ / _` | '_ ` _ \| | '_ \ 
       / / /    / ___ \ (_| | | | | | | | | | |
      /_/_/    /_/   \_\__,_|_| |_| |_|_|_| |_|                         
    */
    #[storage(read, write)]
    fn set_vault(
        vault_router: ContractId,
        active: bool,
    );

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    /// Returns the total supply of the RUSD asset
    #[storage(read)]
    fn total_rusd_supply() -> u64;
}