// SPDX-License-Identifier: Apache-2.0
library;

use std::block::{
    timestamp as tai64_timestamp
};
/*
 _____ _                
|_   _(_)_ __ ___   ___ 
  | | | | '_ ` _ \ / _ \
  | | | | | | | | |  __/
  |_| |_|_| |_| |_|\___|
*/

const TAI64_BIAS: u64 = 1u64 << 62;
const TAI_UNIX_DELTA: u64 = 10;

/// Converting a tai64 timestamp to a Unix-based timestamp
///     >> tai64_timestamp - 2**62 - 10
/// 2**62 - 10 = 4611686018427387894
/// From: https://forum.fuel.network/t/how-do-i-convert-a-tai64-timestamp/1853
pub fn get_unix_timestamp() -> u64 {
    // do NOT hard-code the value of `2**62 - 10 = 4611686018427387894` here
    // for some very weird reason, the result changes w/ a delta of 20 
    // everything else being the same
    tai64_timestamp() - TAI64_BIAS - TAI_UNIX_DELTA
}