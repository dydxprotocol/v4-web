// SPDX-License-Identifier: Apache-2.0
library;


use pyth_interface::data_structures::price::{Price, PriceFeedId};

pub struct SetGov {
    pub gov: Identity
}

pub struct SetPythPricefeed {
    pub asset: AssetId,
    pub pricefeed_id: PriceFeedId,
    pub decimals: u32
}

pub struct SetPriceSigner {
    pub price_signer: Address
}

pub struct SetPythPriceConfigs {
    pub max_price_aheadness: u64,
    pub max_price_staleness: u64
}

pub struct SetPrice {
    pub asset: AssetId,
    pub price: Price,
    pub timestamp: u64
}