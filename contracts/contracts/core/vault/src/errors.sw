// SPDX-License-Identifier: Apache-2.0
library;

pub enum Error {
    VaultAlreadyInitialized: (),
    // VaultInvalidRUSDAsset: (), // UNUSED
    VaultForbiddenNotGov: (),
    // VaultForbiddenNotManager: (), // UNUSED
    VaultInvalidMsgCaller: (),

    VaultSizeExceeded: (),
    VaultCollateralExceeded: (),

    VaultInsufficientCollateralForFees: (),

    // VaultPoolAmountLtBuffer: (), // UNUSED
    VaultCollateralShouldBeWithdrawn: (),
    VaultSizeMustBeMoreThanCollateral: (),

    VaultCannotBeLiquidated: (),

    // VaultInvalidFundingRateFactor: (), // UNUSED
    // VaultInvalidStableFundingRateFactor: (), // UNUSED

    VaultAssetNotWhitelisted: (),
    // VaultAssetIsNotStableAsset: (), // UNUSED
    VaultInvalidAssetAmount: (),
    VaultInvalidRedemptionAmount: (),

    VaultInvalidPosition: (),
    // VaultInvalidAmountIn: (), // UNUSED
    VaultInvalidAmountOut: (),
    VaultInvalidPositionSize: (),
    VaultInvalidLiquidator: (),

    VaultInvalidLiquidationFee: (),
    VaultInvalidFeeBasisPoints: (),

    VaultEmptyPosition: (),

    // VaultAssetInNotWhitelisted: (), // UNUSED
    // VaultAssetOutNotWhitelisted: (), // UNUSED
    // VaultAssetsAreEqual: (), // UNUSED
    
    // VaultLongCollateralIndexAssetsMismatch: (), // UNUSED
    // VaultLongCollateralAssetMustNotBeStableAsset: (), // UNUSED

    // VaultShortCollateralAssetMustBeStableAsset: (), // UNUSED
    VaultShortIndexAssetMustNotBeStableAsset: (),
    // VaultShortIndexAssetNotShortable: (), // UNUSED

    VaultInvalidMintAmountGtU64Max: (),
    VaultInvalidRUSDBurnAmountGtU64Max: (),

    // VaultDecimalsAreZero: (), // UNUSED
    // VaultPriceQueriedIsZero: (), // UNUSED
    VaultInvalidMaxLeverage: (),
    
    VaultReceiverCannotBeZero: (),

    VaultInvalidRusdAmount: (),

    VaultInvalidAssetForwarded: (),

    // VaultMaxRusdExceeded: (), // UNUSED
    // VaultMaxShortsExceeded: (), // UNUSED
    VaultMaxLeverageExceeded: (),
    VaultPoolAmountExceeded: (),

    VaultInvalidIncrease: (),

    VaultAccountCannotBeZero: (),
    // VaultCollateralAssetNotWhitelisted: (), // UNUSED

    VaultInvalidAveragePrice: (),
    VaultLossesExceedCollateral: (),
    // VaultFeesExceedCollateral: (), // UNUSED
    // VaultLiquidationFeesExceedCollateral: (), // UNUSED
}