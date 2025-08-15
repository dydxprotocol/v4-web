// SPDX-License-Identifier: Apache-2.0
contract;

mod events;
mod constants;
mod errors;

/*
__     __          _ _   
\ \   / /_ _ _   _| | |_ 
 \ \ / / _` | | | | | __|
  \ V / (_| | |_| | | |_ 
   \_/ \__,_|\__,_|_|\__|
*/

use std::{
    auth::msg_sender,
    block::timestamp,
    call_frames::{
        msg_asset_id,
    },
    context::*,
    revert::require,
    storage::storage_vec::*,
    math::*,
    primitive_conversions::{
        u8::*,
        u64::*,
    }
};
use std::hash::*;
use helpers::{
    signed_256::*,
    transfer::transfer_assets,
    time::get_unix_timestamp,
    utils::*,
    zero::*,
    reentrancy::*,
};
use standards::src3::SRC3;
use core_interfaces::{
    vault::{
        Vault,
        Position,
        PositionKey
    },
    vault_pricefeed::VaultPricefeed,
};
use asset_interfaces::rusd::RUSD;
use sway_libs::pausable::{
    _is_paused as sl_is_paused,
    _pause as sl_pause,
    _unpause as sl_unpause,
    require_not_paused as sl_require_not_paused,
    Pausable
};
use events::*;
use constants::*;
use errors::*;

// revision of the contract
const REVISION: u8 = 6u8;

storage {
    // gov is not restricted to an `Address` (EOA) or a `Contract` (external)
    // because this can be either a regular EOA (Address) or a Multisig (Contract)
    gov: Identity = ZERO_IDENTITY,
    is_initialized: bool = false,
    lock: bool = false,
    
    has_dynamic_fees: bool = false,
    min_profit_time: u64 = 0,

    // Externals
    router: ContractId = ZERO_CONTRACT,
    // this is the RUSD contract
    rusd_contr: ContractId = ZERO_CONTRACT,
    // this is the RUSD native asset (AssetId::new(rusd_contr, ZERO))
    rusd: AssetId = ZERO_ASSET,
    pricefeed_provider: ContractId = ZERO_CONTRACT,

    /// ---------------------  Fees  ---------------------
    /// charged when liquidating a position
    /// denominated in USD
    liquidation_fee_usd: u256 = DEFAULT_LIQUIDATION_FEE_USD,
    /// general tax applied to all assets to generate protocol revenue
    tax_basis_points: u64 = 50, // 0.5%
    /// reduced tax for stable assets
    stable_tax_basis_points: u64 = 20, // 0.2%
    /// charged when minting/burning RLP/RUSD assets
    /// helps maintain the stability of the RLP pool and discourage rapid entering and exiting.
    mint_burn_fee_basis_points: u64 = 30, // 0.3%
    /// charged when swapping b/w different assets within the protocol
    swap_fee_basis_points: u64 = 30, // 0.3%
    /// reduced swap fee for stable assets
    stable_swap_fee_basis_points: u64 = 4, // 0.04%
    /// applied to size of leveraged positions
    margin_fee_basis_points: u64 = 10, // 0.1%

    total_asset_weights: u64 = 0,

    // Misc
    approved_routers: StorageMap<Identity, StorageMap<Identity, bool>> = StorageMap {},
    is_liquidator: StorageMap<Identity, bool> = StorageMap {},
    max_leverage: StorageMap<AssetId, u256> = StorageMap {},

    whitelisted_asset_count: u64 = 0,
    all_whitelisted_assets: StorageVec<AssetId> = StorageVec {},

    whitelisted_assets: StorageMap<AssetId, bool> = StorageMap {},
    asset_decimals: StorageMap<AssetId, u32> = StorageMap {},
    min_profit_basis_points: StorageMap<AssetId, u64> = StorageMap {},
    stable_assets: StorageMap<AssetId, bool> = StorageMap {},
    shortable_assets: StorageMap<AssetId, bool> = StorageMap {},

    // allows customisation of index composition
    asset_weights: StorageMap<AssetId, u64> = StorageMap {},
    // allows setting a max amount of RUSD debt for an asset
    max_rusd_amounts: StorageMap<AssetId, u256> = StorageMap {},

    // allows specification of an amount to exclude from swaps
    // can be used to ensure a certain amount of liquidity is available for leverage positions
    buffer_amounts: StorageMap<AssetId, u256> = StorageMap {},
    // tracks the last time funding was updated for a token
    last_funding_times: StorageMap<AssetId, u64> = StorageMap {},
    // tracks all open Positions
    positions: StorageMap<b256, Position> = StorageMap {},
    // tracks amount of fees per asset
    fee_reserves: StorageMap<AssetId, u256> = StorageMap {},
    /// tracks average entry price for all short positions of each Asset
    /// value is weighted average at which all short positions for that asset were opened.
    global_short_average_prices: StorageMap<AssetId, u256> = StorageMap {},
    /// defines maximum allowed size for the total short positions for an Asset
    /// risk management feature that prevents the protocol from having too much exposure to 
    /// short positions for any single asset.
    max_global_short_sizes: StorageMap<AssetId, u256> = StorageMap {},

    // Funding
    funding_interval: u64 = 8 * 3600, // 8 hours
    funding_rate_factor: u64 = 0,
    stable_funding_rate_factor: u64 = 0,

    // tracks amount of RUSD debt for each supported asset
    rusd_amounts: StorageMap<AssetId, u256> = StorageMap {},

    // tracks the number of received tokens that can be used for leverage
    // tracked separately to exclude funds that are deposited 
    // as margin collateral
    pool_amounts: StorageMap<AssetId, u256> = StorageMap {},
    // tracks the amount of USD that is "guaranteed" by opened leverage positions
    // this value is used to calculate the redemption values for selling of RUSD
    // this is an estimated amount, it is possible for the actual guaranteed value to be lower
    // in the case of sudden price decreases, the guaranteed value should be corrected
    // after liquidations are carried out
    guaranteed_usd: StorageMap<AssetId, u256> = StorageMap {},
    // tracks the funding rates based on utilization
    cumulative_funding_rates: StorageMap<AssetId, u256> = StorageMap {},
    // tracks the number of tokens reserved for open leverage positions
    reserved_amounts: StorageMap<AssetId, u256> = StorageMap {},
    /// tracks the total size of all short positions for each Asset
    /// value is total size of all short positions across all users
    global_short_sizes: StorageMap<AssetId, u256> = StorageMap {},
 
    managers: StorageMap<ContractId, bool> = StorageMap {},
}

impl Pausable for Contract {
    #[storage(read)]
    fn is_paused() -> bool {
        sl_is_paused()
    }

    #[storage(write)]
    fn pause() {
        _only_gov();
        
        sl_pause();
        log(SetPaused { is_paused: true });
    }

    #[storage(write)]
    fn unpause() {
        _only_gov();

        sl_unpause();
        log(SetPaused { is_paused: false });
    }
}

impl Vault for Contract {
    /// Get the revision of the contract
    fn get_revision() -> u8 {
        REVISION
    }

    #[storage(read, write)]
    fn initialize(
        gov: Identity,
        rusd: AssetId,
        rusd_contr: ContractId,
    ) {
        require(!storage.is_initialized.read(), Error::VaultAlreadyInitialized);
        storage.is_initialized.write(true);
        storage.gov.write(gov);

        require(
            rusd == AssetId::new(rusd_contr, ZERO),
            Error::VaultInvalidRUSDAsset
        );

        storage.rusd.write(rusd);
        storage.rusd_contr.write(rusd_contr);

        log(SetGov { gov });
        log(SetRusdContract { rusd_contr });
    }

    /*
          ____     _       _           _       
         / / /    / \   __| |_ __ ___ (_)_ __  
        / / /    / _ \ / _` | '_ ` _ \| | '_ \ 
       / / /    / ___ \ (_| | | | | | | | | | |
      /_/_/    /_/   \_\__,_|_| |_| |_|_|_| |_|                         
    */
    #[storage(write)]
    fn set_gov(gov: Identity) {
        _only_gov();
        storage.gov.write(gov);
        log(SetGov { gov })
    }

    #[storage(write)]
    fn set_manager(
        manager: ContractId, 
        is_active: bool
    ) {
        _only_gov();
        if(is_active) {
            storage.managers.insert(manager, true);
        } else {
            storage.managers.remove(manager);
        }
    }

    #[storage(write)]
    fn set_liquidator(
        liquidator: Identity, 
        is_active: bool
    ) {
        _only_gov();
        storage.is_liquidator.insert(liquidator, is_active);
        log(SetLiquidator { liquidator, is_active });
    }

    #[storage(write)]
    fn set_buffer_amount(
        asset: AssetId, 
        buffer_amount: u256
    ) {
        _only_gov();
        storage.buffer_amounts.insert(asset, buffer_amount);
        log(SetBufferAmount { asset, buffer_amount });
    }

    #[storage(write)]
    fn set_max_rusd_amount(
        asset: AssetId, 
        max_rusd_amount: u256
    ) {
        _only_gov();
        storage.max_rusd_amounts.insert(asset, max_rusd_amount);
        log(SetMaxRusdAmount { asset, max_rusd_amount });
    }

    #[storage(write)]
    fn set_pricefeed_provider(pricefeed_provider: ContractId) {
        _only_gov();
        storage.pricefeed_provider.write(pricefeed_provider);
        log(SetPricefeedProvider { pricefeed_provider });
    }

    #[storage(write)]
    fn set_router(router: ContractId) {
        _only_gov();
        storage.router.write(router);
        log(SetRouter { router });
    }

