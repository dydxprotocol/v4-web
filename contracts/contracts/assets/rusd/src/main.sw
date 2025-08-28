// SPDX-License-Identifier: Apache-2.0
contract;

/*
 ____  _   _ ____  ____           __   ___      _     _      _                 _   
|  _ \| | | / ___||  _ \          \ \ / (_) ___| | __| |    / \   ___ ___  ___| |_ 
| |_) | | | \___ \| | | |  _____   \ V /| |/ _ \ |/ _` |   / _ \ / __/ __|/ _ \ __|
|  _ <| |_| |___) | |_| | |_____|   | | | |  __/ | (_| |  / ___ \\__ \__ \  __/ |_ 
|_| \_\\___/|____/|____/            |_| |_|\___|_|\__,_| /_/   \_\___/___/\___|\__|
                                                                                   
    RUSD "inherits" YieldAsset in its most basic form, with additional methods
*/

mod errors;
mod events;

use std::{
    asset::*,
    context::*,
    revert::require,
    storage::{
        storage_string::*,
        storage_vec::*,
    },
    call_frames::msg_asset_id,
    string::String,
    b512::B512,
	ecr::ec_recover_address,
};
use std::hash::*;
use helpers::{
    utils::*, 
    transfer::*,
    zero::*,
};
use src20::SRC20;
use src3::SRC3;
use asset::{
    base::{
        _total_supply as sl_total_supply,
    },
    supply::{
        _burn as sl_burn,
        _mint as sl_mint,
    },
};
use asset_interfaces::{
    rusd::RUSD,
    yield_asset::YieldAsset,
    yield_tracker::YieldTracker
};
use errors::*;
use events::*;

const DECIMALS: u8 = 9;
const DEFAULT_SUB_ID: SubId = SubId::zero();

storage {
    /*
       __   ___      _     _      _                 _   
       \ \ / (_) ___| | __| |    / \   ___ ___  ___| |_ 
        \ V /| |/ _ \ |/ _` |   / _ \ / __/ __|/ _ \ __|
         | | | |  __/ | (_| |  / ___ \\__ \__ \  __/ |_ 
         |_| |_|\___|_|\__,_| /_/   \_\___/___/\___|\__|   
    */
    gov: Identity = ZERO_IDENTITY,
    staked_balance_handler: Address = ZERO_ADDRESS,
    is_initialized: bool = false,
    
    name: StorageString = StorageString {},
    symbol: StorageString = StorageString {},
    /// total supply of RUSD
    /// only really 1 SubId is utilized for RUSD minting
    total_supply: StorageMap<AssetId, u64> = StorageMap {},
    /// value for this is ALWAYS 1
    total_assets: u64 = 0,

    vaults: StorageMap<ContractId, bool> = StorageMap {},
    yield_trackers: StorageVec<ContractId> = StorageVec::<ContractId> {},
    non_staking_accounts: StorageMap<Identity, bool> = StorageMap {},
    non_staking_supply: u64 = 0,
    admins: StorageMap<Identity, bool> = StorageMap {},

    in_whitelist_mode: bool = false,
    user_staked_balance: StorageMap<Identity, u64> = StorageMap {},
}

struct Message {
	account: Identity,
	balance: u64,
}

impl Hash for Message {
    fn hash(self, ref mut state: Hasher) {
        self.account.hash(state);
        self.balance.hash(state);
    }
}

impl RUSD for Contract {
    #[storage(read, write)]
    fn initialize(
        vault: ContractId,
        staked_balance_handler: Address
    ) {
        require(
            !storage.is_initialized.read(), 
            Error::RUSDAlreadyInitialized
        );
        storage.is_initialized.write(true);

        storage.name.write_slice(String::from_ascii_str("RUSD"));
        storage.symbol.write_slice(String::from_ascii_str("RUSD"));

        let sender = get_sender();
        log(SetNameEvent { 
            asset: _get_id(),
            name: storage.name.read_slice(),
            sender
        });
        log(SetSymbolEvent { 
            asset: _get_id(),
            symbol: storage.symbol.read_slice(),
            sender
        });
        log(SetDecimalsEvent { 
            asset: _get_id(),
            decimals: DECIMALS,
            sender
        });
        
        let sender = get_sender();
        _set_gov(sender);
        _set_admin(sender, true);
        _set_vault(vault, true);
        _set_staked_balance_handler(staked_balance_handler);
    }

    /*
          ____     _       _           _       
         / / /    / \   __| |_ __ ___ (_)_ __  
        / / /    / _ \ / _` | '_ ` _ \| | '_ \ 
       / / /    / ___ \ (_| | | | | | | | | | |
      /_/_/    /_/   \_\__,_|_| |_| |_|_|_| |_|                         
    */
    #[storage(read, write)]
    fn set_vault(
        vault: ContractId,
        active: bool
    ) {
        _only_gov();
        _set_vault(vault, active);
    }

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    /// Returns the total supply of the RUSD asset
    #[storage(read)]
    fn total_rusd_supply() -> u64 {
        storage.total_supply.get(_get_id()).try_read().unwrap_or(0)
    }
}

