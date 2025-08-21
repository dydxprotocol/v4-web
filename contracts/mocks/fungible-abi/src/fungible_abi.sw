// SPDX-License-Identifier: Apache-2.0
library;

use std::{
    hash::{
        Hash,
        sha256,
    },
    revert::require,
    storage::storage_string::*,
    string::String,
};

abi FungibleAsset {
    #[storage(read, write)]
    fn initialize(
        name: String,
        symbol: String,
        decimals: u8
    );

    /*
           ____  ____  ____   ____ ____   ___  
          / / / / ___||  _ \ / ___|___ \ / _ \ 
         / / /  \___ \| |_) | |     __) | | | |
        / / /    ___) |  _ <| |___ / __/| |_| |
       /_/_/    |____/|_| \_\\____|_____|\___/                                         
       from: https://github.com/FuelLabs/sway-standards/tree/master/standards/src20-native-asset  
    */
    #[storage(read)]
    fn name() -> String;

    #[storage(read)]
    fn symbol() -> String;
    
    #[storage(read)]
    fn decimals() -> u8;

    #[storage(read)]
    fn total_supply() -> u64;

    /*
           ____  ____  ____   ____ _____ 
          / / / / ___||  _ \ / ___|___ / 
         / / /  \___ \| |_) | |     |_ \ 
        / / /    ___) |  _ <| |___ ___) |
       /_/_/    |____/|_| \_\\____|____/   
       from: https://github.com/FuelLabs/sway-standards/blob/master/standards/src3-mint-burn 
    */
    #[storage(read, write)]
    fn mint(recipient: Identity, amount: u64);

    #[payable]
    #[storage(read, write)]
    fn burn(amount: u64);

    /*
           ____  __  __ _          
          / / / |  \/  (_)___  ___ 
         / / /  | |\/| | / __|/ __|
        / / /   | |  | | \__ \ (__ 
       /_/_/    |_|  |_|_|___/\___|
    */
    fn get_asset_id() -> AssetId;
}
