// SPDX-License-Identifier: Apache-2.0
library;

pub enum Error {
    RLPManagerAlreadyInitialized: (),
    RLPManagerForbidden: (),
    RLPManagerOnlyHandler: (),
    RLPManagerNonReentrant: (),

    RLPManagerHandlerZero: (),
    RLPManagerHasUpgraded: (),

    RLPManagerInvalidCooldownDuration: (),
    RLPManagerForbiddenInPrivateMode: (),

    RLPManagerInvalidWeight: (),

    RLPManagerInvalidRLPAssetForwarded: (),
    RLPManagerInvalidRLPAmountForwarded: (),

    RLPManagerInvalidAssetForwarded: (),
    RLPManagerInvalidAssetAmountForwarded: (),
    RLPManagerInsufficientRUSDOutput: (),
    RLPManagerInsufficientRLPOutput: (),

    RLPManagerCooldownDurationNotYetPassed: (),
    RLPManagerInsufficientOutput: (),

    RLPManagerInvalidSignature: ()
}
