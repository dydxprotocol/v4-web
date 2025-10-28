contract;

use signed_int::i128::I128;
use stork_sway_sdk::interface::Stork;
use std::u128::U128;
use std::block::timestamp;
use core_interfaces::pricefeed_wrapper::{Error, PricefeedWrapper};
pub const MAX_PRICE_STALENESS: u64 = 120_000_000_000; // 120 seconds in nanoseconds
configurable {
    STORK_CONTRACT: ContractId = ContractId::zero(),
}
impl PricefeedWrapper for Contract {
    fn price(feedId: b256) -> u256 {
        let stork = abi(Stork, STORK_CONTRACT.bits());
        let price = stork.get_temporal_numeric_value_unchecked_v1(feedId);
        require(
            // magic constant: TAI64 to UTC, 10^9 for nanoseconds
            // the constant may slightly change in years
            price.timestamp_ns + MAX_PRICE_STALENESS >= (timestamp() - 4611686018427387941u64) * 1000000000u64,
            Error::PricefeedWrapperStaledPrice,
        );
        // the code below calculates
        // price_value = abs(price.quantized_value)
        // we support negative prices this way, because negative prices simply denote a reversed direction
        // still tradable
        let price_indent = I128::indent();
        let price_underlying = price.quantized_value.underlying();
        let price_value: U128 = if price_underlying >= price_indent {
            price_underlying - price_indent
        } else {
            price_indent - price_underlying
        };
        price_value.as_u256()
    }
}
