// SPDX-License-Identifier: Apache-2.0
contract;

/*
__     __          _ _     ____       _           __               _ 
\ \   / /_ _ _   _| | |_  |  _ \ _ __(_) ___ ___ / _| ___  ___  __| |
 \ \ / / _` | | | | | __| | |_) | '__| |/ __/ _ \ |_ / _ \/ _ \/ _` |
  \ V / (_| | |_| | | |_  |  __/| |  | | (_|  __/  _|  __/  __/ (_| |
   \_/ \__,_|\__,_|_|\__| |_|   |_|  |_|\___\___|_|  \___|\___|\__,_|
*/

mod events;
mod constants;
mod errors;

use pyth_interface::{
    data_structures::price::{Price, PriceFeedId},
    PythCore
};
use std::{
    block::timestamp,
    bytes::Bytes,
    context::*,
    convert::TryFrom,
    math::*,
    primitive_conversions::u64::*,
    revert::require,
    storage::storage_vec::*,
    vec::Vec,
    b512::B512,
	ecr::ec_recover_address,
};
use std::hash::*;
use helpers::{
    zero::*, 
    utils::*,
    time::get_unix_timestamp,
};
use core_interfaces::vault_pricefeed::{
    VaultPricefeed,
    PriceMessage
};
use constants::*;
use errors::*;
use events::*;

/*
    // ------------------------ Format of Pyth Price ------------------------
    From: https://github.com/pyth-network/pyth-crosschain/blob/4ab64d2539a749e51e1281bdd7744781f5e9df8c/target_chains/fuel/contracts/pyth-interface/src/data_structures/price.sw

    pub struct Price {
        // Confidence interval around the price
        pub confidence: u64,
        // Price exponent
        // This value represents the absolute value of an i32 in the range -255 to 0. Values other than 0, should be considered negative:
        // exponent of 5 means the Pyth Price exponent was -5
        pub exponent: u32,
        // Price
        pub price: u64,
        // The TAI64 timestamp describing when the price was published
        pub publish_time: u64,
    }
*/

// revision of the contract
const REVISION: u8 = 5u8;

storage {
    // gov is not restricted to an `Address` (EOA) or a `Contract` (external)
    // because this can be either a regular EOA (Address) or a Multisig (Contract)
    gov: Identity = ZERO_IDENTITY,
    is_initialized: bool = false,

    // asset -> pyth pricefeed id
    pyth_pricefeed: StorageMap<AssetId, PriceFeedId> = StorageMap {},
    // pyth pricefeed -> price
    prices: StorageMap<PriceFeedId, Price> = StorageMap {},
    // asset -> decimals
    decimals: StorageMap<AssetId, u32> = StorageMap {},

    price_signer: Address = ZERO_ADDRESS,

    max_price_aheadness: u64 = 30,
    max_price_staleness: u64 = 100,

    // prevent signature replay
    // cannot use signatures (B512) because `Hash` trait is not implemented for B512
    // hashed messages are a good standin because they are unique and signature 
    // is already verified prior to updating this storage slot
    used_hashed_messages: StorageMap<b256, bool> = StorageMap {},
}

impl VaultPricefeed for Contract {
    /// Get the revision of the contract
    fn get_revision() -> u8 {
        REVISION
    }

    #[storage(read, write)]
    fn initialize(
        gov: Identity,
        price_signer: Address
    ) {
        require(!storage.is_initialized.read(), Error::VaultPriceFeedAlreadyInitialized);
        storage.is_initialized.write(true);
        
        _set_gov(gov);
        _set_price_signer(price_signer);
    }

    /*
          ____     _       _           _       
         / / /    / \   __| |_ __ ___ (_)_ __  
        / / /    / _ \ / _` | '_ ` _ \| | '_ \ 
       / / /    / ___ \ (_| | | | | | | | | | |
      /_/_/    /_/   \_\__,_|_| |_| |_|_|_| |_|                         
    */
    #[storage(read, write)]
    fn set_gov(gov: Identity) {
        _only_gov();
        _set_gov(gov);
    }

    #[storage(read, write)]
    fn set_price_signer(price_signer: Address) {
        _only_gov();
        _set_price_signer(price_signer);
    }

    #[storage(read, write)]
    fn set_price_configs(
        max_price_aheadness: u64,
        max_price_staleness: u64
    ) {
        _only_gov();
        storage.max_price_aheadness.write(max_price_aheadness);
        storage.max_price_staleness.write(max_price_staleness);
        log(SetPythPriceConfigs { max_price_aheadness, max_price_staleness });
    }

