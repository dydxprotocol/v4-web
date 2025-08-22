// SPDX-License-Identifier: Apache-2.0
library;

/*
 _____                     __           
|_   _| __ __ _ _ __  ___ / _| ___ _ __ 
  | || '__/ _` | '_ \/ __| |_ / _ \ '__|
  | || | | (_| | | | \__ \  _|  __/ |
  |_||_|  \__,_|_| |_|___/_|  \___|_|
*/ 
use std::{
    auth::msg_sender,
    asset::{
        transfer
    },
};
use std::hash::{Hash, Hasher};

pub fn transfer_assets(
    asset: AssetId,
    to: Identity,
    amount: u64,
) {
    transfer(
        to,
        asset,
        amount
    );
}