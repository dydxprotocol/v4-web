// SPDX-License-Identifier: Apache-2.0
contract;

mod errors;

use std::{
    asset::*,
    context::*,
    call_frames::{msg_asset_id},
    context::{this_balance, balance_of},
    hash::{
        Hash,
        sha256,
    }, 
    revert::require,
    storage::storage_string::*,
    string::String,
};
use src20::SRC20;
use src3::SRC3;
use fungible_abi::*;
use errors::*;

const SUB_ID = SubId::zero();

storage {
    initialized: bool = false,
    name: StorageString = StorageString {},
    symbol: StorageString = StorageString {},
    decimals: u8 = 9,
    /// The total number of coins minted.
    total_supply: u64 = 0
}

impl FungibleAsset for Contract {
    #[storage(read, write)]
    fn initialize(
        name: String,
        symbol: String,
        decimals: u8
    ) {
        require(
            !storage.initialized.read(),
            Error::FungibleAlreadyInitialized
        );
        storage.initialized.write(true);
        
        storage.name.write_slice(name);
        storage.symbol.write_slice(symbol);
        storage.decimals.write(decimals);
    }
    /*
           ____  ____  ____   ____ ____   ___  
          / / / / ___||  _ \ / ___|___ \ / _ \ 
         / / /  \___ \| |_) | |     __) | | | |
        / / /    ___) |  _ <| |___ / __/| |_| |
       /_/_/    |____/|_| \_\\____|_____|\___/                                         
    */
    #[storage(read)]
    fn name() -> String {
        storage.name.read_slice().unwrap()
    }

    #[storage(read)]
    fn symbol() -> String {
        storage.symbol.read_slice().unwrap()
    }

    #[storage(read)]
    fn decimals() -> u8 {
        storage.decimals.read()
    }

    #[storage(read)]
    fn total_supply() -> u64 {
        storage.total_supply.read()
    }

    /*
           ____  ____  ____   ____ _____ 
          / / / / ___||  _ \ / ___|___ / 
         / / /  \___ \| |_) | |     |_ \ 
        / / /    ___) |  _ <| |___ ___) |
       /_/_/    |____/|_| \_\\____|____/   
    */
    #[storage(read, write)]
    fn mint(recipient: Identity, amount: u64) {
        let supply = storage.total_supply.read();

        storage.total_supply.write(supply + amount);

        // The `asset_id` constructed within the `mint_to` method is a sha256 hash of
        // the `contract_id` and the `SUB_ID` (the same as the `asset_id` constructed here).
        mint_to(recipient, SUB_ID, amount);
    }

    #[payable]
    #[storage(read, write)]
    fn burn(amount: u64) {
        let asset_id = AssetId::default();

        require(
            msg_asset_id() == asset_id,
            Error::FungibleBurnInsufficientAssetForwarded,
        );
        require(
            msg_amount() == amount,
            Error::FungibleBurnInsufficientAmountForwarded,
        );

        // If we pass the check above, we can assume it is safe to unwrap.
        storage.total_supply.write(storage.total_supply.read() - amount);

        burn(SUB_ID, amount);
    }

    /*
           ____  __  __ _          
          / / / |  \/  (_)___  ___ 
         / / /  | |\/| | / __|/ __|
        / / /   | |  | | \__ \ (__ 
       /_/_/    |_|  |_|_|___/\___|
    */
    fn get_asset_id() -> AssetId {
        // AssetId::new(ContractId::this(), SUB_ID)
        AssetId::default()
    }
}