    #[storage(read, write)]
    fn set_asset_config(
        asset: AssetId,
        pyth_pricefeed: PriceFeedId,
        decimals: u32
    ) {
        _only_gov();
        storage.pyth_pricefeed.insert(asset, pyth_pricefeed);
        storage.decimals.insert(asset, decimals);
        log(SetPythPricefeed { asset, pricefeed_id: pyth_pricefeed, decimals });
    }
    
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
    ) -> u256 {
        _get_price(asset, maximize)
    }

    /*
          ____  ____        _     _ _      
         / / / |  _ \ _   _| |__ | (_) ___ 
        / / /  | |_) | | | | '_ \| | |/ __|
       / / /   |  __/| |_| | |_) | | | (__ 
      /_/_/    |_|    \__,_|_.__/|_|_|\___|
    */
    /// to prevent signature replay attacks, timestamp is encoded within the price message
    /// timestamp can be at most 120s (2min) within the current onchain Unix timestamp
    #[storage(read, write)]
    fn update_price(
        price_message: PriceMessage,
        signature: B512
    ) {
        let asset = price_message.asset;
        let timestamp = price_message.timestamp;

        // timestamp deviation can be at most 120s (to account for network latency)
        let curr_timestamp = get_unix_timestamp();
        let time_diff = if timestamp > curr_timestamp {
            timestamp - curr_timestamp
        } else {
            curr_timestamp - timestamp
        };
        require(
            time_diff <= 120,
            Error::VaultPriceFeedInvalidMessageTimestamp
        );

        let hashed_price_message = sha256(price_message);
        let recovered_address = ec_recover_address(signature, hashed_price_message).unwrap().bits();
        require(
            recovered_address == storage.price_signer.read().bits(),
            Error::VaultPriceFeedInvalidSignature
        );
        // require(
        //     !storage.used_hashed_messages.get(hashed_price_message).try_read().unwrap_or(false),
        //     Error::VaultPriceFeedSignatureAlreadyUsed
        // );
        storage.used_hashed_messages.insert(hashed_price_message, true);

        let pricefeed_id = storage.pyth_pricefeed.get(asset).try_read().unwrap_or(ZERO);
        require(
            pricefeed_id != ZERO,
            Error::VaultPriceFeedInvalidPriceFeedToUpdate
        );

        let decimals = storage.decimals.get(asset).try_read().unwrap_or(0);

        let price = Price {
            confidence: 0,
            exponent: decimals,
            price: price_message.price,
            // don't use the timestamp from the price message
            // because it may be conflict with the max_price_aheadness
            publish_time: get_unix_timestamp(),
        };
        storage.prices.insert(pricefeed_id, price);
        log(SetPrice { asset, price, timestamp });
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
    require(get_sender() == storage.gov.read(), Error::VaultPriceFeedForbidden);
}

#[storage(read, write)]
fn _set_gov(gov: Identity) {
    storage.gov.write(gov);
    log(SetGov { gov });
}

#[storage(read, write)]
fn _set_price_signer(price_signer: Address) {
    storage.price_signer.write(price_signer);
    log(SetPriceSigner { price_signer });
}

#[storage(read)]
fn _get_price(
    asset: AssetId,
    maximize: bool
) -> u256 {
    let pricefeed_id = storage.pyth_pricefeed.get(asset).try_read().unwrap_or(ZERO);
    require(
        pricefeed_id != ZERO,
        Error::VaultPriceFeedInvalidPriceFeed
    );

    let mut price = storage.prices.get(pricefeed_id).try_read().unwrap_or(Price::new(0, 0, 0, 0));

    require(
        price.price > 0,
        Error::VaultPriceFeedCouldNotFetchPrice
    );

    // validate values
    if price.publish_time < get_unix_timestamp() {
        let staleness = get_unix_timestamp() - price.publish_time;
        require(
            staleness <= storage.max_price_staleness.read(),
            Error::VaultPriceFeedPriceIsStale
        );
    } else {
        let aheadness = price.publish_time - get_unix_timestamp();
        require(
            aheadness <= storage.max_price_aheadness.read(),
            Error::VaultPriceFeedPriceIsAhead
        );
    }

    // confidence is 0.1% of the price
    let confidence = price.price / 1000;

    if maximize {
        price.price = price.price + confidence;
    } else {
        price.price = price.price - confidence;
    }

    // normalize price precision
    price.price.as_u256() * PRICE_PRECISION / 10.pow(price.exponent).as_u256()
}