    #[storage(read, write)]
    fn set_fees(
        tax_basis_points: u64,
        stable_tax_basis_points: u64,
        mint_burn_fee_basis_points: u64,
        swap_fee_basis_points: u64,
        stable_swap_fee_basis_points: u64,
        margin_fee_basis_points: u64,
        liquidation_fee_usd: u256,
        min_profit_time: u64,
        has_dynamic_fees: bool,
    ) {
        _only_gov();

        require(
            tax_basis_points <= MAX_FEE_BASIS_POINTS &&
            stable_tax_basis_points <= MAX_FEE_BASIS_POINTS &&
            mint_burn_fee_basis_points <= MAX_FEE_BASIS_POINTS &&
            swap_fee_basis_points <= MAX_FEE_BASIS_POINTS &&
            stable_swap_fee_basis_points <= MAX_FEE_BASIS_POINTS &&
            margin_fee_basis_points <= MAX_FEE_BASIS_POINTS,
            Error::VaultInvalidFeeBasisPoints
        );
        require(liquidation_fee_usd <= MAX_LIQUIDATION_FEE_USD, Error::VaultInvalidLiquidationFeeUsd);

        storage.tax_basis_points.write(tax_basis_points);
        storage.stable_tax_basis_points.write(stable_tax_basis_points);
        storage.mint_burn_fee_basis_points.write(mint_burn_fee_basis_points);
        storage.swap_fee_basis_points.write(swap_fee_basis_points);
        storage.stable_swap_fee_basis_points.write(stable_swap_fee_basis_points);
        storage.margin_fee_basis_points.write(margin_fee_basis_points);
        storage.liquidation_fee_usd.write(liquidation_fee_usd);
        storage.min_profit_time.write(min_profit_time);
        storage.has_dynamic_fees.write(has_dynamic_fees);
 
        log(SetFees {
            tax_basis_points,
            stable_tax_basis_points,
            mint_burn_fee_basis_points,
            swap_fee_basis_points,
            stable_swap_fee_basis_points,
            margin_fee_basis_points,
            liquidation_fee_usd,
            min_profit_time,
            has_dynamic_fees
        });
    }

    /// max leverage must be multiplied by 10_000 to get actual leverage
    /// e.g: 50 * 10_000 = 50%
    #[storage(write)]
    fn set_max_leverage(asset: AssetId, max_leverage: u256) {
        _only_gov();
        storage.max_leverage.insert(asset, max_leverage);
        log(SetMaxLeverage { asset, max_leverage });
    }

    #[storage(read, write)]
    fn set_funding_rate(
        funding_interval: u64,
        funding_rate_factor: u64,
        stable_funding_rate_factor: u64,
    ) {
        _only_gov();
        require(
            funding_rate_factor <= MAX_FUNDING_RATE_FACTOR,
            Error::VaultInvalidFundingRateFactor
        );
        require(
            stable_funding_rate_factor <= MAX_FUNDING_RATE_FACTOR,
            Error::VaultInvalidStableFundingRateFactor
        );

        storage.funding_interval.write(funding_interval);
        storage.funding_rate_factor.write(funding_rate_factor);
        storage.stable_funding_rate_factor.write(stable_funding_rate_factor);

        log(SetFundingRateInfo {
            funding_interval,
            funding_rate_factor,
            stable_funding_rate_factor
        });
    }

    #[storage(read, write)]
    fn set_asset_config(
        asset: AssetId,
        asset_decimals: u32,
        asset_weight: u64,
        min_profit_bps: u64,
        max_rusd_amount: u256,
        is_stable: bool,
        is_shortable: bool
    ) {
        _only_gov();

        // increment token count for the first time
        if !storage.whitelisted_assets.get(asset).try_read().unwrap_or(false) {
            storage.whitelisted_asset_count.write(storage.whitelisted_asset_count.read() + 1);
            storage.all_whitelisted_assets.push(asset);
        }

        let total_asset_weights = 
            storage.total_asset_weights.read() - 
            storage.asset_weights.get(asset).try_read().unwrap_or(0);

        storage.whitelisted_assets.insert(asset, true);
        storage.asset_decimals.insert(asset, asset_decimals);
        storage.asset_weights.insert(asset, asset_weight);
        storage.min_profit_basis_points.insert(asset, min_profit_bps);
        storage.max_rusd_amounts.insert(asset, max_rusd_amount);
        storage.stable_assets.insert(asset, is_stable);
        storage.shortable_assets.insert(asset, is_shortable);

        storage.total_asset_weights.write(total_asset_weights + asset_weight);

        log(SetAssetConfig {
            asset,
            asset_decimals,
            asset_weight,
            min_profit_bps,
            max_rusd_amount,
            is_stable,
            is_shortable
        });
    }

    #[storage(read, write)]
    fn clear_asset_config(asset: AssetId) {
        _only_gov();

        require(
            storage.whitelisted_assets.get(asset).try_read().unwrap_or(false),
            Error::VaultAssetNotWhitelisted
        );

        // `asset_weights` is guaranteed to have a value, hence no need to gracefully unwrap
        let prev_asset_weight = storage.asset_weights.get(asset).read();
        storage.total_asset_weights.write(storage.total_asset_weights.read() - prev_asset_weight);

        storage.whitelisted_assets.remove(asset);
        storage.asset_decimals.remove(asset);
        storage.asset_weights.remove(asset);
        storage.min_profit_basis_points.remove(asset);
        storage.max_rusd_amounts.remove(asset);
        storage.stable_assets.remove(asset);
        storage.shortable_assets.remove(asset);

        storage.whitelisted_asset_count.write(storage.whitelisted_asset_count.read() - 1);

        log(ClearAssetConfig { asset });
    }

     #[storage(write)]
    fn set_max_global_short_size(
        asset: AssetId,
        max_global_short_size: u256
    ) {
        _only_gov();
        storage.max_global_short_sizes.insert(asset, max_global_short_size);
        log(SetMaxGlobalShortSize { asset, max_global_short_size });
    }

    #[storage(write)]
    fn set_approved_router(
        router: Identity,
        is_active: bool
    ) {
        let account = get_sender();
        storage.approved_routers.get(account).insert(router, is_active);
        log(SetApprovedRouter { 
            account,
            router,
            is_active
        });
    }

    #[storage(write)]
    fn set_rusd_amount(asset: AssetId, amount: u256) {
        _only_gov();

        let rusd_amount = storage.rusd_amounts.get(asset).try_read().unwrap_or(0);
        if amount > rusd_amount {
            _increase_rusd_amount(asset, amount - rusd_amount);
        } else {
            _decrease_rusd_amount(asset, rusd_amount - amount);
        }
    }

    #[storage(read, write)]
    fn withdraw_fees(
        asset: AssetId,
        receiver: Identity
    ) -> u64 {
        _only_gov();

        _withdraw_fees(asset, receiver)
    }

    #[storage(read)]
    fn upgrade_vault(new_vault: ContractId, asset: AssetId, amount: u64) {
        _only_gov();

        transfer_assets(
            asset,
            Identity::ContractId(new_vault),
            amount
        );

        log(UpgradeVault { new_vault, asset, amount });
    }

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    fn get_position_key(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool,
    ) -> b256 {
        _get_position_key(
            account,
            collateral_asset,
            index_asset,
            is_long
        )
    }

    #[storage(read)]
    fn get_position_delta(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool,
    ) -> (bool, u256) {
        _get_position_delta(
            account,
            collateral_asset,
            index_asset,
            is_long
        )
    }

    #[storage(read)]
    fn get_delta(
        index_asset: AssetId,
        size: u256,
        average_price: u256,
        is_long: bool,
        last_increased_time: u64,
    ) -> (bool, u256) {
        _get_delta(
            index_asset,
            size,
            average_price,
            is_long,
            last_increased_time
        )
    }

    #[storage(read)]
    fn get_entry_funding_rate(
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool,
    ) -> u256 {
        _get_entry_funding_rate(
            collateral_asset,
            index_asset,
            is_long
        )
    }

    #[storage(read)]
    fn get_funding_fee(
        collateral_asset: AssetId,
        size: u256,
        entry_funding_rate: u256,
    ) -> u256 {
        _get_funding_fee(
            collateral_asset,
            size,
            entry_funding_rate
        )
    }

    #[storage(read)]
    fn get_position_by_key(position_key: b256) -> Position {
        _get_position_by_key(position_key)
    }

    #[storage(read)]
    fn get_position_fee(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool,
        size_delta: u256,
    ) -> u256 {
        _get_position_fee(
            account,
            collateral_asset,
            index_asset,
            is_long,
            size_delta
        )
    }

