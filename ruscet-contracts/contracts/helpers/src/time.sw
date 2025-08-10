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

/// Converting a tai64 timestamp to a Unix-based timestamp
///     >> tai64_timestamp - 2**62 - 10
/// 2**62 - 10 = 4611686018427387894
/// From: https://forum.fuel.network/t/how-do-i-convert-a-tai64-timestamp/1853
pub fn get_unix_timestamp() -> u64 {
    // do NOT hard-code the value of `2**62 - 10 = 4611686018427387894` here
    // for some very weird reason, the result changes w/ a delta of 20 
    // everything else being the same
    return tai64_timestamp() - 2.pow(62) - 10;
}