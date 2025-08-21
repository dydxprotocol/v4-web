// SPDX-License-Identifier: Apache-2.0
library;

use std::{
    storage::storage_string::*,
    string::String
};

abi MockPricefeed {
    #[storage(read, write)]
    fn initialize(
        gov: Identity, 
        description: String
    );
    
    #[storage(read)]
    fn gov() -> Identity;

    #[storage(read)]
    fn latest_answer() -> u256;

    #[storage(read)]
    fn latest_round() -> u64;

    #[storage(read)]
    fn get_latest_round() -> (u64, u256, u8);

    #[storage(read, write)]
    fn set_latest_answer(new_answer: u256);

    #[storage(read)]
    fn get_round_data(round_id: u64) -> (u64, u256, u8);
}