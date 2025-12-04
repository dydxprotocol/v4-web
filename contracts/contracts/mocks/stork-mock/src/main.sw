contract;

use stork_sway_sdk::interface::{Stork, TemporalNumericValueInput};
use stork_sway_sdk::temporal_numeric_value::TemporalNumericValue;
use stork_sway_sdk::events::StorkEvent;
use std::string::String;
use std::vm::evm::evm_address::EvmAddress;
use std::block::timestamp;
use std::u128::U128;
use signed_int::i128::I128;
pub const TAI64_TO_UNIX_OFFSET: u64 = 4611686018427387941; // TAI64 epoch offset to Unix epoch
storage {
    prices: StorageMap<b256, TemporalNumericValue> = StorageMap {},
}
abi StorkMock {
    #[storage(write)]
    fn update_price(id: b256, price_value: u256);
    #[storage(write)]
    fn update_negative_price(id: b256, price_value: u256);
}
impl StorkMock for Contract {
    #[storage(write)]
    fn update_price(id: b256, price_value: u256) {
        // 2 ** 64 = 18446744073709551616u256
        let price_value_lower: u64 = match <u64 as TryFrom<u256>>::try_from(price_value % 18446744073709551616u256) {
            Some(value) => value,
            None => panic "price_value_lower overflow",
        };
        // 2 ** 64 = 18446744073709551616u256
        let price_value_upper: u64 = match <u64 as TryFrom<u256>>::try_from(price_value / 18446744073709551616u256) {
            Some(value) => value,
            None => panic "price_value_upper overflow",
        };
        let price_value_u128 = U128::from((price_value_upper, price_value_lower));
        let price_value_i128 = match I128::try_from(price_value_u128) {
            Some(value) => value,
            None => panic "price_value_i128 overflow",
        };
        // magic constant: TAI64 to UTC, 10^9 for nanoseconds
        // the constant may slightly change in years
        let timestamp_ns = (timestamp() - TAI64_TO_UNIX_OFFSET) * 1000000000u64;
        let price = TemporalNumericValue {
            timestamp_ns: timestamp_ns,
            quantized_value: price_value_i128,
        };
        storage.prices.insert(id, price);
        let event = StorkEvent::ValueUpdate((id, price));
        log(event);
    }
    #[storage(write)]
    fn update_negative_price(id: b256, price_value: u256) {
        // 2 ** 64 = 18446744073709551616u256
        let price_value_lower: u64 = match <u64 as TryFrom<u256>>::try_from(price_value % 18446744073709551616u256) {
            Some(value) => value,
            None => panic "price_value_lower overflow",
        };
        // 2 ** 64 = 18446744073709551616u256
        let price_value_upper: u64 = match <u64 as TryFrom<u256>>::try_from(price_value / 18446744073709551616u256) {
            Some(value) => value,
            None => panic "price_value_upper overflow",
        };
        let price_value_u128 = U128::from((price_value_upper, price_value_lower));
        let price_value_i128 = match I128::neg_try_from(price_value_u128) {
            Some(value) => value,
            None => panic "price_value_i128 underflow",
        };
        // magic constant: TAI64 to UTC, 10^9 for nanoseconds
        // the constant may slightly change in years
        let timestamp_ns = (timestamp() - TAI64_TO_UNIX_OFFSET) * 1000000000u64;
        let price = TemporalNumericValue {
            timestamp_ns: timestamp_ns,
            quantized_value: price_value_i128,
        };
        storage.prices.insert(id, price);
        let event = StorkEvent::ValueUpdate((id, price));
        log(event);
    }
}
impl Stork for Contract {
    #[storage(read)]
    fn get_temporal_numeric_value_unchecked_v1(id: b256) -> TemporalNumericValue {
        match storage.prices.get(id).try_read() {
            Some(value) => value,
            None => panic "temporal numeric value not found",
        }
    }
    #[storage(read, write)]
    fn initialize(
        _initial_owner: Identity,
        _stork_public_key: EvmAddress,
        _single_update_fee_in_wei: u64,
    ) {
        panic "unimplemented";
    }
    #[storage(read)]
    fn single_update_fee_in_wei() -> u64 {
        panic "unimplemented";
    }
    #[storage(read)]
    fn stork_public_key() -> EvmAddress {
        panic "unimplemented";
    }
    fn verify_stork_signature_v1(
        _stork_pubkey: EvmAddress,
        _id: b256,
        _recv_time: u64,
        _quantized_value: I128,
        _publisher_merkle_root: b256,
        _value_compute_alg_hash: b256,
        _r: b256,
        _s: b256,
        _v: u8,
    ) -> bool {
        panic "unimplemented";
    }
    #[storage(read, write), payable]
    fn update_temporal_numeric_values_v1(_update_data: Vec<TemporalNumericValueInput>) {
        panic "unimplemented";
    }
    #[storage(read)]
    fn get_update_fee_v1(_update_data: Vec<TemporalNumericValueInput>) -> u64 {
        panic "unimplemented";
    }
    fn version() -> String {
        panic "unimplemented";
    }
    #[storage(read, write)]
    fn update_single_update_fee_in_wei(_single_update_fee_in_wei: u64) {
        panic "unimplemented";
    }
    #[storage(read, write)]
    fn update_stork_public_key(_stork_public_key: EvmAddress) {
        panic "unimplemented";
    }
    #[storage(read, write)]
    fn propose_owner(_new_owner: Address) {
        panic "unimplemented";
    }
    #[storage(read, write)]
    fn accept_ownership() {
        panic "unimplemented";
    }
}
