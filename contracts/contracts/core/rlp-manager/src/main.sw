contract;

/*
 ____  _     ____    __  __                                   
|  _ \| |   |  _ \  |  \/  | __ _ _ __   __ _  __ _  ___ _ __ 
| |_) | |   | |_) | | |\/| |/ _` | '_ \ / _` |/ _` |/ _ \ '__|
|  _ <| |___|  __/  | |  | | (_| | | | | (_| | (_| |  __/ |   
|_| \_\_____|_|     |_|  |_|\__,_|_| |_|\__,_|\__, |\___|_|   
                                              |___/
*/

mod events;
mod errors;
mod constants;

use std::{
    call_frames::msg_asset_id,
    context::*,
    revert::require,
    primitive_conversions::u64::*,
    math::*,
};
use std::hash::*;
use core_interfaces::{
    rlp_manager::RLPManager,
    shorts_tracker::ShortsTracker,
    vault::Vault,
};
use asset_interfaces::{
    rlp::RLP,
    yield_asset::YieldAsset,
    rusd::RUSD
};
use src3::SRC3;
use helpers::{
    time::get_unix_timestamp,
    utils::*,
    transfer::transfer_assets,
    zero::*,
    reentrancy::*,
};
use events::*;
use errors::*;
use constants::*;

const REVISION: u8 = 1u8;
const DEFAULT_SUB_ID: SubId = SubId::zero();

storage { 
    // gov is not restricted to an `Address` (EOA) or a `Contract` (external)
    // because this can be either a regular EOA (Address) or a Multisig (Contract)
    gov: Identity = ZERO_IDENTITY,
    lock: bool = false,

    is_initialized: bool = false,
    in_private_mode: bool = false,
    
    rlp_contract: ContractId = ZERO_CONTRACT,
    vault: ContractId = ZERO_CONTRACT,
    shorts_tracker: ContractId = ZERO_CONTRACT,
    rusd_contract: ContractId = ZERO_CONTRACT,

    cooldown_duration: u64 = 0,
    last_added_at: StorageMap<Identity, u64> = StorageMap {},

    aum_addition: u256 = 0,
    aum_deduction: u256 = 0,

    shorts_tracker_avg_price_weight: u256 = 0,

    is_handler: StorageMap<Identity, bool> = StorageMap {},
}

impl RLPManager for Contract {
    fn get_revision() -> u8 {
        REVISION
    }

    #[storage(read, write)]
    fn initialize(
        vault: ContractId,
        rusd_contract: ContractId,
        rlp_contract: ContractId,
        shorts_tracker: ContractId,
        cooldown_duration: u64
    ) {
        require(!storage.is_initialized.read(), Error::RLPManagerAlreadyInitialized);
        storage.is_initialized.write(true);

        let gov = get_sender();
        storage.gov.write(gov);
        storage.rlp_contract.write(rlp_contract);
        storage.shorts_tracker.write(shorts_tracker);
        storage.vault.write(vault);
        storage.rusd_contract.write(rusd_contract);
        storage.cooldown_duration.write(cooldown_duration);

        log(SetGov { gov });
        log(SetRlpContract { rlp_contract });
        log(SetShortsTracker { shorts_tracker });
        log(SetVault { vault });
        log(SetRusdContract { rusd_contract });
        log(SetCooldownDuration { cooldown_duration });
    }

    /*
          ____     _       _           _       
         / / /    / \   __| |_ __ ___ (_)_ __  
        / / /    / _ \ / _` | '_ ` _ \| | '_ \ 
       / / /    / ___ \ (_| | | | | | | | | | |
      /_/_/    /_/   \_\__,_|_| |_| |_|_|_| |_|                         
    */
    #[storage(read, write)]
    fn upgrade_and_withdraw(
        asset: AssetId,
        new_rlp_contract_receiver: ContractId,
    ) {
        _only_gov();

        // withdraw any assets to the new RLPManager contract
        let asset_balance = balance_of(ContractId::this(), asset);
        if asset_balance > 0 {
            transfer_assets(
                asset,
                Identity::ContractId(new_rlp_contract_receiver),
                asset_balance,
            );
            log(UpgradeAndWithdraw { asset, new_rlp_contract_receiver });
        }
    }

    #[storage(read, write)]
    fn set_gov(gov: Identity) {
        _only_gov();

        storage.gov.write(gov);
        log(SetGov { gov });
    }

    #[storage(read, write)]
    fn set_vault(vault: ContractId) {
        _only_gov();

        storage.vault.write(vault);
        log(SetVault { vault });
    }

    #[storage(read, write)]
    fn set_in_private_mode(in_private_mode: bool) {
        _only_gov();

        storage.in_private_mode.write(in_private_mode);
        log(SetInPrivateMode { in_private_mode });
    }

