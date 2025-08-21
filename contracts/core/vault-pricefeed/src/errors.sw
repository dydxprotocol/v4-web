// SPDX-License-Identifier: Apache-2.0
library;

pub enum Error {
    VaultPriceFeedAlreadyInitialized: (),
    VaultPriceFeedForbidden: (),

    VaultPriceFeedInvalidPrice: (),
    VaultPriceFeedInvalidPriceFeed: (),
    VaultPriceFeedInvalidPriceFeedToUpdate: (),

    VaultPriceFeedPriceIsAhead: (),
    VaultPriceFeedPriceIsStale: (),

    VaultPriceFeedCouldNotFetchPrice: (),

    VaultPriceFeedInvalidSignature: (),
    VaultPriceFeedSignatureAlreadyUsed: (),
    VaultPriceFeedInvalidMessageTimestamp: (),
}