// SPDX-License-Identifier: Apache-2.0
library;

pub enum Error {
    TimeDistributorAlreadyInitialized: (),
    TimeDistributorForbidden: (),

    TimeDistributorPendingDistribution: (),
    TimeDistributorInvalidLen: (),
}