    #[storage(read, write)]
    fn set_shorts_tracker(shorts_tracker: ContractId) {
        _only_gov();

        storage.shorts_tracker.write(shorts_tracker);
        log(SetShortsTracker { shorts_tracker });
    }
    
    #[storage(read, write)]
    fn set_shorts_tracker_avg_price_weight(shorts_tracker_avg_price_weight: u64) {
        _only_gov();

        require(
            shorts_tracker_avg_price_weight.as_u256() <= BASIS_POINTS_DIVISOR, 
            Error::RLPManagerInvalidWeight
        );

        storage.shorts_tracker_avg_price_weight.write(shorts_tracker_avg_price_weight.as_u256());
        log(SetShortsTrackerAvgPriceWeight { shorts_tracker_avg_price_weight });
    }

    #[storage(read, write)]
    fn set_handler(handler: Identity, is_active: bool) {
        _only_gov();

        require(!handler.is_zero(), Error::RLPManagerHandlerZero);

        storage.is_handler.insert(handler, is_active);
        log(SetHandler { handler, is_active });
    }

    #[storage(read, write)]
    fn set_cooldown_duration(cooldown_duration: u64) {
        _only_gov();

        require(
            cooldown_duration <= MAX_COOLDOWN_DURATION, 
            Error::RLPManagerInvalidCooldownDuration
        );

        storage.cooldown_duration.write(cooldown_duration);
        log(SetCooldownDuration { cooldown_duration });
    }

    #[storage(read, write)]
    fn set_aum_adjustment(
        aum_addition: u256,
        aum_deduction: u256
    ) {
        _only_gov();

        storage.aum_addition.write(aum_addition);
        storage.aum_deduction.write(aum_deduction);

        log(SetAumAdjustment {
            aum_addition,
            aum_deduction
        });
    }

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V / 
      /_/_/       \_/  |_|\___| \_/\_/  
    */
    #[storage(read)]
    fn get_rlp_contract() -> ContractId {
        storage.rlp_contract.read()
    }

    #[storage(read)]
    fn get_rusd_contract() -> ContractId {
        storage.rusd_contract.read()
    }

    #[storage(read)]
    fn get_vault() -> ContractId {
        storage.vault.read()
    }

    #[storage(read)]
    fn get_price(maximize: bool) -> u256 {
        let aum = _get_aum(maximize);
        let supply = abi(RLP, storage.rlp_contract.read().into()).total_rlp_supply();

        (aum * RLP_PRECISION) / supply.as_u256()
    }

    #[storage(read)]
    fn get_aums() -> Vec<u256> {
        let mut vec: Vec<u256> = Vec::new();
        vec.push(_get_aum(true));
        vec.push(_get_aum(false));

        vec
    }

    #[storage(read)]
    fn get_aum_in_rusd(maximize: bool) -> u256 {
        _get_aum_in_rusd(maximize)
    }

    /*
          ____  ____        _     _ _
         / / / |  _ \ _   _| |__ | (_) ___ 
        / / /  | |_) | | | | '_ \| | |/ __|
       / / /   |  __/| |_| | |_) | | | (__ 
      /_/_/    |_|    \__,_|_.__/|_|_|\___|
    */
    #[payable]
    #[storage(read, write)]
    fn add_liquidity(
        asset: AssetId,
        amount: u64,
        min_rusd: u64,
        min_rlp: u64
    ) -> u256 {
        _begin_non_reentrant(storage.lock);

        require(
            !storage.in_private_mode.read(), 
            Error::RLPManagerForbiddenInPrivateMode
        );

        let amount_out = _add_liquidity(
            get_sender(),
            asset,
            amount,
            min_rusd,
            min_rlp
        );

        _end_non_reentrant(storage.lock);

        amount_out
    }

    #[payable]
    #[storage(read, write)]
    fn add_liquidity_for_account(
        account: Identity,
        asset: AssetId,
        amount: u64,
        min_rusd: u64,
        min_rlp: u64
    ) -> u256 {
        _only_handler();
        _begin_non_reentrant(storage.lock);

        let amount_out = _add_liquidity(
            account,
            asset,
            amount,
            min_rusd,
            min_rlp
        );

        _end_non_reentrant(storage.lock);

        amount_out
    }

    /// this call must be batched with a call to `RUSD.set_user_staked_balance`
    /// to get the correct staked balance for the user
    /// also, RLP must be forwarded with the call
    #[payable]
    #[storage(read, write)]
    fn remove_liquidity(
        asset_out: AssetId,
        rlp_amount: u64,
        min_out: u64,
        receiver: Identity
    ) -> u256 {
        _begin_non_reentrant(storage.lock);

        require(
            !storage.in_private_mode.read(), 
            Error::RLPManagerForbiddenInPrivateMode
        );
        
        let amount_out = _remove_liquidity(
            get_sender(),
            asset_out,
            rlp_amount,
            min_out,
            receiver
        );

        _end_non_reentrant(storage.lock);

        amount_out
    }