impl YieldAsset for Contract {
    /*
          ____     _       _           _       
         / / /    / \   __| |_ __ ___ (_)_ __  
        / / /    / _ \ / _` | '_ ` _ \| | '_ \ 
       / / /    / ___ \ (_| | | | | | | | | | |
      /_/_/    /_/   \_\__,_|_| |_| |_|_|_| |_|                         
    */
    #[storage(read, write)]
    fn set_gov(gov: Identity) {
        _only_gov();
        _set_gov(gov);
    }

    /// handler responsible for updating the user's staked balance
    /// different from `gov` because this is a hot wallet solely for the purposes of signing staked balance updates
    /// if this handler is compromised, it would lead to incorrect rewards calculations which over time could
    /// add up, but are insignificant in the short term
    /// rather than having `gov` to be a hot wallet to sign messages on the go which increases the potential attack surface
    #[storage(read, write)]
    fn set_staked_balance_handler(staked_balance_handler: Address) {
        _only_gov();
        _set_staked_balance_handler(staked_balance_handler);
    }

    #[storage(read, write)]
    fn set_yield_trackers(yield_trackers: Vec<ContractId>) {
        _only_gov();

        storage.yield_trackers.store_vec(yield_trackers);
        log(SetYieldTrackers { yield_trackers });
    }

    #[storage(read, write)]
    fn set_admin(account: Identity, active: bool) {
        _only_gov();
        _set_admin(account, active);
    }

    #[storage(read, write)]
    fn add_nonstaking_account(account: Identity) {
        _only_admin();
        require(
            !storage.non_staking_accounts.get(account).try_read().unwrap_or(false),
            Error::RUSDAccountNotMarked
        );

        _update_rewards(account);
        storage.non_staking_accounts.insert(account, true);
        log(SetNonStakingAccount { account, active: true });
    }

    #[storage(read, write)]
    fn remove_nonstaking_account(account: Identity) {
        _only_admin();
        require(
            storage.non_staking_accounts.get(account).try_read().unwrap_or(false),
            Error::RUSDAccountNotMarked
        );

        _update_rewards(account);

        storage.non_staking_accounts.remove(account);
        log(SetNonStakingAccount { account, active: false });
    }

    #[storage(read)]
    fn recover_claim(
        account: Identity,
        receiver: Identity
    ) {
        _only_admin();
        let mut i = 0;
        let len = storage.yield_trackers.len();

        let staked_balance = _get_user_staked_balance(account);

        while i < len {
            let yield_tracker = storage.yield_trackers.get(i).unwrap().read();
            abi(YieldTracker, yield_tracker.into()).claim(account, receiver, staked_balance);
            i += 1;
        }
    }

    #[storage(read)]
    fn claim(receiver: Identity) {
        _only_admin();
        let mut i = 0;
        let len = storage.yield_trackers.len();

        let staked_balance = _get_user_staked_balance(get_sender());

        while i < len {
            let yield_tracker = storage.yield_trackers.get(i).unwrap().read();
            abi(YieldTracker, yield_tracker.into()).claim(get_sender(), receiver, staked_balance);
            i += 1;
        }
    }

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    /// Returns the AssetId of the `YieldAsset` asset
    fn get_id() -> AssetId {
        _get_id()
    }

    #[storage(read)]
    fn total_staked() -> u64 {
        // the total staked is the total supply of RUSD
        // intentionally doesn't include any non-staking supply
        storage.total_supply.get(_get_id()).try_read().unwrap_or(0)
    }

    /*
          ____  ____        _     _ _
         / / / |  _ \ _   _| |__ | (_) ___ 
        / / /  | |_) | | | | '_ \| | |/ __|
       / / /   |  __/| |_| | |_) | | | (__ 
      /_/_/    |_|    \__,_|_.__/|_|_|\___|
    */
    #[storage(read, write)]
    fn set_user_staked_balance(
        account: Identity,
        amount: u64,
        signature: B512
    ) {
        _verify_signature(account, amount, signature);

        storage.user_staked_balance.insert(account, amount);
    }
}

// https://docs.fuel.network/docs/sway-standards/src-20-native-asset/
impl SRC20 for Contract {
    #[storage(read)]
    fn name(_asset: AssetId) -> Option<String> {
        Some(storage.name.read_slice().unwrap())
    }

    #[storage(read)]
    fn symbol(_asset: AssetId) -> Option<String> {
        Some(storage.symbol.read_slice().unwrap())
    }

