// SPDX-License-Identifier: Apache-2.0
library;

abi TimeDistributor {
    #[storage(read, write)]
    fn initialize();

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
    fn set_assets_per_interval(
        receiver: Identity,
        amount: u64
    );

    #[storage(read, write)]
    fn update_last_distribution_time(receiver: Identity);

    #[storage(read, write)]
    fn set_distribution(
        receivers: Vec<Identity>,
        amounts: Vec<u64>,
        reward_assets: Vec<AssetId>
    );

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    #[storage(read)]
    fn get_intervals(receiver: Identity) -> u64;

    #[storage(read)]
    fn get_reward_asset(receiver: Identity) -> AssetId;

    #[storage(read)]
    fn get_assets_per_interval(account: Identity) -> u64;

    #[storage(read)]
    fn get_distribution_amount(receiver: Identity) -> u64;

    /*
          ____  ____        _     _ _
         / / / |  _ \ _   _| |__ | (_) ___ 
        / / /  | |_) | | | | '_ \| | |/ __|
       / / /   |  __/| |_| | |_) | | | (__ 
      /_/_/    |_|    \__,_|_.__/|_|_|\___|
    */
    #[storage(read, write)]
    fn distribute() -> u64;
}