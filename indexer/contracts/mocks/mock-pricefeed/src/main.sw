// SPDX-License-Identifier: Apache-2.0
contract;

/*
 __  __            _      ____       _           __               _ 
|  \/  | ___   ___| | __ |  _ \ _ __(_) ___ ___ / _| ___  ___  __| |
| |\/| |/ _ \ / __| |/ / | |_) | '__| |/ __/ _ \ |_ / _ \/ _ \/ _` |
| |  | | (_) | (__|   <  |  __/| |  | | (_|  __/  _|  __/  __/ (_| |
|_|  |_|\___/ \___|_|\_\ |_|   |_|  |_|\___\___|_|  \___|\___|\__,_|
*/

mod errors;

use std::{
    context::*,
    revert::require,
    storage::storage_string::*,
    string::String
};
use std::hash::*;
use helpers::{
    utils::*, 
    zero::*
};
use mock_interfaces::mock_pricefeed::MockPricefeed;
use errors::*;

storage {
    gov: Identity = ZERO_IDENTITY,
    is_initialized: bool = false,
    answer: u256 = 0,
    decimals: u8 = 9,
    round_id: u64 = 0,
    description: StorageString = StorageString {},
    answers: StorageMap<u64, u256> = StorageMap {}
}

impl MockPricefeed for Contract {
    #[storage(read, write)]
    fn initialize(
        gov: Identity,
        description: String
    ) {
        require(
            !storage.is_initialized.read(),
            Error::PriceFeedAlreadyInitialized
        );
        require(!gov.is_zero(), Error::PricefeedGovZero);

        storage.is_initialized.write(true);
        storage.gov.write(gov);
        storage.description.write_slice(description);
    }

    #[storage(read)]
    fn gov() -> Identity {
        storage.gov.read()
    }

    #[storage(read)]
    fn latest_answer() -> u256 {
        storage.answer.read()
    }

    #[storage(read)]
    fn latest_round() -> u64 {
        storage.round_id.read()
    }

    #[storage(read)]
    fn get_latest_round() -> (u64, u256, u8) {
        (
            storage.round_id.read(),
            storage.answer.read(),
            storage.decimals.read()
        )
    }

    #[storage(read, write)]
    fn set_latest_answer(new_answer: u256) {
        let round_id = storage.round_id.read();

        storage.round_id.write(round_id + 1);
        storage.answer.write(new_answer);
        storage.answers.insert(round_id + 1, new_answer);
    }

    #[storage(read)]
    fn get_round_data(round_id: u64) -> (u64, u256, u8) {
        require(
            round_id < storage.round_id.read(),
            Error::PricefeedRoundNotComplete
        );

        let answer = storage.answers.get(round_id).read();
        (
            round_id,
            answer,
            storage.decimals.read()
        )
    }
}