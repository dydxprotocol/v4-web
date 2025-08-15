// SPDX-License-Identifier: Apache-2.0
library;

pub enum Error {
    MockVaultPriceFeedAlreadyInitialized: (),
    MockVaultPriceFeedForbidden: (),

    MockVaultPriceFeedInvalidAdjustmentBps: (),
    MockVaultPriceFeedInvalidSpreadBasisPoints: (),
    MockVaultPriceFeedInvalidPriceSampleSpace: (),

    MockVaultPriceFeedInvalidPrice: (),
    MockVaultPriceFeedInvalidPriceFeed: (),
    MockVaultPriceFeedInvalidPriceFeedToUpdate: (),

    MockVaultPriceFeedInvalidPriceIEq0: (),
    MockVaultPriceFeedInvalidPriceINeq0: (),

    MockVaultPriceFeedCouldNotFetchPrice: (),
}