    /// this call must be batched with a call to `RUSD.set_user_staked_balance`
    /// to get the correct staked balance for the user
    /// also, RLP must be forwarded with the call
    #[payable]
    #[storage(read, write)]
    fn remove_liquidity_for_account(
        account: Identity,
        asset_out: AssetId,
        rlp_amount: u64,
        min_out: u64,
        receiver: Identity
    ) -> u256 {
        _only_handler();
        _begin_non_reentrant(storage.lock);

        let amount_out = _remove_liquidity(
            account,
            asset_out,
            rlp_amount,
            min_out,
            receiver
        );

        _end_non_reentrant(storage.lock);

        amount_out
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
    require(get_sender() == storage.gov.read(), Error::RLPManagerForbidden);
}

#[storage(read)]
fn _only_handler() {
    require(
        storage.is_handler.get(get_sender()).try_read().unwrap_or(false),
        Error::RLPManagerOnlyHandler
    );
}

#[storage(read)]
fn _get_aum_in_rusd(maximize: bool) -> u256 {
    let aum = _get_aum(maximize);

    aum * 10.pow(RUSD_DECIMALS).as_u256() / PRICE_PRECISION
}

#[storage(read, write)]
fn _add_liquidity(
    account: Identity,
    asset: AssetId,
    amount: u64,
    min_rusd: u64,
    min_rlp: u64
) -> u256 {
    require(
        msg_asset_id() == asset,
        Error::RLPManagerInvalidAssetForwarded
    );
    require(
        msg_amount() == amount && msg_amount() > 0,
        Error::RLPManagerInvalidAssetAmountForwarded
    );

    let rlp_contract = abi(RLP, storage.rlp_contract.read().into());
    let rlp_src3 = abi(SRC3, storage.rlp_contract.read().into());

    // calculate aum before buyRUSD
    let aum_in_rusd = _get_aum_in_rusd(true);
    let rlp_supply = rlp_contract.total_rlp_supply();

    let vault = abi(Vault, storage.vault.read().into());

    let rusd_amount = vault.buy_rusd{
        asset_id: asset.into(),
        coins: amount
    }(
        asset,
        Identity::ContractId(ContractId::this())
    );

    require(
        rusd_amount >= min_rusd.as_u256(),
        Error::RLPManagerInsufficientRUSDOutput
    );

    let mint_amount = if aum_in_rusd == 0 {
        rusd_amount
    } else {
        (rusd_amount * rlp_supply.as_u256()) / aum_in_rusd
    };

    require(
        mint_amount >= min_rlp.as_u256(),
        Error::RLPManagerInsufficientRLPOutput
    );

    let timestamp = get_unix_timestamp();
    storage.last_added_at.insert(account, timestamp);
    log(WriteLastAddedAt { account, timestamp });

    // @TODO: potential revert here
    rlp_src3.mint(
        account,
        Some(DEFAULT_SUB_ID), // this is unused, but required by the interface to meet the SRC3 standard
        u64::try_from(mint_amount).unwrap()
    );

    log(AddLiquidity {
        account,
        asset,
        amount,
        aum_in_rusd,
        rlp_supply,
        rusd_amount,
        mint_amount
    });

    mint_amount
}

#[storage(read, write)]
fn _remove_liquidity(
    account: Identity,
    asset_out: AssetId,
    rlp_amount: u64,
    min_out: u64,
    receiver: Identity
) -> u256 {
    require(
        storage.last_added_at.get(account).try_read().unwrap_or(0) + storage.cooldown_duration.read() 
            <= get_unix_timestamp(),
        Error::RLPManagerCooldownDurationNotYetPassed
    );

    let vault = abi(Vault, storage.vault.read().into());

    let rusd_contract = abi(YieldAsset, storage.rusd_contract.read().into());
    let rusd_src3 = abi(SRC3, rusd_contract.get_id().into());
    let rlp_contract = abi(RLP, storage.rlp_contract.read().into());
    let rlp_src3 = abi(SRC3, storage.rlp_contract.read().into());
    let rlp = rlp_contract.get_id();

    require(
        msg_asset_id() == rlp,
        Error::RLPManagerInvalidRLPAssetForwarded
    );
    require(
        msg_amount() == rlp_amount && msg_amount() > 0,
        Error::RLPManagerInvalidRLPAmountForwarded
    );

    // calculate aum before sellRUSD
    let aum_in_rusd = _get_aum_in_rusd(false);
    let rlp_supply = rlp_contract.total_rlp_supply();

    let rusd_amount = (rlp_amount.as_u256() * aum_in_rusd) / rlp_supply.as_u256();
    let rusd_balance = balance_of(ContractId::this(), rusd_contract.get_id()).as_u256();
    if rusd_amount > rusd_balance {
        // @TODO: potential revert here
        rusd_src3.mint(
            Identity::ContractId(ContractId::this()), 
            Some(DEFAULT_SUB_ID), // this is unused, but required by the interface to meet the SRC3 standard
            u64::try_from(rusd_amount - rusd_balance).unwrap(),
        );
    }

    // Burn RLP
    rlp_src3.burn{
        asset_id: rlp.into(),
        coins: rlp_amount
    }(
        ZERO, // this is unused, but required by the interface to meet the SRC3 standard
        rlp_amount
    );

    // sell RUSD
    let amount_out = vault.sell_rusd{
        asset_id: rusd_contract.get_id().into(),
        // @TODO: potential revert here
        coins: u64::try_from(rusd_amount).unwrap()
    }(
        asset_out,
        receiver
    );
    require(
        amount_out >= min_out.as_u256(), 
        Error::RLPManagerInsufficientOutput
    );

    log(RemoveLiquidity {
        account,
        asset: asset_out,
        rlp_amount,
        aum_in_rusd,
        rlp_supply,
        rusd_amount,
        amount_out
    });

    amount_out
}

#[storage(read)]
fn _get_aum(maximize: bool) -> u256 {
    let vault = abi(Vault, storage.vault.read().into());

    let length = vault.get_all_whitelisted_assets_length();
    let mut aum = storage.aum_addition.read();
    let mut short_profits: u256 = 0;

    let mut i = 0;
    while i < length {
        let asset = vault.get_whitelisted_asset_by_index(i);
        let is_whitelisted = vault.is_asset_whitelisted(asset);

        if !is_whitelisted {
            i += 1;
            continue;
        }

        let price = if maximize {
            vault.get_max_price(asset)
        } else {
            vault.get_min_price(asset)
        };

        let pool_amount = vault.get_pool_amounts(asset);
        let decimals = vault.get_asset_decimals(asset);

        if vault.is_stable_asset(asset) {
            aum += (pool_amount * price) / 10.pow(decimals).as_u256();
        } else {
            // add global short profit / loss
            let size = vault.get_global_short_sizes(asset);

            if size > 0 {
                let (delta, has_profit) = _get_global_short_delta(asset, price, size);
                if !has_profit {
                    // add losses from shorts
                    aum = aum + delta;
                } else {
                    short_profits += delta;
                }
            }

            aum += vault.get_guaranteed_usd(asset);

            let reserved_amount = vault.get_reserved_amount(asset);
            aum += ((pool_amount - reserved_amount) * price) / 10.pow(decimals).as_u256();
        }

        i += 1;
    }

    aum = if short_profits > aum { 0 } else { aum - short_profits };

    let aum_deduction = storage.aum_deduction.read();

    if aum_deduction > aum { 0 } else { aum - aum_deduction }
}

#[storage(read)]
fn _get_global_short_delta(
    asset: AssetId,
    price: u256,
    size: u256
) -> (u256, bool) {
    let avg_price = _get_global_short_avg_price(asset);
    let price_delta = if avg_price > price {
        avg_price - price
    } else {
        price - avg_price
    };

    let delta = (size * price_delta) / avg_price;

    (delta, avg_price > price)
}

#[storage(read)]
fn _get_global_short_avg_price(asset: AssetId) -> u256 {
    let vault = abi(Vault, storage.vault.read().into());
    let shorts_tracker = abi(ShortsTracker, storage.shorts_tracker.read().into());

    if storage.shorts_tracker.read() == ZERO_CONTRACT || !shorts_tracker.is_global_short_data_ready() {
        return vault.get_global_short_average_prices(asset);
    }

    let vault_average_price = vault.get_global_short_average_prices(asset);
    let shorts_tracker_average_price = shorts_tracker.get_global_short_average_prices(asset);

    let shorts_tracker_average_price_weight = storage.shorts_tracker_avg_price_weight.read();
    if shorts_tracker_average_price_weight == 0 {
        return vault_average_price;
    } else if shorts_tracker_average_price_weight == BASIS_POINTS_DIVISOR {
        return shorts_tracker_average_price;
    }

    vault_average_price
        .multiply(BASIS_POINTS_DIVISOR - shorts_tracker_average_price_weight)
        .add(shorts_tracker_average_price * shorts_tracker_average_price_weight)
        .divide(BASIS_POINTS_DIVISOR)
}