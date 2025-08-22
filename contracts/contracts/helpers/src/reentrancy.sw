// SPDX-License-Identifier: Apache-2.0
library;

/*
    This library checks for and disallows reentrancy on a contract
    This is different from the reentrancy guard in sway-libs
    because it also disallows reentrancy from BOTH cross-contract calls
    More reading: https://docs.fuel.network/docs/sway-libs/reentrancy/#reentrancy-guard-library
*/

enum ReentrancyError {
    ReentrantCall: ()
}

#[storage(read, write)]
pub fn _begin_non_reentrant(lock_storage_key: StorageKey<bool>) {
    require(
        !lock_storage_key.read(),
        ReentrancyError::ReentrantCall
    );
    lock_storage_key.write(true);
}

#[storage(write)]
pub fn _end_non_reentrant(lock_storage_key: StorageKey<bool>) {
    lock_storage_key.write(false);
}
