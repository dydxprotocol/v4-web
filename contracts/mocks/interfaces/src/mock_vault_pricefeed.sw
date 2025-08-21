// SPDX-License-Identifier: Apache-2.0
library;

abi MockVaultPricefeed {
    #[storage(read, write)]
    fn initialize(gov: Identity);

    /*
          ____     _       _           _       
         / / /    / \   __| |_ __ ___ (_)_ __  
        / / /    / _ \ / _` | '_ ` _ \| | '_ \ 
       / / /    / ___ \ (_| | | | | | | | | | |
      /_/_/    /_/   \_\__,_|_| |_| |_|_|_| |_|                         
    */
    #[storage(read, write)]
    fn set_adjustment(
        asset: AssetId,
        is_additive: bool,
        adjustment_bps: u64
    );

    #[storage(read, write)]
    fn set_use_v2_pricing(use_v2_pricing: bool);

    #[storage(read, write)]
    fn set_is_amm_enabled(is_enabled: bool);

    #[storage(read, write)]
    fn set_is_secondary_price_enabled(is_enabled: bool);

    #[storage(read, write)]
    fn set_secondary_pricefeed(secondary_pricefeed: ContractId);
    
    #[storage(read, write)]
    fn set_spread_basis_points(asset: AssetId, spread_basis_points: u64);

    #[storage(read, write)]
    fn set_spread_threshold_basis_points(spread_threshold_basis_points: u64);

    #[storage(read, write)]
    fn set_favor_primary_price(favor_primary_price: bool);

    #[storage(read, write)]
    fn set_price_sample_space(price_sample_space: u64);

    #[storage(read, write)]
    fn set_max_strict_price_deviation(max_strict_price_deviation: u256);

    #[storage(read, write)]
    fn set_asset_config(
        asset: AssetId,
        pricefeed: ContractId,
        price_decimals: u8,
    );

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    #[storage(read)]
    fn get_adjustment_basis_points(asset: AssetId) -> u64;

    #[storage(read)]
    fn is_adjustment_additive(asset: AssetId) -> bool;

    #[storage(read)]
    fn get_price(
        asset: AssetId,
        maximize: bool
    ) -> u256;

    #[storage(read)]
    fn get_price_v1(
        asset: AssetId,
        maximize: bool,
        include_amm_price: bool
    ) -> u256;

    #[storage(read)]
    fn get_price_v2(
        asset: AssetId,
        maximize: bool,
        include_amm_price: bool
    ) -> u256;

    #[storage(read)]
    fn get_latest_primary_price(asset: AssetId) -> u256;

    #[storage(read)]
    fn get_primary_price(
        asset: AssetId,
        maximize: bool
    ) -> u256;

    /*
          ____  ____        _     _ _
         / / / |  _ \ _   _| |__ | (_) ___ 
        / / /  | |_) | | | | '_ \| | |/ __|
       / / /   |  __/| |_| | |_) | | | (__ 
      /_/_/    |_|    \__,_|_.__/|_|_|\___|
    */
    // this is just a helper method to update the price of an asset directly from VaultPricefeed
    // this will be removed in the future when Pyth prices are supported on-chain
    #[storage(read)]
    fn update_price(
        asset: AssetId,
        new_price: u256
    );
}