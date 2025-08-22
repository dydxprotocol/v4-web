// SPDX-License-Identifier: Apache-2.0
library;

use std::string::String;

pub struct SetGov {
    pub gov: Identity,
}

pub struct SetAdmin {
    pub account: Identity,
    pub active: bool,
}

pub struct SetVault {
    pub vault: ContractId,
    pub active: bool,
}

pub struct SetStakedBalanceHandler {
    pub staked_balance_handler: Address,
}

pub struct SetYieldTrackers {
    pub yield_trackers: Vec<ContractId>,
}

pub struct SetNonStakingAccount {
    pub account: Identity,
    pub active: bool,
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