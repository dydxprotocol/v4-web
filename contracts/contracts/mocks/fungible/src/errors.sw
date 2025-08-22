// SPDX-License-Identifier: Apache-2.0
library;

pub enum Error {
    FungibleAlreadyInitialized: (),
    FungibleNameAlreadySet: (),
    FungibleSymbolAlreadySet: (),
    FungibleDecimalsAlreadySet: (),

    FungibleBurnInsufficientAssetForwarded: (),
    FungibleBurnInsufficientAmountForwarded: (),

    FungibleInsufficientAssetForwarded: (),
    FungibleInsufficientAmountForwarded: (),
}