    #[storage(read)]
    fn decimals(_asset: AssetId) -> Option<u8> {
        Some(DECIMALS)
    }

    #[storage(read)]
    fn total_supply(asset: AssetId) -> Option<u64> {
        sl_total_supply(storage.total_supply, asset)
    }

    /// @dev only 1 DEFAULT_SUB_ID is utilized for RLP minting
    #[storage(read)]
    fn total_assets() -> u64 {
        storage.total_assets.read()
    }
}

// https://docs.fuel.network/docs/sway-standards/src-3-minting-and-burning/
impl SRC3 for Contract {
    #[storage(read, write)]
    fn mint(
        recipient: Identity,
        _sub_id: Option<SubId>,
        amount: u64
    ) {
        _only_authorized_vaults();
        _mint(recipient, amount)
    }

    #[payable]
    #[storage(read, write)]
    fn burn(
        _sub_id: SubId,
        amount: u64
    ) {
        _only_authorized_vaults();
        _burn(amount)
    }
}

/*
    ____  ___       _                        _ 
   / / / |_ _|_ __ | |_ ___ _ __ _ __   __ _| |
  / / /   | || '_ \| __/ _ \ '__| '_ \ / _` | |
 / / /    | || | | | ||  __/ |  | | | | (_| | |
/_/_/    |___|_| |_|\__\___|_|  |_| |_|\__,_|_|
*/
#[storage(read)]
fn _only_gov() {
    require(
        get_sender() == storage.gov.read(),
        Error::RUSDForbidden
    );
}

#[storage(read)]
fn _only_admin() {
    require(
        storage.admins.get(get_sender()).try_read().unwrap_or(false),
        Error::RUSDForbidden
    );
}

#[storage(read)]
fn _only_authorized_vaults() {
    require(
        storage.vaults.get(get_contract_or_revert()).try_read().unwrap_or(false),
        Error::RUSDForbidden
    );
}

#[storage(read, write)]
fn _set_admin(account: Identity, active: bool) {
    if(active) {
        storage.admins.insert(account, true);
    } else {
        storage.admins.remove(account);
    }
    log(SetAdmin { account, active });
}

#[storage(read, write)]
fn _set_vault(vault: ContractId, active: bool) {
    _only_gov();
    
    if(active) {
        storage.vaults.insert(vault, true);
    } else {
        storage.vaults.remove(vault);
    }
    log(SetVault { vault, active });
}

#[storage(read, write)]
fn _set_gov(gov: Identity) {
    storage.gov.write(gov);
    log(SetGov { gov: gov });
}

#[storage(read, write)]
fn _set_staked_balance_handler(staked_balance_handler: Address) {
    storage.staked_balance_handler.write(staked_balance_handler);
    log(SetStakedBalanceHandler { staked_balance_handler });
}

fn _get_id() -> AssetId {
    // AssetId::new(ContractId::this(), DEFAULT_SUB_ID)
    AssetId::default()
}

#[storage(read)]
fn _verify_signature(
    account: Identity,
    amount: u64,
    signature: B512
) {
    let msg_hash = sha256(Message { account, balance: amount });
    let recovered_address: b256 = ec_recover_address(signature, msg_hash).unwrap().bits();

    require(
        recovered_address == storage.staked_balance_handler.read().bits(),
        Error::RUSDInvalidSignature
    );
}

#[storage(read)]
fn _get_user_staked_balance(account: Identity) -> u256 {
    storage.user_staked_balance.get(account).try_read().unwrap_or(0).as_u256()
}

#[storage(read)]
fn _update_rewards(account: Identity) {
    let mut i = 0;
    let len = storage.yield_trackers.len();

    let staked_balance = _get_user_staked_balance(account);

    while i < len {
        let yield_tracker = storage.yield_trackers.get(i).unwrap().read();
        abi(YieldTracker, yield_tracker.into()).update_rewards(account, staked_balance);
        i += 1;
    }
}

#[storage(read, write)]
fn _mint(
    recipient: Identity,
    amount: u64
) {
    require(
        amount > 0,
        Error::RUSDMintZeroAmount
    );
    // require(recipient != ZERO_IDENTITY, Error::RUSDMintToZeroAccount);

    let _ = sl_mint(
        storage.total_assets,
        storage.total_supply,
        recipient,
        DEFAULT_SUB_ID,
        amount,
    );
}

#[storage(read, write)]
fn _burn(amount: u64) {
    require(
        msg_asset_id() == _get_id(),
        Error::RUSDInvalidBurnAssetForwarded
    );
    require(
        msg_amount() == amount,
        Error::RUSDInvalidBurnAmountForwarded
    );

    sl_burn(
        storage.total_supply,
        DEFAULT_SUB_ID,
        amount
    );
}