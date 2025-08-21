// SPDX-License-Identifier: Apache-2.0
library;

pub struct SetGov {
    pub gov: Identity
}

pub struct SetRlpContract {
    pub rlp_contract: ContractId
}

pub struct SetRusdContract {
    pub rusd_contract: ContractId
}

pub struct SetShortsTracker {
    pub shorts_tracker: ContractId
}

pub struct SetVault {
    pub vault: ContractId
}

pub struct UpgradeAndWithdraw {
    pub asset: AssetId,
    pub new_rlp_contract_receiver: ContractId
}

pub struct SetCooldownDuration {
    pub cooldown_duration: u64
}

pub struct SetInPrivateMode {
    pub in_private_mode: bool
}

pub struct SetShortsTrackerAvgPriceWeight {
    pub shorts_tracker_avg_price_weight: u64
}

pub struct SetHandler {
    pub handler: Identity,
    pub is_active: bool
}

pub struct SetAumAdjustment {
    pub aum_addition: u256,
    pub aum_deduction: u256
}

pub struct WriteLastAddedAt {
    pub account: Identity,
    pub timestamp: u64
}

pub struct AddLiquidity {
    pub account: Identity,
    pub asset: AssetId,
    pub amount: u64,
    pub aum_in_rusd: u256,
    pub rlp_supply: u64,
    pub rusd_amount: u256,
    pub mint_amount: u256
}

pub struct RemoveLiquidity {
    pub account: Identity,
    pub asset: AssetId,
    pub rlp_amount: u64,
    pub aum_in_rusd: u256,
    pub rlp_supply: u64,
    pub rusd_amount: u256,
    pub amount_out: u256
}