    #[storage(read)]
    fn get_global_short_sizes(asset: AssetId) -> u256 {
        storage.global_short_sizes.get(asset).try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_global_short_average_prices(asset: AssetId) -> u256 {
        storage.global_short_average_prices.get(asset).try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_guaranteed_usd(asset: AssetId) -> u256 {
        storage.guaranteed_usd.get(asset).try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_max_price(asset: AssetId) -> u256 {
        _get_max_price(asset)
    }

    #[storage(read)]
    fn get_min_price(asset: AssetId) -> u256 {
        _get_min_price(asset)
    }

    #[storage(read)]
    fn asset_to_usd_min(asset: AssetId, asset_amount: u256) -> u256 {
        _asset_to_usd_min(asset, asset_amount)
    }

    #[storage(read)]
    fn usd_to_asset_max(asset: AssetId, usd_amount: u256) -> u256 {
        _usd_to_asset_max(asset, usd_amount)
    }

    #[storage(read)]
    fn usd_to_asset_min(asset: AssetId, usd_amount: u256) -> u256 {
        _usd_to_asset_min(asset, usd_amount)
    }

    #[storage(read)]
    fn usd_to_asset(asset: AssetId, usd_amount: u256, price: u256) -> u256 {
        _usd_to_asset(asset, usd_amount, price)
    }

    #[storage(read)]
    fn get_pool_amounts(asset: AssetId) -> u256 {
        storage.pool_amounts.get(asset).try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_fee_reserves(asset: AssetId) -> u256 {
        storage.fee_reserves.get(asset).try_read().unwrap_or(0)
    }
    
    #[storage(read)]
    fn get_reserved_amount(asset: AssetId) -> u256 {
        storage.reserved_amounts.get(asset).try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_rusd_amount(asset: AssetId) -> u256 {
        storage.rusd_amounts.get(asset).try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_max_rusd_amounts(asset: AssetId) -> u256 {
        storage.max_rusd_amounts.get(asset).try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_buffer_amounts(asset: AssetId) -> u256 {
        storage.buffer_amounts.get(asset).try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_asset_weights(asset: AssetId) -> u64 {
        storage.asset_weights.get(asset).try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_redemption_amount(
        asset: AssetId, 
        rusd_amount: u256
    ) -> u256 {
        _get_redemption_amount(asset, rusd_amount)
    }

    #[storage(read)]
    fn get_redemption_collateral(asset: AssetId) -> u256 {
        _get_redemption_collateral(asset)
    }

    #[storage(read)]
    fn get_redemption_collateral_usd(asset: AssetId) -> u256 {
        _asset_to_usd_min(
            asset,
            _get_redemption_collateral(asset)
        )
    }

    #[storage(read)]
    fn get_pricefeed_provider() -> ContractId {
        storage.pricefeed_provider.try_read().unwrap_or(ZERO_CONTRACT)
    }

    #[storage(read)]
    fn get_all_whitelisted_assets_length() -> u64 {
        storage.all_whitelisted_assets.len()
    }

    #[storage(read)]
    fn get_whitelisted_asset_by_index(index: u64) -> AssetId {
        if index >= storage.all_whitelisted_assets.len() {
            return ZERO_ASSET;
        }

        storage.all_whitelisted_assets.get(index).unwrap().read()
    }

    #[storage(read)]
    fn is_asset_whitelisted(asset: AssetId) -> bool {
        _is_asset_whitelisted(asset)
    }

    #[storage(read)]
    fn get_asset_decimals(asset: AssetId) -> u32 {
        storage.asset_decimals.get(asset).try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn is_stable_asset(asset: AssetId) -> bool {
        storage.stable_assets.get(asset).try_read().unwrap_or(false)
    }

    #[storage(read)]
    fn is_shortable_asset(asset: AssetId) -> bool {
        storage.shortable_assets.get(asset).try_read().unwrap_or(false)
    }

    #[storage(read)]
    fn get_position_leverage(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool,
    ) -> u256 {
        let position_key = _get_position_key(
            account, 
            collateral_asset, 
            index_asset, 
            is_long
        );
        let position = _get_position_by_key(position_key);
        require(
            position.collateral > 0,
            Error::VaultInvalidPosition
        );

        position.size * BASIS_POINTS_DIVISOR.as_u256() / position.collateral
    }

    #[storage(read)]
    fn get_cumulative_funding_rate(asset: AssetId) -> u256 {
        storage.cumulative_funding_rates.get(asset).try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_fee_basis_points(
        asset: AssetId,
        rusd_delta: u256,
        fee_basis_points: u256,
        tax_basis_points: u256,
        increment: bool
    ) -> u256 {
        _get_fee_basis_points(
            asset,
            rusd_delta,
            fee_basis_points,
            tax_basis_points,
            increment,
        )
    }

    #[storage(read)]
    fn get_liquidation_fee_usd() -> u256 {
        storage.liquidation_fee_usd.read()
    }

    #[storage(read)]
    fn get_tax_basis_points() -> u64 {
        storage.tax_basis_points.read()
    }

    #[storage(read)]
    fn get_stable_tax_basis_points() -> u64 {
        storage.stable_tax_basis_points.read()
    }

    #[storage(read)]
    fn get_mint_burn_fee_basis_points() -> u64 {
        storage.mint_burn_fee_basis_points.read()
    }

    #[storage(read)]
    fn get_swap_fee_basis_points() -> u64 {
        storage.swap_fee_basis_points.read()
    }

    #[storage(read)]
    fn get_stable_swap_fee_basis_points() -> u64 {
        storage.stable_swap_fee_basis_points.read()
    }

    #[storage(read)]
    fn get_margin_fee_basis_points() -> u64 {
        storage.margin_fee_basis_points.read()
    }

    #[storage(read)]
    fn get_min_profit_time() -> u64 {
        storage.min_profit_time.read()
    }

    #[storage(read)]
    fn get_has_dynamic_fees() -> bool {
        storage.has_dynamic_fees.read()
    }

    #[storage(read)]
    fn get_target_rusd_amount(asset: AssetId) -> u256 {
        _get_target_rusd_amount(asset)
    }

    #[storage(read)]
    fn get_utilization(asset: AssetId) -> u256 {
        let pool_amount = storage.pool_amounts.get(asset).try_read().unwrap_or(0);
        if pool_amount == 0 {
            return 0;
        }

        let reserved_amount = storage.reserved_amounts.get(asset).try_read().unwrap_or(0);
        
        reserved_amount * FUNDING_RATE_PRECISION / pool_amount
    }

    #[storage(read)]
    fn get_next_funding_rate(asset: AssetId) -> u256 {
       _get_next_funding_rate(asset) 
    }

    #[storage(read)]
    fn get_global_short_delta(asset: AssetId) -> (bool, u256) {
        _get_global_short_delta(asset)
    }

    #[storage(read)]
    fn is_liquidator(account: Identity) -> bool {
        storage.is_liquidator.get(account).try_read().unwrap_or(false)
    }

    #[storage(read)]
    fn validate_liquidation(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool,
        should_raise: bool,
    ) -> (u256, u256) {
        _validate_liquidation(
            account,
            collateral_asset,
            index_asset,
            is_long,
            should_raise
        )
    }

    #[storage(read)]
    fn get_buy_rusd_amount(
        asset: AssetId,
        asset_amount: u64
    ) -> (u256, u256, u256) {
        _get_buy_rusd_amount(asset, asset_amount)
    }

    #[storage(read)]
    fn get_sell_rusd_amount(
        asset: AssetId,
        rusd_amount: u256
    ) -> (u256, u64, u256) {
        _get_sell_rusd_amount(asset, rusd_amount)
    }

    #[storage(read)]
    fn get_swap_amounts(
        asset_in: AssetId,
        amount_in: u256,
        asset_out: AssetId,
    ) -> (u256, u64, u256, u256) {
        _get_swap_amounts(asset_in, amount_in, asset_out)
    }

    #[storage(read)]
    fn adjust_for_decimals(
        amount: u256, 
        asset_div: AssetId, 
        asset_mul: AssetId
    ) -> u256 {
        _adjust_for_decimals(amount, asset_div, asset_mul)
    }

    /*
          ____  ____        _     _ _
         / / / |  _ \ _   _| |__ | (_) ___ 
        / / /  | |_) | | | | '_ \| | |/ __|
       / / /   |  __/| |_| | |_) | | | (__ 
      /_/_/    |_|    \__,_|_.__/|_|_|\___|
    */
    #[storage(read, write)]
    fn update_cumulative_funding_rate(collateral_asset: AssetId) {
        _update_cumulative_funding_rate(collateral_asset);
    }

    /// deposit into the pool without minting RUSD tokens
    /// useful in allowing the pool to become over-collaterised
    #[payable]
    #[storage(read, write)]
    fn direct_pool_deposit(asset: AssetId) {
        sl_require_not_paused();

        _begin_non_reentrant(storage.lock);

        require(
            storage.whitelisted_assets.get(asset).try_read().unwrap_or(false),
            Error::VaultAssetNotWhitelisted
        );

        let amount = _transfer_in(asset).as_u256();
        // @TODO: check this
        require(amount > 0, Error::VaultInvalidAssetAmount);
        _increase_pool_amount(asset, amount);

        log(DirectPoolDeposit {
            asset: asset,
            amount: amount,
        });

        _end_non_reentrant(storage.lock);
    }

    #[payable]
    #[storage(read, write)]
    fn buy_rusd(asset: AssetId, receiver: Identity) -> u256 {
        sl_require_not_paused();
        
        _begin_non_reentrant(storage.lock);
        
        let amount_out = _buy_rusd(asset, receiver);
        _end_non_reentrant(storage.lock);

        amount_out
    }

    #[payable]
    #[storage(read, write)]
    fn sell_rusd(asset: AssetId, receiver: Identity) -> u256 {
        sl_require_not_paused();
        
        _begin_non_reentrant(storage.lock);

        let amount_out = _sell_rusd(asset, receiver);
        _end_non_reentrant(storage.lock);

        amount_out
    }

    #[payable]
    #[storage(read, write)]
    fn swap(
        asset_in: AssetId,
        asset_out: AssetId,
        receiver: Identity
    ) -> u64 {
        sl_require_not_paused();
        
        _begin_non_reentrant(storage.lock);

        let amount_out = _swap(asset_in, asset_out, receiver);
        _end_non_reentrant(storage.lock);

        amount_out
    }

    #[payable]
    #[storage(read, write)]
    fn increase_position(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        size_delta: u256,
        is_long: bool,
    ) {
        sl_require_not_paused();
        
        _begin_non_reentrant(storage.lock);

        _increase_position(account, collateral_asset, index_asset, size_delta, is_long);
        
        _end_non_reentrant(storage.lock);
    }

    #[storage(read, write)]
    fn decrease_position(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        collateral_delta: u256,
        size_delta: u256,
        is_long: bool,
        receiver: Identity
    ) -> u256 {
        sl_require_not_paused();
        
        _begin_non_reentrant(storage.lock);

        _validate_router(account);
        let amount_out = _decrease_position(
            account,
            collateral_asset,
            index_asset,
            collateral_delta,
            size_delta,
            is_long,
            receiver,
            true
        );

        _end_non_reentrant(storage.lock);

        amount_out
    }

    #[storage(read, write)]
    fn liquidate_position(
        account: Identity,
        collateral_asset: AssetId,
        index_asset: AssetId,
        is_long: bool,
        fee_receiver: Identity
    ) {
        sl_require_not_paused();
        
        _begin_non_reentrant(storage.lock);
        
        _liquidate_position(
            account, 
            collateral_asset, 
            index_asset, 
            is_long, 
            fee_receiver
        );
        
        _end_non_reentrant(storage.lock);
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
    require(get_sender() == storage.gov.read(), Error::VaultForbiddenNotGov);
}

#[storage(read)]
fn _only_manager() {
    require(
        storage.managers.get(get_contract_or_revert()).try_read().unwrap_or(false), 
        Error::VaultForbiddenNotManager
    );
}

fn _transfer_in(asset: AssetId) -> u64 {
    let amount = msg_amount();
    if amount > 0 {
        require(
            msg_asset_id() == asset,
            Error::VaultInvalidAssetForwarded
        );

        // transfer assets to the Vault
        transfer_assets(
            asset,
            Identity::ContractId(ContractId::this()),
            amount
        );
    }

    amount
}

fn _transfer_out(
    asset: AssetId, 
    amount: u64, 
    receiver: Identity,
) {
    transfer_assets(
        asset,
        receiver,
        amount
    );
}

#[storage(read)]
fn _validate_buffer_amount(asset: AssetId) {
    require(
        _get_pool_amounts(asset) >= _get_buffer_amounts(asset),
        Error::VaultPoolAmountLtBuffer
    );
}

#[storage(write)]
fn _write_position(
    position_key: b256, 
    position: Position
) {
    storage.positions.insert(position_key, position);
    log(WritePosition {
        position_key,
        position,
    });
}

#[storage(write)]
fn _write_last_funding_time(
    asset: AssetId, 
    timestamp: u64
) {
    storage.last_funding_times.insert(asset, timestamp);
    log(WriteLastFundingTime {
        asset,
        last_funding_time: timestamp,
    });
}

#[storage(write)]
fn _write_fee_reserve(
    asset: AssetId, 
    fee_reserve: u256
) {
    storage.fee_reserves.insert(asset, fee_reserve);
    log(WriteFeeReserve {
        asset,
        fee_reserve,
    });
}

#[storage(write)]
fn _write_global_short_average_price(
    asset: AssetId, 
    global_short_average_price: u256
) {
    storage.global_short_average_prices.insert(
        asset, 
        global_short_average_price
    );
    log(WriteGlobalShortAveragePrice {
        asset,
        global_short_average_price,
    });
}

fn _get_after_fee_amount(
    amount: u64, 
    fee_basis_points: u64, 
) -> u64 {
    amount * (BASIS_POINTS_DIVISOR - fee_basis_points) / BASIS_POINTS_DIVISOR
}

#[storage(read, write)]
fn _collect_swap_fees(
    asset: AssetId, 
    amount: u64, 
    after_fee_amount: u64, 
) {
    let fee_amount = amount - after_fee_amount;

    let fee_reserve = _get_fee_reserves(asset);
    _write_fee_reserve(asset, fee_reserve + fee_amount.as_u256());

    log(CollectSwapFees {
        asset,
        fee_usd: _asset_to_usd_min(asset, fee_amount.as_u256()),
        fee_assets: fee_amount,
    });
}

#[storage(read)]
fn _get_swap_fee_basis_points(
    asset_in: AssetId,
    asset_out: AssetId,
    rusd_amount: u256,
) -> u256 {
    let is_stableswap = 
        storage.stable_assets.get(asset_in).try_read().unwrap_or(false) && 
        storage.stable_assets.get(asset_out).try_read().unwrap_or(false);

    let base_bps = if is_stableswap {
        storage.stable_swap_fee_basis_points.read()
    } else {
        storage.swap_fee_basis_points.read()
    };

    let tax_bps = if is_stableswap {
        storage.stable_tax_basis_points.read()
    } else {
        storage.tax_basis_points.read()
    };

    let fee_basis_points_0 = _get_fee_basis_points(
        asset_in,
        rusd_amount,
        base_bps.as_u256(),
        tax_bps.as_u256(),
        true
    );
    let fee_basis_points_1 = _get_fee_basis_points(
        asset_out,
        rusd_amount,
        base_bps.as_u256(),
        tax_bps.as_u256(),
        false
    );

    // use the higher of the two fee basis points
    if fee_basis_points_0 > fee_basis_points_1 {
        fee_basis_points_0
    } else {
        fee_basis_points_1
    }
}

#[storage(read)]
fn _get_redemption_amount(asset: AssetId, rusd_amount: u256) -> u256 {
    let price = _get_max_price(asset);
    let redemption_amount = rusd_amount * PRICE_PRECISION / price;

    let rusd = storage.rusd.read();
    _adjust_for_decimals(redemption_amount, rusd, asset)
}

#[storage(read)]
fn _get_target_rusd_amount(asset: AssetId) -> u256 {
    let supply = abi(RUSD, storage.rusd_contr.read().into()).total_rusd_supply();
     let weight = storage.asset_weights.get(asset).try_read().unwrap_or(0);

    (weight * supply / storage.total_asset_weights.read()).as_u256()
}

#[storage(read)]
fn _adjust_for_decimals(
    amount: u256, 
    asset_div: AssetId, 
    asset_mul: AssetId
) -> u256 {
    let rusd = storage.rusd.read();
    let decimals_div = if asset_div == rusd {
        RUSD_DECIMALS
    } else {
        storage.asset_decimals.get(asset_div).try_read().unwrap_or(0)
    };

    let decimals_mul = if asset_mul == rusd {
        RUSD_DECIMALS
    } else {
        storage.asset_decimals.get(asset_mul).try_read().unwrap_or(0)
    };

    // this should fail if there's some weird stack overflow error
    require(
        decimals_div != 0 || decimals_mul != 0,
        Error::VaultDecimalsAreZero
    );

    amount * 10.pow(decimals_mul).as_u256() / 10.pow(decimals_div).as_u256()
}

#[storage(read)]
fn _asset_to_usd_min(asset: AssetId, asset_amount: u256) -> u256 {
    if asset_amount == 0 {
        return 0;
    }

    let price = _get_min_price(asset);
    let decimals = storage.asset_decimals.get(asset).try_read().unwrap_or(0);

    (asset_amount * price) / 10.pow(decimals).as_u256()
}

#[storage(read)]
fn _usd_to_asset_max(asset: AssetId, usd_amount: u256) -> u256 {
    if usd_amount == 0 {
        return 0;
    }

    // @notice this is CORRECT (asset_max -> get_min_price)
    let price = _get_min_price(asset);

    _usd_to_asset(asset, usd_amount, price)
}

#[storage(read)]
fn _usd_to_asset_min(asset: AssetId, usd_amount: u256) -> u256 {
    if usd_amount == 0 {
        return 0;
    }

    // @notice this is CORRECT (asset_min -> get_max_price)
    let price = _get_max_price(asset);

    _usd_to_asset(asset, usd_amount, price)
}

#[storage(read)]
fn _usd_to_asset(asset: AssetId, usd_amount: u256, price: u256) -> u256 {
    require(price != 0, Error::VaultPriceQueriedIsZero);

    if usd_amount == 0 {
        return 0;
    }

    let decimals = storage.asset_decimals.get(asset).try_read().unwrap_or(0);

    (usd_amount * 10.pow(decimals).as_u256()) / price
}

#[storage(read)]
fn _get_max_price(asset: AssetId) -> u256 {
    let vault_pricefeed = abi(VaultPricefeed, storage.pricefeed_provider.read().into());
    vault_pricefeed.get_price(
        asset, 
        true,
    )
}

#[storage(read)]
fn _get_min_price(asset: AssetId) -> u256 {
    let vault_pricefeed = abi(VaultPricefeed, storage.pricefeed_provider.read().into());
    vault_pricefeed.get_price(
        asset, 
        false,
    )
}

#[storage(read)]
fn _is_asset_whitelisted(asset: AssetId) -> bool {
    storage.whitelisted_assets.get(asset).try_read().unwrap_or(false)
}

#[storage(read)]
fn _get_position_by_key(position_key: b256) -> Position {
    storage.positions
        .get(position_key).try_read().unwrap_or(Position::default())
}

#[storage(read)]
fn _get_pool_amounts(asset: AssetId) -> u256 {
    storage.pool_amounts.get(asset).try_read().unwrap_or(0)
}

#[storage(read)]
fn _get_buffer_amounts(asset: AssetId) -> u256 {
    storage.buffer_amounts.get(asset).try_read().unwrap_or(0)
}

#[storage(read)]
fn _get_fee_reserves(asset: AssetId) -> u256 {
    storage.fee_reserves.get(asset).try_read().unwrap_or(0)
}

#[storage(read)]
fn _get_reserved_amount(asset: AssetId) -> u256 {
    storage.reserved_amounts.get(asset).try_read().unwrap_or(0)
}

#[storage(read)]
fn _get_global_short_sizes(asset: AssetId) -> u256 {
    storage.global_short_sizes.get(asset).try_read().unwrap_or(0)
}

#[storage(read)]
fn _get_rusd_amount(asset: AssetId) -> u256 {
    storage.rusd_amounts.get(asset).try_read().unwrap_or(0)
}

#[storage(read)]
fn _get_guaranteed_usd(asset: AssetId) -> u256 {
    storage.guaranteed_usd.get(asset).try_read().unwrap_or(0)
}

#[storage(read)]
fn _get_cumulative_funding_rate(asset: AssetId) -> u256 {
    storage.cumulative_funding_rates.get(asset).try_read().unwrap_or(0)
}

fn _get_position_key(
    account: Identity,
    collateral_asset: AssetId,
    index_asset: AssetId,
    is_long: bool,
) -> b256 {
    keccak256(PositionKey {
        account,
        collateral_asset,
        index_asset,
        is_long,
    })
}

// note that if calling this function independently the cumulativeFundingRates 
// used in getFundingFee will not be the latest value
#[storage(read)]
fn _validate_liquidation(
    account: Identity,
    collateral_asset: AssetId,
    index_asset: AssetId,
    is_long: bool,
    should_raise: bool,
) -> (u256, u256) {
    let position_key = _get_position_key(
        account, 
        collateral_asset, 
        index_asset, 
        is_long
    );

    let position = _get_position_by_key(position_key);

    let (has_profit, delta) = _get_delta(
        index_asset,
        position.size,
        position.average_price,
        is_long,
        position.last_increased_time
    );

    let funding_fee = _get_funding_fee(
        collateral_asset,
        position.size,
        position.entry_funding_rate
    );
    let position_fee = _get_position_fee(
        account,
        collateral_asset,
        index_asset,
        is_long,
        position.size,
    );

    let margin_fees = funding_fee + position_fee;

    if !has_profit && position.collateral < delta {
        if should_raise {
            require(false, Error::VaultLossesExceedCollateral);
        }

        return (1, margin_fees);
    }

    let mut remaining_collateral = position.collateral;
    if !has_profit {
        remaining_collateral = position.collateral - delta;
    }

    if remaining_collateral < margin_fees {
        if should_raise {
            require(false, Error::VaultFeesExceedCollateral);
        }

        // cap the fees to the remainingCollateral
        return (1, remaining_collateral);
    }

    if remaining_collateral < margin_fees + storage.liquidation_fee_usd.read() {
        if should_raise {
            require(false, Error::VaultLiquidationFeesExceedCollateral);
        }

        return (1, margin_fees);
    }

    let max_leverage = storage.max_leverage.get(index_asset).try_read().unwrap_or(0);
    let val1 = remaining_collateral * max_leverage;
    let val2 = position.size * BASIS_POINTS_DIVISOR.as_u256();

    if val1 < val2 {
        if should_raise {
            require(false, Error::VaultMaxLeverageExceeded);
        }

        return (2, margin_fees);
    }

    return (0, margin_fees);
}

#[storage(read)]
fn _get_global_short_delta(asset: AssetId) -> (bool, u256) {
    let size = _get_global_short_sizes(asset);
    if size == 0 {
        return (false, 0);
    }

    let next_price = _get_max_price(asset);
    let average_price = storage.global_short_average_prices.get(asset).try_read().unwrap_or(0);
    let has_profit = average_price > next_price;
    let price_delta = if has_profit {
        average_price - next_price
    } else {
        next_price - average_price
    };
    
    let delta = size * price_delta / average_price;
    (has_profit, delta)
}


#[storage(read)]
fn _get_delta(
    index_asset: AssetId,
    size: u256,
    average_price: u256,
    is_long: bool,
    last_increased_time: u64
) -> (bool, u256) {
    require(average_price > 0, Error::VaultInvalidAveragePrice);

    let price = if is_long {
        _get_min_price(index_asset)
    } else {
        _get_max_price(index_asset)
    };

    let price_delta = if average_price > price {
        average_price - price
    } else {
        price - average_price
    };

    let mut delta = size * price_delta / average_price;

    let mut has_profit = false;
    if is_long {
        has_profit = price > average_price;
    } else {
        has_profit = average_price > price;
    }

    // if the minProfitTime has passed then there will be no min profit threshold
    // the min profit threshold helps to prevent front-running issues
    let min_bps = if get_unix_timestamp() > last_increased_time + storage.min_profit_time.read() {
        0
    } else {
        storage.min_profit_basis_points.get(index_asset).try_read().unwrap_or(0)
    };

    if has_profit
        && (delta * BASIS_POINTS_DIVISOR.as_u256()) <= (size * min_bps.as_u256())
    {
        delta = 0;
    }

    (has_profit, delta)
}

#[storage(read)]
fn _get_position_fee(
    _account: Identity,
    _collateral_asset: AssetId,
    _index_asset: AssetId,
    _is_long: bool,
    size_delta: u256,
) -> u256 {

    if size_delta == 0 {
        return 0;
    }

    let mut after_fee_usd = size_delta * (BASIS_POINTS_DIVISOR - storage.margin_fee_basis_points.read()).as_u256();
    after_fee_usd = after_fee_usd / BASIS_POINTS_DIVISOR.as_u256();

    size_delta - after_fee_usd
}

#[storage(read)]
fn _get_entry_funding_rate(
    collateral_asset: AssetId,
    _index_asset: AssetId,
    _is_long: bool,
) -> u256 {
    _get_cumulative_funding_rate(collateral_asset)
}

#[storage(read)]
fn _get_next_funding_rate(asset: AssetId) -> u256 {
    let last_funding_time = storage.last_funding_times.get(asset).try_read().unwrap_or(0);
    let funding_interval = storage.funding_interval.read();

    if last_funding_time + funding_interval > get_unix_timestamp() {
        return 0;
    }

    let time_delta = get_unix_timestamp() - last_funding_time;

    let intervals = time_delta / funding_interval;
    let pool_amount = _get_pool_amounts(asset);
    if pool_amount == 0 {
        return 0;
    }

    let funding_rate_factor = if storage.stable_assets.get(asset).try_read().unwrap_or(false) {
        storage.stable_funding_rate_factor.read()
    } else {
        storage.funding_rate_factor.read()
    };

    funding_rate_factor.as_u256() * _get_reserved_amount(asset)
        * intervals.as_u256() / pool_amount
}

#[storage(read)]
fn _get_funding_fee(
    collateral_asset: AssetId,
    size: u256,
    entry_funding_rate: u256
) -> u256 {
    if size == 0 {
        return 0;
    }

    let mut funding_rate = _get_cumulative_funding_rate(collateral_asset);
    funding_rate = funding_rate - entry_funding_rate;
    if funding_rate == 0 {
        return 0;
    }

    size * funding_rate / FUNDING_RATE_PRECISION
}

#[storage(read)]
fn _get_position_delta(
    account: Identity,
    collateral_asset: AssetId,
    index_asset: AssetId,
    is_long: bool,
) -> (bool, u256) {

    let position_key = _get_position_key(
        account, 
        collateral_asset, 
        index_asset, 
        is_long
    );

    let position = _get_position_by_key(position_key);

    _get_delta(
        index_asset,
        position.size,
        position.average_price,
        is_long,
        position.last_increased_time
    )
}

// cases to consider
// 1. `initial_amount` is far from `target_amount`, action increases balance slightly => high rebate
// 2. `initial_amount` is far from `target_amount`, action increases balance largely => high rebate
// 3. `initial_amount` is close to `target_amount`, action increases balance slightly => low rebate
// 4. `initial_amount` is far from `target_amount`, action reduces balance slightly => high tax
// 5. `initial_amount` is far from `target_amount`, action reduces balance largely => high tax
// 6. `initial_amount` is close to `target_amount`, action reduces balance largely => low tax
// 7. `initial_amount` is above `target_amount`, nextAmount is below `target_amount` and vice versa
// 8. a large swap should have similar fees as the same trade split into multiple smaller swaps
#[storage(read)]
fn _get_fee_basis_points(
    asset: AssetId,
    rusd_delta: u256,
    fee_basis_points: u256,
    tax_basis_points: u256,
    should_increment: bool
) -> u256 {
    if !storage.has_dynamic_fees.read() {
        return fee_basis_points;
    }

    let initial_amount = _get_rusd_amount(asset);
    let mut next_amount = initial_amount + rusd_delta;
    if !should_increment {
        next_amount = if rusd_delta > initial_amount {
            0
        } else {
            initial_amount - rusd_delta
        };
    }

    let target_amount = _get_target_rusd_amount(asset);
    if target_amount == 0 {
        return fee_basis_points;
    }

    let initial_diff = if initial_amount > target_amount {
        initial_amount - target_amount
    } else {
        target_amount - initial_amount
    };

    let next_diff = if next_amount > target_amount {
        next_amount - target_amount
    } else {
        target_amount - next_amount
    };

    // action improves relative asset balance
    if next_diff < initial_diff {
        let rebate_bps = tax_basis_points * initial_diff / target_amount;
        return if rebate_bps > fee_basis_points {
            0
        } else {
            fee_basis_points - rebate_bps
        };
    }

    let mut avg_diff = (initial_diff + next_diff) / 2;
    if avg_diff > target_amount {
        avg_diff = target_amount;
    }

    let tax_bps = tax_basis_points * avg_diff / target_amount;
    
    fee_basis_points + tax_bps
}

#[storage(read, write)]
fn _increase_pool_amount(asset: AssetId, amount: u256) {
    let new_pool_amount = _get_pool_amounts(asset) + amount;
    storage.pool_amounts.insert(asset, new_pool_amount);
    log(WritePoolAmount { asset, pool_amount: new_pool_amount });

    let balance = balance_of(ContractId::this(), asset);

    require(
        new_pool_amount <= balance.as_u256(), 
        Error::VaultInvalidIncrease
    );
}

#[storage(read, write)]
fn _decrease_pool_amount(asset: AssetId, amount: u256) {
    let pool_amount = _get_pool_amounts(asset);
    require(pool_amount >= amount, Error::VaultPoolAmountExceeded);

    let new_pool_amount = pool_amount - amount;
    storage.pool_amounts.insert(asset, new_pool_amount);
    log(WritePoolAmount { asset, pool_amount: new_pool_amount });

    require(
        _get_reserved_amount(asset) <= new_pool_amount,
        Error::VaultReserveExceedsPool
    );
}

#[storage(read, write)]
fn _increase_rusd_amount(asset: AssetId, amount: u256) {
    let new_rusd_amount = _get_rusd_amount(asset) + amount;
    storage.rusd_amounts.insert(asset, new_rusd_amount);
    log(WriteRusdAmount { asset, rusd_amount: new_rusd_amount });

    let max_rusd_amount = storage.max_rusd_amounts.get(asset).try_read().unwrap_or(0);
    if max_rusd_amount != 0 {
        require(new_rusd_amount <= max_rusd_amount, Error::VaultMaxRusdExceeded);
    }
}

#[storage(read, write)]
fn _decrease_rusd_amount(asset: AssetId, amount: u256) {
    let value = _get_rusd_amount(asset);
    // since RUSD can be minted using multiple assets
    // it is possible for the RUSD debt for a single asset to be less than zero
    // the RUSD debt is capped to zero for this case
    if value <= amount {
        let _ = storage.rusd_amounts.remove(asset);
        log(WriteRusdAmount { asset, rusd_amount: 0 });
    } else {
        let new_rusd_amount = value - amount;
        storage.rusd_amounts.insert(asset, new_rusd_amount);
        log(WriteRusdAmount { asset, rusd_amount: new_rusd_amount });
    }
}

#[storage(read, write)]
fn _increase_guaranteed_usd(
    asset: AssetId, 
    usd_amount: u256
) {
    let guaranteed_amount = _get_guaranteed_usd(asset) + usd_amount;
    storage.guaranteed_usd.insert(
        asset,
        guaranteed_amount
    );
    
    log(WriteGuaranteedAmount { asset, guaranteed_amount});
}

#[storage(read, write)]
fn _decrease_guaranteed_usd(
    asset: AssetId, 
    usd_amount: u256
) {
    let guaranteed_amount = _get_guaranteed_usd(asset) - usd_amount;
    storage.guaranteed_usd.insert(
        asset,
        guaranteed_amount
    );

    log(WriteGuaranteedAmount { asset, guaranteed_amount});
}

#[storage(read, write)]
fn _increase_reserved_amount(asset: AssetId, amount: u256) {
    let new_reserved_amount = _get_reserved_amount(asset) + amount;
    storage.reserved_amounts.insert(
        asset,
        new_reserved_amount
    );
    log(WriteReservedAmount { asset, reserved_amount: new_reserved_amount });

    require(
        _get_reserved_amount(asset) <= _get_pool_amounts(asset),
        Error::VaultReserveExceedsPool
    );
}

#[storage(read, write)]
fn _decrease_reserved_amount(asset: AssetId, amount: u256) {
    if _get_reserved_amount(asset) < amount {
        require(false, Error::VaultInsufficientReserve);
    }

    let new_reserved_amount = _get_reserved_amount(asset) - amount;
    storage.reserved_amounts.insert(
        asset,
        new_reserved_amount
    );

    log(WriteReservedAmount { asset, reserved_amount: new_reserved_amount });
}

#[storage(write)]
fn _update_global_short_size(asset: AssetId, global_short_size: u256) {
    storage.global_short_sizes.insert(
        asset,
        global_short_size
    );
    log(UpdateGlobalShortSize { asset, global_short_size }); 
}

#[storage(read, write)]
fn _increase_global_short_size(asset: AssetId, amount: u256) {
    _update_global_short_size(
        asset,
        _get_global_short_sizes(asset) + amount
    );

    let max_size = storage.max_global_short_sizes.get(asset).try_read().unwrap_or(0);
    if max_size != 0 {
        require(
            _get_global_short_sizes(asset) <= max_size,
            Error::VaultMaxShortsExceeded
        );
    }
}

#[storage(read, write)]
fn _decrease_global_short_size(asset: AssetId, amount: u256) {
    let global_short_size = _get_global_short_sizes(asset);

    if amount > global_short_size {
        _update_global_short_size(asset, 0);
        return;
    }

    _update_global_short_size(
        asset,
        global_short_size - amount
    );
}

#[storage(read, write)]
fn _update_cumulative_funding_rate(collateral_asset: AssetId) {
    let timestamp = get_unix_timestamp();

    let last_funding_time = storage.last_funding_times.get(collateral_asset).try_read().unwrap_or(0);
    let funding_interval = storage.funding_interval.read();

    let updated_timestamp = (timestamp / funding_interval) * funding_interval;

    if last_funding_time == 0 {
        _write_last_funding_time(collateral_asset, updated_timestamp);
        return;
    }

    if last_funding_time + funding_interval > timestamp {
        return;
    }

    let funding_rate = _get_next_funding_rate(collateral_asset);

    let new_cumulative_funding_rate = _get_cumulative_funding_rate(collateral_asset) + funding_rate;
    storage.cumulative_funding_rates.insert(
        collateral_asset, 
        new_cumulative_funding_rate
    );

    _write_last_funding_time(collateral_asset, updated_timestamp);

    log(UpdateFundingRate {
        asset: collateral_asset,
        funding_rate: new_cumulative_funding_rate
    });
}

#[storage(read)]
fn _get_redemption_collateral(asset: AssetId) -> u256 {
    if storage.stable_assets.get(asset).try_read().unwrap_or(false) {
        return _get_pool_amounts(asset);
    }

    let guaranteed_usd = _get_guaranteed_usd(asset);

    let collateral = _usd_to_asset_min(
        asset,
        guaranteed_usd
    );

    collateral + _get_pool_amounts(asset) - _get_reserved_amount(asset)
}

#[storage(read)]
fn _validate_router(account: Identity) {
    let sender = get_sender();

    if sender == account || sender == Identity::ContractId(storage.router.read()) {
        return;
    }

    require(
        storage.approved_routers.get(account).get(sender)
            .try_read().unwrap_or(false),
        Error::VaultInvalidMsgCaller
    );
}

#[storage(read)]
fn _validate_assets(
    collateral_asset: AssetId,
    index_asset: AssetId,
    is_long: bool,
) {
    require(
        _is_asset_whitelisted(collateral_asset),
        Error::VaultCollateralAssetNotWhitelisted
    );

    let collateral_is_stable = storage.stable_assets.get(collateral_asset).try_read().unwrap_or(false);

    if is_long {
        require(
            collateral_asset == index_asset,
            Error::VaultLongCollateralIndexAssetsMismatch
        );
        require(
            !collateral_is_stable,
            Error::VaultLongCollateralAssetMustNotBeStableAsset
        );

        return;
    }

    require(
        collateral_is_stable,
        Error::VaultShortCollateralAssetMustBeStableAsset
    );
    require(
        !storage.stable_assets.get(index_asset).try_read().unwrap_or(false),
        Error::VaultShortIndexAssetMustNotBeStableAsset
    );
    require(
        storage.shortable_assets.get(index_asset).try_read().unwrap_or(false),
        Error::VaultShortIndexAssetNotShortable
    );
}

fn _validate_position(size: u256, collateral: u256) {
    if size == 0 {
        require(
            collateral == 0,
            Error::VaultCollateralShouldBeWithdrawn
        );
        return;
    }

    require(
        size >= collateral,
        Error::VaultSizeMustBeMoreThanCollateral
    );
}

// for longs:  next_average_price = (next_price * next_size) / (next_size + delta)
// for shorts: next_average_price = (next_price * next_size) / (next_size - delta)
#[storage(read)]
fn _get_next_average_price(
    index_asset: AssetId,
    size: u256,
    average_price: u256,
    is_long: bool,
    next_price: u256,
    size_delta: u256,
    last_increased_time: u64,
) -> u256 {

    let (has_profit, delta) = _get_delta(
        index_asset,
        size,
        average_price,
        is_long,
        last_increased_time
    );

    let next_size = size + size_delta;
    let mut divisor = 0;
    if is_long {
        divisor = if has_profit { next_size + delta } else { next_size - delta }
    } else {
        divisor = if has_profit { next_size - delta } else { next_size + delta }
    }

    next_price * next_size / divisor
}

// for longs:  next_average_price = (next_price * next_size) / (next_size + delta)
// for shorts: next_average_price = (next_price * next_size) / (next_size - delta)
#[storage(read)]
fn _get_next_global_short_average_price(
    index_asset: AssetId,
    next_price: u256,
    size_delta: u256,
) -> u256 {
    let size = _get_global_short_sizes(index_asset);
    let average_price = storage.global_short_average_prices.get(index_asset).try_read().unwrap_or(0);
    let has_profit = average_price > next_price;

    let price_delta = if has_profit {
        average_price - next_price
    } else {
        next_price - average_price
    };

    let delta = size * price_delta / average_price; 

    let next_size = size + size_delta;

    let divisor = if has_profit {
        next_size - delta
    } else {
        next_size + delta
    };

    next_price * next_size / divisor
}

#[storage(read, write)]
fn _collect_margin_fees(
    account: Identity,
    collateral_asset: AssetId,
    index_asset: AssetId,
    is_long: bool,
    size_delta: u256,
    size: u256,
    entry_funding_rate: u256,
) -> u256 {
    let mut fee_usd: u256 = 0;
    let mut fee_assets: u256 = 0;

    let position_fee = _get_position_fee(
        account,
        collateral_asset,
        index_asset,
        is_long,
        size_delta
    );

    let funding_fee = _get_funding_fee(
        collateral_asset,
        size,
        entry_funding_rate
    );

    fee_usd = position_fee + funding_fee;

    fee_assets = _usd_to_asset_min(collateral_asset, fee_usd);
    let new_fee_reserve =  _get_fee_reserves(collateral_asset) + fee_assets;
    _write_fee_reserve(collateral_asset, new_fee_reserve);

    log(CollectMarginFees {
        asset: collateral_asset,
        fee_usd,
        fee_assets,
    });

    fee_usd
}

#[storage(read, write)]
fn _withdraw_fees(
    asset: AssetId,
    receiver: Identity,
) -> u64 {
    let amount = u64::try_from(_get_fee_reserves(asset)).unwrap();
    if amount == 0 {
        return 0;
    }

    storage.fee_reserves.remove(asset);

    _transfer_out(
        asset,
        u64::try_from(amount).unwrap(),
        receiver,
    );

    log(WithdrawFees {
        asset,
        receiver,
        amount
    });

    amount
}

#[storage(read)]
fn _get_buy_rusd_amount(
    asset: AssetId,
    asset_amount: u64
) -> (u256, u256, u256) {
    let price = _get_min_price(asset);
    let rusd = storage.rusd.read();

    let mut rusd_amount = asset_amount.as_u256() * price / PRICE_PRECISION;
    rusd_amount = _adjust_for_decimals(rusd_amount, asset, rusd);
    require(rusd_amount > 0, Error::VaultInvalidRusdAmount);

    let fee_basis_points = _get_fee_basis_points(
        asset,
        rusd_amount,
        storage.mint_burn_fee_basis_points.read().as_u256(),
        storage.tax_basis_points.read().as_u256(),
        true
    );

    let u64_amount_after_fees = _get_after_fee_amount(
        asset_amount, 
        u64::try_from(fee_basis_points).unwrap()
    );
    let amount_after_fees = u64_amount_after_fees.as_u256();

    let mut mint_amount = amount_after_fees * price / PRICE_PRECISION;
    mint_amount = _adjust_for_decimals(mint_amount, asset, rusd);

    (mint_amount, amount_after_fees, fee_basis_points)
}

#[storage(read, write)]
fn _buy_rusd(
    asset: AssetId, 
    receiver: Identity,
) -> u256 {
    _only_manager();

    require(
        !receiver.is_zero(),
        Error::VaultReceiverCannotBeZero
    );
    require(
        _is_asset_whitelisted(asset),
        Error::VaultAssetNotWhitelisted
    );

    let asset_amount = _transfer_in(asset);
    require(asset_amount > 0, Error::VaultInvalidAssetAmount);

    _update_cumulative_funding_rate(asset);

    let (
        mint_amount, 
        amount_after_fees, 
        fee_basis_points
    ) = _get_buy_rusd_amount(
        asset,
        asset_amount
    );
    // this needs to be called here because _get_buy_rusd_amount is read-only and cannot update state
    _collect_swap_fees(
        asset,
        asset_amount,
        u64::try_from(amount_after_fees).unwrap()
    );

    _increase_rusd_amount(asset, mint_amount);
    _increase_pool_amount(asset, amount_after_fees);

    // require rusd_amount to be less than u64::max
    require(
        mint_amount < u64::max().as_u256(),
        Error::VaultInvalidMintAmountGtU64Max
    );

    let rusd = abi(SRC3, storage.rusd_contr.read().into());
    rusd.mint(
        receiver,
        ZERO, // this is unused, but required by the interface to meet the SRC3 standard
        u64::try_from(mint_amount).unwrap(),
    );

    log(BuyRUSD {
        account: receiver,
        asset,
        asset_amount,
        rusd_amount: mint_amount,
        fee_basis_points,
    });

    mint_amount
}

#[storage(read)]
fn _get_sell_rusd_amount(
    asset: AssetId,
    rusd_amount: u256
) -> (u256, u64, u256) {
    let redemption_amount = _get_redemption_amount(asset, rusd_amount);
    require(redemption_amount > 0, Error::VaultInvalidRedemptionAmount);

    let fee_basis_points = _get_fee_basis_points(
        asset,
        rusd_amount,
        storage.mint_burn_fee_basis_points.read().as_u256(),
        storage.tax_basis_points.read().as_u256(),
        false
    );
    
    let u64_redemption_amount = u64::try_from(redemption_amount).unwrap();
    let amount_out = _get_after_fee_amount(
        u64_redemption_amount, 
        u64::try_from(fee_basis_points).unwrap()
    );
    require(amount_out > 0, Error::VaultInvalidAmountOut);

    (redemption_amount, amount_out, fee_basis_points)
}

#[storage(read, write)]
fn _sell_rusd(
    asset: AssetId, 
    receiver: Identity,
) -> u256 {
    _only_manager();

    require(
        !receiver.is_zero(),
        Error::VaultReceiverCannotBeZero
    );
    require(
        _is_asset_whitelisted(asset),
        Error::VaultAssetNotWhitelisted
    );

    let rusd = storage.rusd.read();

    let rusd_amount = _transfer_in(rusd).as_u256();
    require(rusd_amount > 0, Error::VaultInvalidRusdAmount);
    
    // require rusd_amount to be less than u64::max
    require(
        rusd_amount < u64::max().as_u256(),
        Error::VaultInvalidRUSDBurnAmountGtU64Max
    );

    _update_cumulative_funding_rate(asset);

    let (
        redemption_amount,
        amount_out,
        fee_basis_points
    ) = _get_sell_rusd_amount(asset, rusd_amount);
    // this needs to be called here because _get_sell_rusd_amount is read-only and cannot update state
    _collect_swap_fees(
        asset, 
        u64::try_from(redemption_amount).unwrap(),
        amount_out
    );
    require(amount_out > 0, Error::VaultInvalidAmountOut);

    _decrease_rusd_amount(asset, rusd_amount);
    _decrease_pool_amount(asset, redemption_amount);

    let u64_rusd_amount = u64::try_from(rusd_amount).unwrap();
    let rusd_contr = abi(SRC3, storage.rusd_contr.read().into());
    rusd_contr.burn{
        asset_id: rusd.into(),
        coins: u64_rusd_amount
    }(
        ZERO, // this is unused, but required by the interface to meet the SRC3 standard
        u64_rusd_amount
    );

    _transfer_out(
        asset, 
        amount_out, 
        receiver,
    );

    log(SellRUSD {
        account: receiver,
        asset,
        rusd_amount,
        asset_amount: amount_out,
        fee_basis_points,
    });

    amount_out.as_u256()
}

#[storage(read)]
fn _get_swap_amounts(
    asset_in: AssetId,
    amount_in: u256,
    asset_out: AssetId,
) -> (u256, u64, u256, u256) {
    let price_in = _get_min_price(asset_in);
    let price_out = _get_max_price(asset_out);

    let mut amount_out = amount_in * price_in / price_out;
    amount_out = _adjust_for_decimals(amount_out, asset_in, asset_out);

    // adjust rusdAmounts by the same rusdAmount as debt is shifted between the assets
    let mut rusd_amount = amount_in * price_in / PRICE_PRECISION;
    let rusd = storage.rusd.read();
    rusd_amount = _adjust_for_decimals(rusd_amount, asset_in, rusd);

    let fee_basis_points = _get_swap_fee_basis_points(
        asset_in, 
        asset_out, 
        rusd_amount,
    );

    let amount_out_after_fees = _get_after_fee_amount(
        u64::try_from(amount_out).unwrap(),
        u64::try_from(fee_basis_points).unwrap()
    );

    (
        amount_out,
        amount_out_after_fees,
        fee_basis_points,
        rusd_amount
    )
}

#[storage(read, write)]
fn _swap(
    asset_in: AssetId,
    asset_out: AssetId,
    receiver: Identity,
) -> u64 {
    require(
        !receiver.is_zero(),
        Error::VaultReceiverCannotBeZero
    );

    require(
        _is_asset_whitelisted(asset_in),
        Error::VaultAssetInNotWhitelisted
    );
    require(
        _is_asset_whitelisted(asset_out),
        Error::VaultAssetOutNotWhitelisted
    );
    require(asset_in != asset_out, Error::VaultAssetsAreEqual);

    _update_cumulative_funding_rate(asset_in);
    _update_cumulative_funding_rate(asset_out);

    let amount_in = _transfer_in(asset_in).as_u256();
    require(amount_in > 0, Error::VaultInvalidAmountIn);

    let (
        amount_out,
        amount_out_after_fees,
        fee_basis_points,
        rusd_amount
    ) = _get_swap_amounts(
        asset_in,
        amount_in,
        asset_out
    );
    // this needs to be called here because `_get_swap_amounts` is read-only and cannot update state
    _collect_swap_fees(
        asset_out, 
        u64::try_from(amount_out).unwrap(),
        amount_out_after_fees
    );

    _increase_rusd_amount(asset_in, rusd_amount);
    _decrease_rusd_amount(asset_out, rusd_amount);

    _increase_pool_amount(asset_in, amount_in);
    _decrease_pool_amount(asset_out, amount_out);

    _validate_buffer_amount(asset_out);

    _transfer_out(
        asset_out, 
        amount_out_after_fees, 
        receiver,
    );

    log(Swap {
        account: receiver,
        asset_in,
        asset_out,
        amount_in,
        amount_out,
        amount_out_after_fees,
        fee_basis_points,
    });

    amount_out_after_fees
}

#[storage(read, write)]
fn _increase_position(
    account: Identity,
    collateral_asset: AssetId,
    index_asset: AssetId, 
    size_delta: u256,
    is_long: bool,
) {
    require(
        !account.is_zero(),
        Error::VaultAccountCannotBeZero
    );

    _validate_router(account);
    _validate_assets(collateral_asset, index_asset, is_long);

    _update_cumulative_funding_rate(collateral_asset);
    
    let position_key = _get_position_key(
        account, 
        collateral_asset, 
        index_asset, 
        is_long
    );

    let mut position = _get_position_by_key(position_key);

    let price = if is_long {
        _get_max_price(index_asset)
    } else {
        _get_min_price(index_asset)
    };

    if position.size == 0 {
        position.average_price = price;

        // position is brand new, so register map[position_key] => position for off-chain indexer
        log(RegisterPositionByKey {
            position_key,
            account,
            collateral_asset, 
            index_asset, 
            is_long
        });
    }

    if position.size > 0 && size_delta > 0 {
        position.average_price = _get_next_average_price(
            index_asset,
            position.size,
            position.average_price,
            is_long,
            price,
            size_delta,
            position.last_increased_time,
        );
    }

    let fee = _collect_margin_fees(
        account,
        collateral_asset,
        index_asset,
        is_long,
        size_delta,
        position.size,
        position.entry_funding_rate,
    );

    let collateral_delta = _transfer_in(collateral_asset).as_u256();
    let collateral_delta_usd = _asset_to_usd_min(collateral_asset, collateral_delta);

    position.collateral = position.collateral + collateral_delta_usd;

    require(
        position.collateral >= fee,
        Error::VaultInsufficientCollateralForFees
    );
    position.collateral = position.collateral - fee;
    position.entry_funding_rate = _get_entry_funding_rate(
        collateral_asset,
        index_asset,
        is_long
    );
    position.size = position.size + size_delta;
    position.last_increased_time = get_unix_timestamp();

    require(
        position.size > 0,
        Error::VaultInvalidPositionSize
    );

    _validate_position(position.size, position.collateral);
    // we need to have a storage write here because _validate_liquidation re-constructs the position key and 
    // validates the average_price. If not for this position write, it would receive a stale avg price (could be 0)
    _write_position(position_key, position);

    let (_liquidation_state, _margin_fees) = _validate_liquidation(
        account,
        collateral_asset,
        index_asset,
        is_long,
        true 
    );

    // reserve assets to pay profits on the position
    let reserve_delta = _usd_to_asset_max(collateral_asset, size_delta);
    position.reserve_amount = position.reserve_amount + reserve_delta;
    _increase_reserved_amount(collateral_asset, reserve_delta);

    if is_long {
        // guaranteed_usd stores the sum of (position.size - position.collateral) for all positions
        // if a fee is charged on the collateral then guaranteed_usd should be increased by that 
        // fee amount since (position.size - position.collateral) would have increased by `fee`
        _increase_guaranteed_usd(collateral_asset, size_delta + fee);
        _decrease_guaranteed_usd(collateral_asset, collateral_delta_usd);

        // treat the deposited collateral as part of the pool
        _increase_pool_amount(collateral_asset, collateral_delta);

        // fees need to be deducted from the pool since fees are deducted from position.collateral
        // and collateral is treated as part of the pool
        _decrease_pool_amount(
            collateral_asset, 
            _usd_to_asset_min(collateral_asset, fee)
        );
    } else {
        let global_short_size = _get_global_short_sizes(index_asset);
        if global_short_size == 0 {
            _write_global_short_average_price(index_asset, price);
        } else {
            let new_price = _get_next_global_short_average_price(
                index_asset,
                price,
                size_delta,
            );

            _write_global_short_average_price(index_asset, new_price);
        }

        _increase_global_short_size(index_asset, size_delta);
    }

    log(IncreasePosition {
        key: position_key,
        account,
        collateral_asset,
        index_asset,
        collateral_delta: collateral_delta_usd,
        size_delta,
        is_long,
        price,
        fee,
    });

    _write_position(position_key, position);
}

#[storage(read, write)]
fn _decrease_position(
    account: Identity,
    collateral_asset: AssetId,
    index_asset: AssetId,
    collateral_delta: u256,
    size_delta: u256,
    is_long: bool,
    receiver: Identity,
    should_validate_router: bool,
) -> u256 {
    require(
        !account.is_zero(),
        Error::VaultAccountCannotBeZero
    );

    if should_validate_router {
        _validate_router(account);
    }

    _update_cumulative_funding_rate(collateral_asset);

    let position_key = _get_position_key(
        account, 
        collateral_asset, 
        index_asset, 
        is_long
    );
    let mut position = _get_position_by_key(position_key);
    require(position.size > 0, Error::VaultEmptyPosition);
    require(position.size >= size_delta, Error::VaultSizeExceeded);
    require(position.collateral >= collateral_delta, Error::VaultCollateralExceeded);

    let collateral = position.collateral;

    let reserve_delta = position.reserve_amount * size_delta / position.size;
    position.reserve_amount = position.reserve_amount - reserve_delta;
    // update storage because the above changes are ignored by call to other fn `_reduce_collateral`
    _write_position(position_key, position);

    _decrease_reserved_amount(collateral_asset, reserve_delta);

    let (usd_out, usd_out_after_fee) = _reduce_collateral(
        account,
        collateral_asset,
        index_asset,
        collateral_delta,
        size_delta,
        is_long,
    );
    // re-initialize position here because storage was updated in `_reduce_collateral`
    position = _get_position_by_key(position_key);

    if position.size != size_delta {
        position.entry_funding_rate = _get_entry_funding_rate(collateral_asset, index_asset, is_long);
        position.size = position.size - size_delta;

        _validate_position(position.size, position.collateral);
        // update storage because the above changes are ignored by call to other fn `validate_liquidation`
        // we need to have a storage write here because _validate_liquidation re-constructs the position key and 
        // validates the max_leverage. If not for this position write, it would receive an incorrect max_leverage error
        _write_position(position_key, position);
        let (_liquidation_state, _margin_fees) = _validate_liquidation(
            account,
            collateral_asset,
            index_asset,
            is_long,
            true
        );

        if is_long {
            _increase_guaranteed_usd(collateral_asset, collateral - position.collateral);
            _decrease_guaranteed_usd(collateral_asset, size_delta);
        }

        let price = if is_long {
            _get_min_price(index_asset)
        } else {
            _get_max_price(index_asset)
        };

        log(DecreasePosition {
            key: position_key,
            account,
            collateral_asset,
            index_asset,
            collateral_delta,
            size_delta,
            is_long,
            price,
            fee: usd_out - usd_out_after_fee,
        });

        _write_position(position_key, position);
    } else {
        if is_long {
            _increase_guaranteed_usd(collateral_asset, collateral);
            _decrease_guaranteed_usd(collateral_asset, size_delta);
        }

        let price = if is_long {
            _get_min_price(index_asset)
        } else {
            _get_max_price(index_asset)
        };

        log(DecreasePosition {
            key: position_key,
            account,
            collateral_asset,
            index_asset,
            collateral_delta,
            size_delta,
            is_long,
            price,
            fee: usd_out - usd_out_after_fee,
        });
        log(ClosePosition {
            key: position_key,
            size: position.size,
            collateral: position.collateral,
            average_price: position.average_price,
            entry_funding_rate: position.entry_funding_rate,
            reserve_amount: position.reserve_amount,
            realized_pnl: position.realized_pnl,
        });

        // remove the position from storage
        storage.positions.remove(position_key);
        log(WritePosition {
            position_key,
            position: Position::default(),
        });
        position = _get_position_by_key(position_key);
    }

    let is_short = !is_long;

    if is_short {
        _decrease_global_short_size(index_asset, size_delta);
    }

    if usd_out > 0 {
        if is_long {
            _decrease_pool_amount(collateral_asset, _usd_to_asset_min(collateral_asset, usd_out));
        }

        let amount_out_after_fees = _usd_to_asset_min(collateral_asset, usd_out_after_fee);
 
        // @TODO: potential revert here
        _transfer_out(
            collateral_asset, 
            u64::try_from(amount_out_after_fees).unwrap(), 
            receiver,
        );
        
        _write_position(position_key, position);

        return amount_out_after_fees;
    }

    0
}

#[storage(read, write)]
fn _reduce_collateral(
    account: Identity,
    collateral_asset: AssetId,
    index_asset: AssetId,
    collateral_delta: u256,
    size_delta: u256,
    is_long: bool,
) -> (u256, u256) {
    let position_key = _get_position_key(
        account,
        collateral_asset,
        index_asset,
        is_long 
    );
    let mut position = _get_position_by_key(position_key);

    let fee = _collect_margin_fees(
        account,
        collateral_asset,
        index_asset,
        is_long,
        size_delta,
        position.size,
        position.entry_funding_rate,
    );

    let (has_profit, delta) = _get_delta(
        index_asset,
        position.size,
        position.average_price,
        is_long,
        position.last_increased_time
    );

    let adjusted_delta = size_delta * delta / position.size;

    let is_short = !is_long;

    // transfer profits out
    let mut usd_out = 0;
    if adjusted_delta > 0 {
        if has_profit {
            usd_out = adjusted_delta;
            position.realized_pnl = position.realized_pnl + Signed256::from(adjusted_delta);

            // pay out realized profits from the pool amount for short positions
            if is_short {
                let token_amount = _usd_to_asset_min(collateral_asset, adjusted_delta);
                _decrease_pool_amount(collateral_asset, token_amount);
            }
        } else {
            position.collateral = position.collateral - adjusted_delta;

            // transfer realized losses to the pool for short positions
            // realized losses for long positions are not transferred here as
            // _increasePoolAmount was already called in increasePosition for longs
            if is_short {
                let token_amount = _usd_to_asset_min(collateral_asset, adjusted_delta);
                _increase_pool_amount(collateral_asset, token_amount);
            }

            position.realized_pnl = position.realized_pnl - Signed256::from(adjusted_delta);
        }
    }

    // reduce the position's collateral by _collateralDelta
    // transfer _collateralDelta out
    if collateral_delta > 0 {
        usd_out += collateral_delta;
        position.collateral = position.collateral - collateral_delta;
    }

    // if the position will be closed, then transfer the remaining collateral out
    if position.size == size_delta {
        usd_out += position.collateral;

        position.collateral = 0;
    }

    // if the usdOut is more than the fee then deduct the fee from the usdOut directly
    // else deduct the fee from the position's collateral
    let mut usd_out_after_fee = usd_out;
    if usd_out > fee {
        usd_out_after_fee = usd_out - fee;
    } else {
        // @notice: in some cases when a position is opened for too long, and when attempting to close this, collateral is ZERO (see above), so subtracting fee throws
        // an ArithmeticOverflow
        position.collateral = position.collateral - fee;
        if is_long {
            let fee_assets = _usd_to_asset_min(collateral_asset, fee);
            _decrease_pool_amount(collateral_asset, fee_assets);
        }
    }

    _write_position(position_key, position);

    log(UpdatePnl {
        key: position_key,
        has_profit,
        delta: adjusted_delta,
    });
    (usd_out, usd_out_after_fee)
}

#[storage(read, write)]
fn _liquidate_position(
    account: Identity,
    collateral_asset: AssetId,
    index_asset: AssetId,
    is_long: bool,
    fee_receiver: Identity,
) {
    require(
        !account.is_zero(),
        Error::VaultAccountCannotBeZero
    );

    require(
        storage.is_liquidator.get(get_sender()).try_read().unwrap_or(false),
        Error::VaultInvalidLiquidator
    );

    _update_cumulative_funding_rate(collateral_asset);

    let position_key = _get_position_key(
        account, 
        collateral_asset, 
        index_asset, 
        is_long
    );

    let position = _get_position_by_key(position_key);
    require(position.size > 0, Error::VaultEmptyPosition);

    let liquidation_fee_usd = storage.liquidation_fee_usd.read();

    let (liquidation_state, margin_fees) = _validate_liquidation(
        account,
        collateral_asset,
        index_asset,
        is_long,
        false 
    );
    require(
        liquidation_state != 0,
        Error::VaultCannotBeLiquidated
    );

    if liquidation_state == 2 {
        // max leverage exceeded but there is collateral remaining after deducting losses 
        // so decreasePosition instead
        let _amount_after_fees = _decrease_position(
            account,
            collateral_asset,
            index_asset,
            0,
            position.size,
            is_long,
            account,
            false,
        );
        return;
    }

    let fee_assets = _usd_to_asset_min(collateral_asset, margin_fees);
    _write_fee_reserve(
        collateral_asset, 
        _get_fee_reserves(collateral_asset) + fee_assets
    );

    log(CollectMarginFees {
        asset: collateral_asset,
        fee_usd: margin_fees,
        fee_assets,
    });

    _decrease_reserved_amount(collateral_asset, position.reserve_amount);

    if is_long {
        _decrease_guaranteed_usd(collateral_asset, position.size - position.collateral);
        _decrease_pool_amount(collateral_asset, _usd_to_asset_min(collateral_asset, margin_fees));
    }

    let mark_price = if is_long {
        _get_min_price(index_asset)
    } else {
        _get_max_price(index_asset)
    }; 

    log(LiquidatePosition {
        key: position_key,
        account,
        collateral_asset,
        index_asset,
        is_long,
        size: position.size,
        collateral: position.collateral,
        reserve_amount: position.reserve_amount,
        realized_pnl: position.realized_pnl,
        mark_price,
    });

    let is_short = !is_long;

    if is_short && margin_fees < position.collateral {
        let remaining_collateral = position.collateral - margin_fees;
        _increase_pool_amount(
            collateral_asset, 
            _usd_to_asset_min(collateral_asset, remaining_collateral)
        );
    }

    if is_short {
        _decrease_global_short_size(index_asset, position.size);
    }

    storage.positions.remove(position_key);

    // pay the fee receiver using the pool, we assume that in general the liquidated amount should be sufficient to cover
    // the liquidation fees
    _decrease_pool_amount(
        collateral_asset, 
        _usd_to_asset_min(collateral_asset, liquidation_fee_usd)
    );
    _transfer_out(
        collateral_asset, 
        // @TODO: potential revert here
        u64::try_from(_usd_to_asset_min(collateral_asset, liquidation_fee_usd)).unwrap(),
        fee_receiver,
    );
}