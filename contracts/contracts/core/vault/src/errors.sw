// SPDX-License-Identifier: Apache-2.0
library;

pub enum Error {
    VaultAlreadyInitialized: (),
    VaultForbiddenNotGov: (),
    VaultInvalidMsgCaller: (),

    VaultSizeExceeded: (),
    VaultCollateralExceeded: (),

    VaultInsufficientCollateralForFees: (),

    VaultCollateralShouldBeWithdrawn: (),
    VaultSizeMustBeMoreThanCollateral: (),

    VaultCannotBeLiquidated: (),

    VaultAssetNotWhitelisted: (),
    VaultInvalidAssetAmount: (),
    VaultInvalidRedemptionAmount: (),

    VaultInvalidPosition: (),
    VaultInvalidAmountOut: (),
    VaultInvalidPositionSize: (),
    VaultInvalidLiquidator: (),

    VaultInvalidLiquidationFee: (),
    VaultInvalidFeeBasisPoints: (),

    VaultEmptyPosition: (),

    VaultShortIndexAssetMustNotBeStableAsset: (),

    VaultInvalidMintAmountGtU64Max: (),
    VaultInvalidRUSDBurnAmountGtU64Max: (),

    VaultInvalidMaxLeverage: (),
    
    VaultReceiverCannotBeZero: (),

    VaultInvalidRusdAmount: (),

    VaultInvalidAssetForwarded: (),

    VaultMaxLeverageExceeded: (),
    VaultPoolAmountExceeded: (),

    VaultInvalidIncrease: (),

    VaultAccountCannotBeZero: (),

    VaultInvalidAveragePrice: (),
    VaultLossesExceedCollateral: (),
}