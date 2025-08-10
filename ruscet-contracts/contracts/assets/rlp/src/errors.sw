// SPDX-License-Identifier: Apache-2.0
library;

pub enum Error {
    RLPAlreadyInitialized: (),
    RLPForbidden: (),
    RLPOnlyMinter: (),

    RLPMintToZeroAccount: (),
    RLPBurnFromZeroAccount: (),
    RLPMintZeroAmount: (),

    RLPInvalidBurnAssetForwarded: (),
    RLPInvalidBurnAmountForwarded: (),

    RLPInsufficientAllowance: (),
    RLPBurnAmountExceedsBalance: (),
}