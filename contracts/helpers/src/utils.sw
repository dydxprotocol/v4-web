// SPDX-License-Identifier: Apache-2.0
library;

use std::auth::msg_sender;
use ::zero::*;

/*
  ____                _              _       
 / ___|___  _ __  ___| |_ __ _ _ __ | |_ ___ 
| |   / _ \| '_ \/ __| __/ _` | '_ \| __/ __|
| |__| (_) | | | \__ \ || (_| | | | | |_\__ \
 \____\___/|_| |_|___/\__\__,_|_| |_|\__|___/
*/
// enum Error {
//     ExpectedCallerToBeEOA: (),
//     ExpectedCallerToBeContract: (),
// }

pub fn get_sender() -> Identity {
    msg_sender().unwrap()
}

pub fn get_address_or_revert() -> Address {
    get_sender_non_contract()
}

pub fn get_contract_or_revert() -> ContractId {
    get_sender_contract()
}

// Force require the msg.sender to be from an EOA (not an external contract)
pub fn get_sender_non_contract() -> Address {
    let addr = match msg_sender().unwrap() {
        Identity::Address(addr) => addr,
        _ => revert(0), // ZERO_ADDRESS
    };

    return addr;
}

// Force require the msg.sender to be from an external contract
pub fn get_sender_contract() -> ContractId {
    let contr = match msg_sender().unwrap() {
        Identity::ContractId(_contr) => _contr,
        _ => revert(0), // ZERO_CONTRACT
    };

    return contr;
}
