// SPDX-License-Identifier: Apache-2.0
library;

use std::string::String;

pub struct SetGov {
    pub gov: Identity,
}

pub struct SetApprovedMinter {
    pub minter: Identity,
    pub is_active: bool,
}

pub struct SetNameEvent {
    pub asset: AssetId,
    pub name: Option<String>,
    pub sender: Identity,
}

pub struct SetSymbolEvent {
    pub asset: AssetId,
    pub symbol: Option<String>,
    pub sender: Identity,
}

pub struct SetDecimalsEvent {
    pub asset: AssetId,
    pub decimals: u8,
    pub sender: Identity,
}

pub struct UpdateTotalSupplyEvent {
    pub asset: AssetId,
    pub supply: u64,
    pub sender: Identity,
}