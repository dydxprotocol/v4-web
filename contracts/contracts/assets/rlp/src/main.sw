// SPDX-License-Identifier: Apache-2.0
contract;

/*
 ____  _     ____           __   ___      _     _      _                 _   
|  _ \| |   |  _ \          \ \ / (_) ___| | __| |    / \   ___ ___  ___| |_ 
| |_) | |   | |_) |  _____   \ V /| |/ _ \ |/ _` |   / _ \ / __/ __|/ _ \ __|
|  _ <| |___|  __/  |_____|   | | | |  __/ | (_| |  / ___ \\__ \__ \  __/ |_ 
|_| \_\_____|_|               |_| |_|\___|_|\__,_| /_/   \_\___/___/\___|\__|
*/

mod errors;
mod events;

use std::{
    asset::{
        mint_to, 
        burn as asset_burn
    },
    context::*,
    revert::require,
    storage::{
        storage_string::*,
        storage_vec::*,
    },
    call_frames::msg_asset_id,
    string::String
};
use std::hash::*;
use helpers::{
    utils::*, 
    transfer::*,
    zero::*
};
use src20::SRC20;
use src3::SRC3;
use asset::{
    base::{
        _total_supply as sl_total_supply,
    },
    supply::{
        _burn as sl_burn,
        _mint as sl_mint,
    },
};
use asset_interfaces::rlp::RLP;
use errors::*;
use events::*;

const DECIMALS: u8 = 9;
const DEFAULT_SUB_ID: SubId = SubId::zero();

storage {
    gov: Identity = ZERO_IDENTITY,
    is_initialized: bool = false,
    
    name: StorageString = StorageString {},
    symbol: StorageString = StorageString {},

    /// total supply of RLP
    /// only really 1 SubId is utilized for RLP minting
    total_supply: StorageMap<AssetId, u64> = StorageMap {},
    /// value for this is ALWAYS 1
    total_assets: u64 = 0,

    approved_minters: StorageMap<Identity, bool> = StorageMap {},
}

impl RLP for Contract {
    #[storage(read, write)]
    fn initialize() {
        require(
            !storage.is_initialized.read(), 
            Error::RLPAlreadyInitialized
        );
        storage.is_initialized.write(true);

        storage.name.write_slice(String::from_ascii_str("RLP"));
        storage.symbol.write_slice(String::from_ascii_str("RLP"));

        let sender = get_sender();
        log(SetNameEvent { 
            asset: _get_id(),
            name: storage.name.read_slice(),
            sender
        });
        log(SetSymbolEvent { 
            asset: _get_id(),
            symbol: storage.symbol.read_slice(),
            sender
        });
        log(SetDecimalsEvent { 
            asset: _get_id(),
            decimals: DECIMALS,
            sender
        });
        
        let sender = get_sender();
        storage.gov.write(sender);
        storage.approved_minters.insert(sender, true);
        log(SetGov { gov: sender });
        log(SetApprovedMinter { minter: sender, is_active: true });
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
        storage.gov.write(gov);
        log(SetGov { gov });
    }

    #[storage(read, write)]
    fn set_minter(minter: Identity, is_active: bool) {
        _only_gov();

        storage.approved_minters.insert(minter, is_active);
        log(SetApprovedMinter { minter, is_active });
    }

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    /// Returns the AssetId of the RLP token
    fn get_id() -> AssetId {
        _get_id()
    }

    /// Returns the total supply of the RLP asset
    #[storage(read)]
    fn total_rlp_supply() -> u64 {
        storage.total_supply.get(_get_id()).try_read().unwrap_or(0)
    }
}

// https://docs.fuel.network/docs/sway-standards/src-20-native-asset/
impl SRC20 for Contract {
    #[storage(read)]
    fn name(_asset: AssetId) -> Option<String> {
        Some(storage.name.read_slice().unwrap())
    }

    #[storage(read)]
    fn symbol(_asset: AssetId) -> Option<String> {
        Some(storage.symbol.read_slice().unwrap())
    }

    #[storage(read)]
    fn decimals(_asset: AssetId) -> Option<u8> {
        Some(DECIMALS)
    }

    #[storage(read)]
    fn total_supply(asset: AssetId) -> Option<u64> {
        sl_total_supply(storage.total_supply, asset)
    }

    /// @dev only 1 DEFAULT_SUB_ID is utilized for RLP minting
    /// @dev value should always yield 1
    #[storage(read)]
    fn total_assets() -> u64 {
        storage.total_assets.read()
    }
}

// https://docs.fuel.network/docs/sway-standards/src-3-minting-and-burning/
impl SRC3 for Contract {
    #[storage(read, write)]
    fn mint(
        recipient: Identity,
        _sub_id: Option<SubId>,
        amount: u64
    ) {
        _only_minter();
        _mint(recipient, amount)
    }

    #[payable]
    #[storage(read, write)]
    fn burn(
        _sub_id: SubId,
        amount: u64
    ) {
        _burn(amount)
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
    require(
        get_sender() == storage.gov.read(),
        Error::RLPForbidden
    );
}

#[storage(read)]
fn _only_minter() {
    require(
        storage.approved_minters.get(get_sender()).try_read().unwrap_or(false),
        Error::RLPOnlyMinter
    );
}

fn _get_id() -> AssetId {
    // AssetId::new(ContractId::this(), DEFAULT_SUB_ID)
    AssetId::default()
}

#[storage(read, write)]
fn _mint(
    recipient: Identity,
    amount: u64
) {
    require(
        amount > 0,
        Error::RLPMintZeroAmount
    );
    // require(recipient != ZERO_IDENTITY, Error::RLPMintToZeroIdentity);

    let _ = sl_mint(
        storage.total_assets,
        storage.total_supply,
        recipient,
        DEFAULT_SUB_ID,
        amount,
    );
}

#[storage(read, write)]
fn _burn(amount: u64) {
    require(
        msg_asset_id() == _get_id(),
        Error::RLPInvalidBurnAssetForwarded
    );
    require(
        msg_amount() == amount,
        Error::RLPInvalidBurnAmountForwarded
    );

    sl_burn(
        storage.total_supply,
        DEFAULT_SUB_ID,
        amount
    );
}