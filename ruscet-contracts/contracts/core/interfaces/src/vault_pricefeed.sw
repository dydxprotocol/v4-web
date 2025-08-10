// SPDX-License-Identifier: Apache-2.0
library;

use pyth_interface::data_structures::price::PriceFeedId;
use std::{
    bytes::Bytes,
    b512::B512,
};
use std::hash::*;

pub struct PriceMessage {
	pub asset: AssetId,
	pub price: u64,
    pub timestamp: u64
}

abi VaultPricefeed {
    /// Get the revision of the contract
    fn get_revision() -> u8;

    #[storage(read, write)]
    fn initialize(
        gov: Identity,
        price_signer: Address
    );

    /*
          ____     _       _           _       
         / / /    / \   __| |_ __ ___ (_)_ __  
        / / /    / _ \ / _` | '_ ` _ \| | '_ \ 
       / / /    / ___ \ (_| | | | | | | | | | |
      /_/_/    /_/   \_\__,_|_| |_| |_|_|_| |_|                         
    */
    #[storage(read, write)]
    fn set_gov(gov: Identity);

    #[storage(read, write)]
    fn set_price_signer(price_signer: Address);

    #[storage(read, write)]
    fn set_price_configs(
        max_price_aheadness: u64,
        max_price_staleness: u64
    );

    #[storage(read, write)]
    fn set_asset_config(
        asset: AssetId,
        pyth_pricefeed: PriceFeedId,
        decimals: u32
    );

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    #[storage(read)]
    fn get_price(
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
    #[storage(read, write)]
    fn update_price(
        price_message: PriceMessage,
        signature: B512
    );
}

impl Hash for PriceMessage {
    fn hash(self, ref mut state: Hasher) {
        self.asset.hash(state);
        self.price.hash(state);
        self.timestamp.hash(state);
    }
}