// SPDX-License-Identifier: Apache-2.0
library;

pub const ZERO = 0x0000000000000000000000000000000000000000000000000000000000000000;
pub const ZERO_ADDRESS = Address::from(ZERO);
pub const ZERO_CONTRACT = ContractId::from(ZERO);
pub const ZERO_ASSET = AssetId::from(ZERO);
pub const ZERO_IDENTITY = Identity::Address(ZERO_ADDRESS);

impl Identity {
    pub fn is_zero(self) -> bool {
        self.bits() == ZERO
    }
}
