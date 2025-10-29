// SPDX-License-Identifier: Apache-2.0
contract;

mod events;
mod errors;

// Vault contract

use std::{
    asset::{
        burn,
        mint_to,
        transfer,
    },
    auth::msg_sender,
    block::timestamp,
    call_frames::{
        msg_asset_id,
    },
    context::*,
    math::*,
    primitive_conversions::{
        u64::*,
        u8::*,
    },
    revert::require,
    storage::storage_vec::*,
    string::String,
};
use std::hash::*;
use helpers::{reentrancy::*, signed_256::*, utils::*, zero::*};
use src3::SRC3;
use src20::{SetDecimalsEvent, SetNameEvent, SetSymbolEvent, SRC20, TotalSupplyEvent};
use core_interfaces::{
    pricefeed_wrapper::PricefeedWrapper,
    vault::{
        FundingInfo,
        Position,
        PositionKey,
        Vault,
    },
};
use pausable::{
    _is_paused as sl_is_paused,
    _pause as sl_pause,
    _unpause as sl_unpause,
    Pausable,
    require_not_paused as sl_require_not_paused,
};
use events::*;
use errors::*;

// revision of the contract
const REVISION: u8 = 6u8;
const DEFAULT_SUB_ID: SubId = SubId::zero();

const BASIS_POINTS_DIVISOR: u64 = 10_000;
const FUNDING_RATE_PRECISION: u256 = 1_000_000_000_000_000_000;
const FUNDING_RATE_FACTOR_BASE: u256 = 1_000_000_000;
const FUNDING_RATE_INTERVAL: u64 = 1; // 1 second
const FUNDING_RATE_FACTOR: u256 = 23; // 23 / 1_000_000_000 gives 2 promiles a day
const PRICE_PRECISION: u256 = 1000000000000000000u256; // 10 ** 18;
const MIN_LEVERAGE: u64 = 10_000; // 1x
const MAX_LEVERAGE: u256 = 1_000_000_000; // 100_000x
const MAX_FEE_BASIS_POINTS: u64 = 500; // 5%
const DEFAULT_LIQUIDATION_FEE: u256 = 5; // 5 USDC (without decimals)
const MAX_LIQUIDATION_FEE: u256 = 5; // 100 USDC (without decimals)
const LP_ASSET_NAME: str[18] = __to_str_array("StarBoard LP Token");
const LP_ASSET_SYMBOL: str[4] = __to_str_array("SBLP");

configurable {
    /// The stable asset used for collateral in short positions
    COLLATERAL_ASSET_ID: AssetId = AssetId::zero(),
    /// The stable asset used for collateral in short positions
    COLLATERAL_ASSET: b256 = b256::zero(),
    COLLATERAL_ASSET_DECIMALS: u32 = 0,
    /// The pricefeed provider contract used to get the price of the collateral asset
    PRICEFEED_WRAPPER: ContractId = ZERO_CONTRACT,
}

storage {
    vault {
        // gov is not restricted to an `Address` (EOA) or a `Contract` (external)
        // because this can be either a regular EOA (Address) or a Multisig (Contract)
        gov: Identity = ZERO_IDENTITY,
        is_initialized: bool = false,
        lock: bool = false,
        // Externals
        router: ContractId = ZERO_CONTRACT,
        /// ---------------------  Fees  ---------------------
        /// charged when liquidating a position
        /// denominated in collateral asset
        liquidation_fee: u256 = 0u256,
        /// charged when minting/burning LP assets
        /// helps maintain the stability of the RLP pool and discourage rapid entering and exiting.
        /// 0.3% by default
        mint_burn_fee_basis_points: u64 = 30,
        /// applied to size of leveraged positions
        /// 0.1% by default
        margin_fee_basis_points: u64 = 10,
        // Misc
        approved_routers: StorageMap<Identity, StorageMap<Identity, bool>> = StorageMap {},
        is_liquidator: StorageMap<Identity, bool> = StorageMap {},
        max_leverage: StorageMap<b256, u256> = StorageMap {},
        whitelisted_asset_count: u64 = 0,
        all_whitelisted_assets: StorageVec<b256> = StorageVec {},
        whitelisted_assets: StorageMap<b256, bool> = StorageMap {},
        asset_decimals: StorageMap<b256, u32> = StorageMap {},
        // tracks all open Positions
        positions: StorageMap<b256, Position> = StorageMap {},
        // tracks amount of fees (in collateral asset)
        fee_reserve: u256 = 0,
        // tracks the number of received tokens that can be used for leverage
        // tracked separately to exclude funds that are deposited 
        // as margin collateral
        pool_amounts: StorageMap<b256, u256> = StorageMap {},
    },
    fund {
        funding_info: StorageMap<b256, FundingInfo> = StorageMap {},
    },
    // SRC20 support - track total supply of the LP asset
    total_supply: u64 = 0,
}

impl SRC20 for Contract {
    #[storage(read)]
    fn total_assets() -> u64 {
        1
    }

    #[storage(read)]
    fn total_supply(asset: AssetId) -> Option<u64> {
        if asset == AssetId::default() {
            Some(storage.total_supply.read())
        } else {
            None
        }
    }

    #[storage(read)]
    fn name(asset: AssetId) -> Option<String> {
        if asset == AssetId::default() {
            Some(String::from_ascii_str(from_str_array(LP_ASSET_NAME)))
        } else {
            None
        }
    }

    #[storage(read)]
    fn symbol(asset: AssetId) -> Option<String> {
        if asset == AssetId::default() {
            Some(String::from_ascii_str(from_str_array(LP_ASSET_SYMBOL)))
        } else {
            None
        }
    }

    #[storage(read)]
    fn decimals(asset: AssetId) -> Option<u8> {
        if asset == AssetId::default() {
            Some(COLLATERAL_ASSET_DECIMALS.try_as_u8().unwrap_or(255))
        } else {
            None
        }
    }
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
        log(SetPaused {
            is_paused: true,
        });
    }

    #[storage(write)]
    fn unpause() {
        _only_gov();

        sl_unpause();
        log(SetPaused {
            is_paused: false,
        });
    }
}

impl Vault for Contract {
    /// Get the revision of the contract
    fn get_revision() -> u8 {
        REVISION
    }

    #[storage(read, write)]
    fn initialize(gov: Identity) {
        require(
            !storage::vault
                .is_initialized
                .read(),
            Error::VaultAlreadyInitialized,
        );
        storage::vault.is_initialized.write(true);
        storage::vault.gov.write(gov);

        if storage::vault.liquidation_fee.read() == 0 {
            // cannot initialize in the storage section because of the configurable
            storage::vault
                .liquidation_fee
                .write(DEFAULT_LIQUIDATION_FEE * (10u256.pow(COLLATERAL_ASSET_DECIMALS)));
        }

        storage.total_supply.write(0);
        let lp_asset = AssetId::default();
        let sender = msg_sender().unwrap();
        // Emit SRC20 events for LP asset
        log(SetNameEvent {
            asset: lp_asset,
            name: Some(String::from_ascii_str(from_str_array(LP_ASSET_NAME))),
            sender: sender,
        });
        log(SetSymbolEvent {
            asset: lp_asset,
            symbol: Some(String::from_ascii_str(from_str_array(LP_ASSET_SYMBOL))),
            sender: sender,
        });
        log(SetDecimalsEvent {
            asset: lp_asset,
            decimals: COLLATERAL_ASSET_DECIMALS.try_as_u8().unwrap_or(255),
            sender: sender,
        });
        log(TotalSupplyEvent {
            asset: lp_asset,
            supply: 0,
            sender: sender,
        });

        log(SetGov { gov });
    }

    // ---------------------  Admin  ---------------------
    #[storage(write)]
    fn set_gov(gov: Identity) {
        _only_gov();
        storage::vault.gov.write(gov);
        log(SetGov { gov })
    }

    #[storage(write)]
    fn set_liquidator(liquidator: Identity, is_active: bool) {
        _only_gov();
        storage::vault.is_liquidator.insert(liquidator, is_active);
        log(SetLiquidator {
            liquidator,
            is_active,
        });
    }

    #[storage(write)]
    fn set_router(router: ContractId) {
        _only_gov();
        storage::vault.router.write(router);
        log(SetRouter { router });
    }

    #[storage(read, write)]
    fn set_fees(
        mint_burn_fee_basis_points: u64,
        margin_fee_basis_points: u64,
        liquidation_fee: u256,
    ) {
        _only_gov();

        require(
            mint_burn_fee_basis_points <= MAX_FEE_BASIS_POINTS && margin_fee_basis_points <= MAX_FEE_BASIS_POINTS,
            Error::VaultInvalidFeeBasisPoints,
        );
        require(
            liquidation_fee <= MAX_LIQUIDATION_FEE * (10u256
                    .pow(COLLATERAL_ASSET_DECIMALS)),
            Error::VaultInvalidLiquidationFee,
        );

        storage::vault
            .mint_burn_fee_basis_points
            .write(mint_burn_fee_basis_points);
        storage::vault
            .margin_fee_basis_points
            .write(margin_fee_basis_points);
        storage::vault.liquidation_fee.write(liquidation_fee);

        log(SetFees {
            mint_burn_fee_basis_points,
            margin_fee_basis_points,
            liquidation_fee,
        });
    }

    /// max leverage must be multiplied by 10_000 to get actual leverage
    /// e.g: 50 * 10_000 = 50%
    #[storage(write)]
    fn set_max_leverage(asset: b256, max_leverage: u256) {
        _only_gov();
        require(max_leverage <= MAX_LEVERAGE, Error::VaultInvalidMaxLeverage);
        storage::vault.max_leverage.insert(asset, max_leverage);
        log(SetMaxLeverage {
            asset,
            max_leverage,
        });
    }

    // TODO exclude the collateral asset
    #[storage(read, write)]
    fn set_asset_config(asset: b256, asset_decimals: u32) {
        _only_gov();

        // increment token count for the first time
        if !storage::vault.whitelisted_assets.get(asset).try_read().unwrap_or(false)
        {
            storage::vault
                .whitelisted_asset_count
                .write(storage::vault.whitelisted_asset_count.read() + 1);
            storage::vault.all_whitelisted_assets.push(asset);
        }

        storage::vault.whitelisted_assets.insert(asset, true);
        storage::vault.asset_decimals.insert(asset, asset_decimals);

        log(SetAssetConfig {
            asset,
            asset_decimals,
        });
    }

    #[storage(read, write)]
    fn clear_asset_config(asset: b256) {
        _only_gov();

        require(
            storage::vault
                .whitelisted_assets
                .get(asset)
                .try_read()
                .unwrap_or(false),
            Error::VaultAssetNotWhitelisted,
        );

        storage::vault.whitelisted_assets.remove(asset);
        storage::vault.asset_decimals.remove(asset);

        storage::vault
            .whitelisted_asset_count
            .write(storage::vault.whitelisted_asset_count.read() - 1);

        log(ClearAssetConfig { asset });
    }

    #[storage(write)]
    fn set_approved_router(router: Identity, is_active: bool) {
        let account = get_sender();
        storage::vault
            .approved_routers
            .get(account)
            .insert(router, is_active);
        log(SetApprovedRouter {
            account,
            router,
            is_active,
        });
    }

    #[storage(read, write)]
    fn withdraw_fees(receiver: Identity) -> u64 {
        _only_gov();

        _withdraw_fees(receiver)
    }

    // ---------------------  View  ---------------------
    fn get_position_key(account: Identity, index_asset: b256, is_long: bool) -> b256 {
        _get_position_key(account, index_asset, is_long)
    }

    #[storage(read)]
    fn get_position_pnl(account: Identity, index_asset: b256, is_long: bool) -> (bool, u256) {
        _get_position_pnl(account, index_asset, is_long)
    }

    #[storage(read)]
    fn get_pnl(
        index_asset: b256,
        size: u256,
        average_price: u256,
        is_long: bool,
    ) -> (bool, u256) {
        _get_pnl(index_asset, size, average_price, is_long)
    }

    #[storage(read)]
    fn get_position_by_key(position_key: b256) -> Position {
        _get_position_by_key(position_key)
    }

    #[storage(read)]
    fn get_position_fee(
        account: Identity,
        index_asset: b256,
        is_long: bool,
        size_delta: u256,
    ) -> u256 {
        _get_position_fee(account, index_asset, is_long, size_delta)
    }

    #[storage(read)]
    fn get_max_price(asset: b256) -> u256 {
        _get_max_price(asset)
    }

    #[storage(read)]
    fn get_min_price(asset: b256) -> u256 {
        _get_min_price(asset)
    }

    #[storage(read)]
    fn get_pool_amounts(asset: b256) -> u256 {
        storage::vault.pool_amounts.get(asset).try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_fee_reserve() -> u256 {
        storage::vault.fee_reserve.try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_all_whitelisted_assets_length() -> u64 {
        storage::vault.all_whitelisted_assets.len()
    }

    #[storage(read)]
    fn get_whitelisted_asset_by_index(index: u64) -> b256 {
        if index >= storage::vault.all_whitelisted_assets.len() {
            return b256::zero();
        }

        storage::vault.all_whitelisted_assets.get(index).unwrap().read()
    }

    #[storage(read)]
    fn is_asset_whitelisted(asset: b256) -> bool {
        _is_asset_whitelisted(asset)
    }

    #[storage(read)]
    fn get_asset_decimals(asset: b256) -> u32 {
        storage::vault.asset_decimals.get(asset).try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_collateral_asset() -> AssetId {
        COLLATERAL_ASSET_ID
    }

    fn get_lp_asset() -> AssetId {
        AssetId::default()
    }

    #[storage(read)]
    fn get_position_leverage(account: Identity, index_asset: b256, is_long: bool) -> u256 {
        let position_key = _get_position_key(account, index_asset, is_long);
        let position = _get_position_by_key(position_key);
        require(position.collateral > 0, Error::VaultInvalidPosition);

        position.size * BASIS_POINTS_DIVISOR.as_u256() / position.collateral
    }

    #[storage(read)]
    fn get_fee_basis_points(
        asset: b256,
        lp_asset_delta: u256,
        fee_basis_points: u256,
        increment: bool,
    ) -> u256 {
        fee_basis_points
    }

    #[storage(read)]
    fn get_liquidation_fee() -> u256 {
        storage::vault.liquidation_fee.read()
    }

    #[storage(read)]
    fn get_mint_burn_fee_basis_points() -> u64 {
        storage::vault.mint_burn_fee_basis_points.read()
    }

    #[storage(read)]
    fn get_margin_fee_basis_points() -> u64 {
        storage::vault.margin_fee_basis_points.read()
    }

    #[storage(read)]
    fn is_liquidator(account: Identity) -> bool {
        storage::vault.is_liquidator.get(account).try_read().unwrap_or(false)
    }

    #[storage(read)]
    fn validate_liquidation(
        account: Identity,
        index_asset: b256,
        is_long: bool,
        should_raise: bool,
    ) -> (u256, u256) {
        _validate_liquidation(account, index_asset, is_long, should_raise)
    }

    #[storage(read)]
    fn get_add_liquidity_amount(asset_amount: u64) -> (u64, u64, u64) {
        _get_add_liquidity_amount(asset_amount)
    }

    #[storage(read)]
    fn get_remove_liquidity_amount(lp_asset_amount: u64) -> (u64, u64, u64) {
        _get_remove_liquidity_amount(lp_asset_amount)
    }

    #[storage(read)]
    fn get_funding_info(asset: b256) -> FundingInfo {
        _get_funding_info(asset)
    }

    // ---------------------  Public  ---------------------
    #[payable]
    #[storage(read, write)]
    fn add_liquidity(receiver: Identity) -> u64 {
        sl_require_not_paused();

        _begin_non_reentrant(storage::vault.lock);

        let amount_out = _add_liquidity(receiver);
        _end_non_reentrant(storage::vault.lock);

        amount_out
    }

    #[payable]
    #[storage(read, write)]
    fn remove_liquidity(receiver: Identity) -> u64 {
        sl_require_not_paused();

        _begin_non_reentrant(storage::vault.lock);

        let amount_out = _remove_liquidity(receiver);
        _end_non_reentrant(storage::vault.lock);

        amount_out
    }

    // returns the position's collateral after the update and fees, and the current price
    #[payable]
    #[storage(read, write)]
    fn increase_position(
        account: Identity,
        index_asset: b256,
        size_delta: u256,
        is_long: bool,
    ) -> (u256, u256) {
        sl_require_not_paused();

        _begin_non_reentrant(storage::vault.lock);

        let (new_collateral, price) = _increase_position(account, index_asset, size_delta, is_long);

        _end_non_reentrant(storage::vault.lock);
        (new_collateral, price)
    }

    // returns the position's collateral after the update and fees, the current price, 
    // and the collateral paid out to the receiver
    #[storage(read, write)]
    fn decrease_position(
        account: Identity,
        index_asset: b256,
        collateral_delta: u256,
        size_delta: u256,
        is_long: bool,
        receiver: Identity,
    ) -> (u256, u256, u256) {
        sl_require_not_paused();

        _begin_non_reentrant(storage::vault.lock);

        _validate_router(account);
        let (new_collateral, price, paid_out_collateral) = _decrease_position(
            account,
            index_asset,
            collateral_delta,
            size_delta,
            is_long,
            receiver,
        );

        _end_non_reentrant(storage::vault.lock);
        (new_collateral, price, paid_out_collateral)
    }

    #[storage(read, write)]
    fn liquidate_position(
        account: Identity,
        index_asset: b256,
        is_long: bool,
        fee_receiver: Identity,
    ) {
        sl_require_not_paused();

        _begin_non_reentrant(storage::vault.lock);

        _liquidate_position(account, index_asset, is_long, fee_receiver);

        _end_non_reentrant(storage::vault.lock);
    }
}

// ---------------------  Internal  ---------------------

#[storage(read)]
fn _only_gov() {
    require(
        get_sender() == storage::vault
            .gov
            .read(),
        Error::VaultForbiddenNotGov,
    );
}

fn _transfer_in(asset: AssetId) -> u64 {
    require(msg_asset_id() == asset, Error::VaultInvalidAssetForwarded);
    msg_amount()
}

fn _transfer_out(asset: AssetId, amount: u64, receiver: Identity) {
    transfer(receiver, asset, amount);
}

#[storage(write)]
fn _write_position(position_key: b256, position: Position) {
    storage::vault.positions.insert(position_key, position);
    log(WritePosition {
        position_key,
        position,
    });
}

#[storage(write)]
fn _write_fee_reserve(fee_reserve: u256) {
    storage::vault.fee_reserve.write(fee_reserve);
    log(WriteFeeReserve { fee_reserve });
}

//TODO: add overflow check
fn _get_after_fee_amount(amount: u64, fee_basis_points: u64) -> u64 {
    amount * (BASIS_POINTS_DIVISOR - fee_basis_points) / BASIS_POINTS_DIVISOR
}

#[storage(read, write)]
fn _collect_swap_fees(amount: u64, after_fee_amount: u64) {
    let fee_amount = amount - after_fee_amount;

    let fee_reserve = _get_fee_reserve();
    _write_fee_reserve(fee_reserve + fee_amount.as_u256());

    log(CollectSwapFees { fee_amount });
}

/// price in the usd
/// max/min prices express the spread, to be provided in the future
#[storage(read)]
fn _get_max_price(asset: b256) -> u256 {
    let pricefeed_wrapper = abi(PricefeedWrapper, PRICEFEED_WRAPPER.bits());
    let collateral_asset_price = pricefeed_wrapper.price(COLLATERAL_ASSET);
    let asset_price = pricefeed_wrapper.price(asset);
    // TODO overflow check
    asset_price * PRICE_PRECISION / collateral_asset_price
}

/// price in the usd
/// max/min prices express the spread, to be provided in the future
#[storage(read)]
fn _get_min_price(asset: b256) -> u256 {
    let pricefeed_wrapper = abi(PricefeedWrapper, PRICEFEED_WRAPPER.bits());
    let collateral_asset_price = pricefeed_wrapper.price(COLLATERAL_ASSET);
    let asset_price = pricefeed_wrapper.price(asset);
    // TODO overflow check
    asset_price * PRICE_PRECISION / collateral_asset_price
}

#[storage(read)]
fn _is_asset_whitelisted(asset: b256) -> bool {
    storage::vault.whitelisted_assets.get(asset).try_read().unwrap_or(false)
}

#[storage(read)]
fn _get_position_by_key(position_key: b256) -> Position {
    storage::vault.positions.get(position_key).try_read().unwrap_or(Position::default())
}

#[storage(read)]
fn _get_pool_amounts(asset: b256) -> u256 {
    storage::vault.pool_amounts.get(asset).try_read().unwrap_or(0)
}

#[storage(read)]
fn _get_fee_reserve() -> u256 {
    storage::vault.fee_reserve.try_read().unwrap_or(0)
}

fn _get_position_key(account: Identity, index_asset: b256, is_long: bool) -> b256 {
    keccak256(PositionKey {
        account,
        index_asset,
        is_long,
    })
}

#[storage(read)]
fn _validate_liquidation(
    account: Identity,
    index_asset: b256,
    is_long: bool,
    should_raise: bool,
) -> (u256, u256) {
    let position_key = _get_position_key(account, index_asset, is_long);

    let position = _get_position_by_key(position_key);

    let position_fee = _get_position_fee(account, index_asset, is_long, position.size);

    let (has_profit, pnl_delta) = _get_pnl(index_asset, position.size, position.average_price, is_long);

    let (funding_rate, funding_rate_has_profit) = _calculate_funding_rate(
        index_asset,
        position
            .size,
        is_long,
        position
            .cumulative_funding_rate,
    );

    let mut available_collateral = position.collateral;
    // does not include liquidation fee
    let mut losses_and_fees = position_fee;

    if has_profit {
        available_collateral = available_collateral + pnl_delta;
    } else {
        losses_and_fees = losses_and_fees + pnl_delta;
    }

    if funding_rate_has_profit {
        available_collateral = available_collateral + funding_rate;
    } else {
        losses_and_fees = losses_and_fees + funding_rate;
    }

    if losses_and_fees > available_collateral {
        if should_raise {
            require(false, Error::VaultLossesExceedCollateral); // TODO good error message?
        }
        return (1, 0);
    }

    let remaining_collateral = available_collateral - losses_and_fees;
    let max_leverage = storage::vault.max_leverage.get(index_asset).try_read().unwrap_or(0);
    let val1 = remaining_collateral * max_leverage;
    let val2 = position.size * BASIS_POINTS_DIVISOR.as_u256();
    if val1 < val2 {
        if should_raise {
            require(false, Error::VaultMaxLeverageExceeded);
        }
        return (2, remaining_collateral);
    }

    return (0, remaining_collateral);
}

#[storage(read)]
fn _get_pnl(
    index_asset: b256,
    size: u256,
    average_price: u256,
    is_long: bool,
) -> (bool, u256) {
    require(average_price > 0, Error::VaultInvalidAveragePrice);

    let price = if is_long {
        _get_min_price(index_asset)
    } else {
        _get_max_price(index_asset)
    };

    let (has_profit, price_delta) = if price > average_price {
        (is_long, price - average_price)
    } else {
        (!is_long, average_price - price)
    };

    // TODO overflow check
    let delta = size * price_delta / average_price;
    (has_profit, delta)
}

#[storage(read)]
fn _get_position_fee(
    _account: Identity,
    _index_asset: b256,
    _is_long: bool,
    size_delta: u256,
) -> u256 {
    if size_delta == 0 {
        return 0;
    }

    let margin_fee_basis_points = storage::vault.margin_fee_basis_points.try_read().unwrap_or(0).as_u256();

    size_delta * margin_fee_basis_points / BASIS_POINTS_DIVISOR.as_u256()
}

#[storage(read)]
fn _get_position_pnl(account: Identity, index_asset: b256, is_long: bool) -> (bool, u256) {
    let position_key = _get_position_key(account, index_asset, is_long);

    let position = _get_position_by_key(position_key);

    _get_pnl(index_asset, position.size, position.average_price, is_long)
}

#[storage(read, write)]
fn _increase_pool_amount(amount: u256) {
    let asset = COLLATERAL_ASSET;
    let new_pool_amount = _get_pool_amounts(asset) + amount;
    storage::vault.pool_amounts.insert(asset, new_pool_amount);
    log(WritePoolAmount {
        asset,
        pool_amount: new_pool_amount,
    });

    let balance = balance_of(ContractId::this(), COLLATERAL_ASSET_ID);

    require(
        new_pool_amount <= balance
            .as_u256(),
        Error::VaultInvalidIncrease,
    );
}

#[storage(read, write)]
fn _decrease_pool_amount(amount: u256) {
    let asset = COLLATERAL_ASSET;
    let pool_amount = _get_pool_amounts(asset);
    require(pool_amount >= amount, Error::VaultPoolAmountExceeded);

    let new_pool_amount = pool_amount - amount;
    storage::vault.pool_amounts.insert(asset, new_pool_amount);
    log(WritePoolAmount {
        asset,
        pool_amount: new_pool_amount,
    });
}

#[storage(read)]
fn _validate_router(account: Identity) {
    let sender = get_sender();

    if sender == account
        || sender == Identity::ContractId(storage::vault.router.read())
    {
        return;
    }

    require(
        storage::vault
            .approved_routers
            .get(account)
            .get(sender)
            .try_read()
            .unwrap_or(false),
        Error::VaultInvalidMsgCaller,
    );
}

fn _validate_position(size: u256, collateral: u256) {
    if size == 0 {
        require(collateral == 0, Error::VaultCollateralShouldBeWithdrawn);
        return;
    }

    require(size >= collateral, Error::VaultSizeMustBeMoreThanCollateral);
}

// calculates the next average price for a position
// that is the weighted average of prices at the time of position increase with size coefficient
// in other words this is the average price that assets are bought or sold at
// for longs:  next_average_price = (next_price * next_size) / (next_size + delta)
// for shorts: next_average_price = (next_price * next_size) / (next_size - delta)
#[storage(read)]
fn _get_next_average_price(
    index_asset: b256,
    size: u256,
    average_price: u256,
    is_long: bool,
    next_price: u256,
    size_delta: u256,
) -> u256 {
    let (has_profit, delta) = _get_pnl(index_asset, size, average_price, is_long);

    let next_size = size + size_delta;
    let divisor = if is_long {
        if has_profit {
            next_size + delta
        } else {
            next_size - delta
        }
    } else {
        if has_profit {
            next_size - delta
        } else {
            next_size + delta
        }
    };

    next_price * next_size / divisor
}

#[storage(read, write)]
fn _collect_position_fee(
    account: Identity,
    index_asset: b256,
    is_long: bool,
    size_delta: u256,
) -> u256 {
    let position_fee = _get_position_fee(account, index_asset, is_long, size_delta);

    let new_fee_reserve = _get_fee_reserve() + position_fee;
    _write_fee_reserve(new_fee_reserve);

    position_fee
}

#[storage(read, write)]
fn _withdraw_fees(receiver: Identity) -> u64 {
    let amount = u64::try_from(_get_fee_reserve()).unwrap();
    if amount == 0 {
        return 0;
    }

    storage::vault.fee_reserve.write(0);

    _transfer_out(
        COLLATERAL_ASSET_ID,
        u64::try_from(amount)
            .unwrap(),
        receiver,
    );

    log(WithdrawFees {
        receiver,
        amount,
    });

    amount
}

#[storage(read)]
fn _get_add_liquidity_amount(asset_amount: u64) -> (u64, u64, u64) {
    let fee_basis_points = storage::vault.mint_burn_fee_basis_points.try_read().unwrap_or(0);

    let amount_after_fees = _get_after_fee_amount(asset_amount, fee_basis_points);

    //TODO: it is 1:1 lp assets to collateral assets now
    let mint_amount = amount_after_fees;
    (mint_amount, amount_after_fees, fee_basis_points)
}

#[storage(read, write)]
fn _add_liquidity(receiver: Identity) -> u64 {
    require(!receiver.is_zero(), Error::VaultReceiverCannotBeZero);

    let asset_amount = _transfer_in(COLLATERAL_ASSET_ID);
    require(asset_amount > 0, Error::VaultInvalidAssetAmount);

    let (mint_amount, amount_after_fees, fee_basis_points) = _get_add_liquidity_amount(asset_amount);
    // this needs to be called here because _get_add_liquidity_amount is read-only and cannot update state
    _collect_swap_fees(asset_amount, amount_after_fees);

    _increase_pool_amount(amount_after_fees.as_u256());

    // TODO does it make sense?
    // require amount to be less than u64::max
    require(
        mint_amount < u64::max(),
        Error::VaultInvalidMintAmountGtU64Max,
    );
    require(mint_amount > 0, "mint_amount is 0");

    let new_supply = mint_amount + storage.total_supply.read();
    storage.total_supply.write(new_supply);

    mint_to(receiver, DEFAULT_SUB_ID, mint_amount);

    log(TotalSupplyEvent {
        asset: AssetId::default(),
        supply: new_supply,
        sender: msg_sender().unwrap(),
    });

    log(AddLiquidity {
        account: receiver,
        stable_asset_amount: asset_amount,
        lp_asset_amount: mint_amount,
        fee_basis_points,
    });

    mint_amount
}

#[storage(read)]
fn _get_remove_liquidity_amount(lp_asset_amount: u64) -> (u64, u64, u64) {
    //TODO: it is 1:1 lp assets to collateral assets now
    let redemption_amount = lp_asset_amount;

    require(redemption_amount > 0, Error::VaultInvalidRedemptionAmount);

    let fee_basis_points = storage::vault.mint_burn_fee_basis_points.try_read().unwrap_or(0);

    let amount_out = _get_after_fee_amount(redemption_amount, fee_basis_points);
    require(amount_out > 0, Error::VaultInvalidAmountOut);
    (redemption_amount, amount_out, fee_basis_points)
}

#[storage(read, write)]
fn _remove_liquidity(receiver: Identity) -> u64 {
    require(!receiver.is_zero(), Error::VaultReceiverCannotBeZero);

    let lp_asset_amount = _transfer_in(AssetId::default());
    require(lp_asset_amount > 0, Error::VaultInvalidRusdAmount);

    // TODO does it make sense?
    // require amount to be less than u64::max
    require(
        lp_asset_amount < u64::max(),
        Error::VaultInvalidRUSDBurnAmountGtU64Max,
    );

    let (redemption_amount, amount_out, fee_basis_points) = _get_remove_liquidity_amount(lp_asset_amount);
    // this needs to be called here because _get_remove_liquidity_amount is read-only and cannot update state
    _collect_swap_fees(redemption_amount, amount_out);
    require(amount_out > 0, Error::VaultInvalidAmountOut);

    _decrease_pool_amount(redemption_amount.as_u256());

    let burn_amount_u64 = u64::try_from(lp_asset_amount).unwrap();
    let new_supply = storage.total_supply.read() - burn_amount_u64;
    storage.total_supply.write(new_supply);
    burn(DEFAULT_SUB_ID, burn_amount_u64);
    log(TotalSupplyEvent {
        asset: AssetId::default(),
        supply: new_supply,
        sender: msg_sender().unwrap(),
    });

    log(RemoveLiquidity {
        account: receiver,
        stable_asset_amount: amount_out,
        lp_asset_amount: burn_amount_u64,
        fee_basis_points,
    });

    _transfer_out(COLLATERAL_ASSET_ID, amount_out, receiver);

    amount_out
}

#[storage(read, write)]
fn _increase_position(
    account: Identity,
    index_asset: b256,
    size_delta: u256,
    is_long: bool,
) -> (u256, u256) {
    require(!account.is_zero(), Error::VaultAccountCannotBeZero);

    _validate_router(account);

    require(
        index_asset != COLLATERAL_ASSET,
        Error::VaultShortIndexAssetMustNotBeStableAsset,
    );
    require(
        _is_asset_whitelisted(index_asset),
        Error::VaultAssetNotWhitelisted,
    );

    let position_key = _get_position_key(account, index_asset, is_long);

    let mut position = _get_position_by_key(position_key);

    require(
        position
            .size > 0 || size_delta > 0,
        Error::VaultInvalidPositionSize,
    );

    if position.size == 0 {
        // position is brand new, so register map[position_key] => position for off-chain indexer
        log(RegisterPositionByKey {
            position_key,
            account,
            index_asset,
            is_long,
        });
    }

    let price = if is_long {
        _get_max_price(index_asset)
    } else {
        _get_min_price(index_asset)
    };

    position.average_price = if position.size == 0 {
        price
    } else if size_delta == 0 {
        position.average_price
    } else {
        _get_next_average_price(
            index_asset,
            position
                .size,
            position
                .average_price,
            is_long,
            price,
            size_delta,
        )
    };

    let position_fee = _collect_position_fee(account, index_asset, is_long, size_delta);

    let (funding_rate, funding_rate_has_profit) = _calculate_funding_rate(
        index_asset,
        position
            .size,
        is_long,
        position
            .cumulative_funding_rate,
    );

    // TODO make collateral u64?
    let collateral_delta = _transfer_in(COLLATERAL_ASSET_ID).as_u256();

    position.collateral = position.collateral + collateral_delta;

    if funding_rate_has_profit {
        // TODO in some crazy situations funding rate can be greater than the total supply of collateral asset
        position.collateral = position.collateral + funding_rate;
    } else {
        require(
            position
                .collateral >= funding_rate,
            Error::VaultInsufficientCollateralForFees,
        );
        position.collateral = position.collateral - funding_rate;
    }

    require(
        position
            .collateral >= position_fee,
        Error::VaultInsufficientCollateralForFees,
    );
    position.collateral = position.collateral - position_fee;

    position.size = position.size + size_delta;

    position.last_increased_time = timestamp();

    // TODO collateral may be high because of funding rate, maybe excess should be returned to the user?
    require(
        position
            .size >= position
            .collateral,
        Error::VaultSizeMustBeMoreThanCollateral,
    );

    // we need to have a storage write here because _validate_liquidation re-constructs the position key and 
    // validates the average_price. If not for this position write, it would receive a stale avg price (could be 0)
    let new_cumulative_funding_rate = _increase_and_update_funding_info(index_asset, size_delta, is_long);

    position.cumulative_funding_rate = new_cumulative_funding_rate;

    _write_position(position_key, position);

    let (_liquidation_state, _left_collateral) = _validate_liquidation(account, index_asset, is_long, true);

    log(IncreasePosition {
        key: position_key,
        account,
        index_asset,
        is_long,
        collateral_delta,
        size_delta,
        price,
        average_price: position.average_price,
        position_fee,
        funding_rate,
        funding_rate_has_profit,
        cumulative_funding_rate: new_cumulative_funding_rate,
    });
    (position.collateral, price)
}

#[storage(read, write)]
fn _decrease_position(
    account: Identity,
    index_asset: b256,
    collateral_delta: u256,
    size_delta: u256,
    is_long: bool,
    receiver: Identity,
) -> (u256, u256, u256) {
    require(!account.is_zero(), Error::VaultAccountCannotBeZero);

    let position_key = _get_position_key(account, index_asset, is_long);

    let mut position = _get_position_by_key(position_key);

    require(position.size > 0, Error::VaultEmptyPosition);
    require(position.size >= size_delta, Error::VaultSizeExceeded);
    require(
        position
            .collateral >= collateral_delta,
        Error::VaultCollateralExceeded,
    );

    let position_fee = _collect_position_fee(account, index_asset, is_long, size_delta);

    let (has_profit, pnl_delta) = _get_pnl(index_asset, size_delta, position.average_price, is_long);

    let (funding_rate, funding_rate_has_profit) = _calculate_funding_rate(
        index_asset,
        position
            .size,
        is_long,
        position
            .cumulative_funding_rate,
    );

    if pnl_delta > 0 {
        if has_profit {
            position.realized_pnl = position.realized_pnl + Signed256::from(pnl_delta);
        } else {
            position.realized_pnl = position.realized_pnl - Signed256::from(pnl_delta);
        }
    }
    log(UpdatePnl {
        key: position_key,
        has_profit,
        delta: pnl_delta,
    });

    let mut adjusted_collateral = position.collateral;

    // first add, then subtract
    if has_profit {
        // TODO it an extreme case it may overflow
        adjusted_collateral = adjusted_collateral + pnl_delta;
    }

    if funding_rate_has_profit {
        adjusted_collateral = adjusted_collateral + funding_rate;
    }

    require(
        adjusted_collateral >= position_fee,
        Error::VaultInsufficientCollateralForFees,
    );
    adjusted_collateral = adjusted_collateral - position_fee;

    if !has_profit {
        require(
            adjusted_collateral >= pnl_delta,
            Error::VaultInsufficientCollateralForFees, // TODO good error message?
        );
        adjusted_collateral = adjusted_collateral - pnl_delta;
    }

    if !funding_rate_has_profit {
        require(
            adjusted_collateral >= funding_rate,
            Error::VaultInsufficientCollateralForFees, // TODO good error message?
        );
        adjusted_collateral = adjusted_collateral - funding_rate;
    }

    let mut collateral_out_after_fee = 0;
    if position.size == size_delta {
        collateral_out_after_fee = adjusted_collateral;
        position.collateral = 0;
    } else if adjusted_collateral > position.collateral - collateral_delta
    {
        collateral_out_after_fee = adjusted_collateral - (position.collateral - collateral_delta);
        position.collateral = position.collateral - collateral_delta;
    } else {
        collateral_out_after_fee = 0;
        position.collateral = adjusted_collateral;
    }

    let new_cumulative_funding_rate = _decrease_and_update_funding_info(index_asset, size_delta, is_long);

    let price = if is_long {
        _get_min_price(index_asset)
    } else {
        _get_max_price(index_asset)
    };

    if position.size != size_delta {
        position.size = position.size - size_delta;

        position.last_increased_time = timestamp();

        position.cumulative_funding_rate = new_cumulative_funding_rate;

        _validate_position(position.size, position.collateral);

        // update storage because the above changes are ignored by call to other fn `validate_liquidation`
        // we need to have a storage write here because _validate_liquidation re-constructs the position key and 
        // validates the max_leverage. If not for this position write, it would receive an incorrect max_leverage error
        _write_position(position_key, position);

        let (_liquidation_state, _left_collateral) = _validate_liquidation(account, index_asset, is_long, true);

        log(DecreasePosition {
            key: position_key,
            account,
            index_asset,
            is_long,
            collateral_delta,
            size_delta,
            price,
            average_price: position.average_price,
            position_fee,
            funding_rate,
            funding_rate_has_profit,
            cumulative_funding_rate: new_cumulative_funding_rate,
        });
    } else {
        log(DecreasePosition {
            key: position_key,
            account,
            index_asset,
            is_long,
            collateral_delta,
            size_delta,
            price,
            average_price: position.average_price,
            position_fee,
            funding_rate,
            funding_rate_has_profit,
            cumulative_funding_rate: new_cumulative_funding_rate,
        });
        log(ClosePosition {
            key: position_key,
            realized_pnl: position.realized_pnl,
        });

        // remove the position from storage
        storage::vault.positions.remove(position_key);
        log(WritePosition {
            position_key,
            position: Position::default(),
        });
    }

    if collateral_out_after_fee > 0 {
        // @TODO: potential revert here
        _transfer_out(
            COLLATERAL_ASSET_ID,
            u64::try_from(collateral_out_after_fee)
                .unwrap(),
            receiver,
        );
    }
    (position.collateral, price, collateral_out_after_fee)
}

#[storage(read, write)]
fn _liquidate_position(
    account: Identity,
    index_asset: b256,
    is_long: bool,
    fee_receiver: Identity,
) {
    require(!account.is_zero(), Error::VaultAccountCannotBeZero);

    require(
        storage::vault
            .is_liquidator
            .get(get_sender())
            .try_read()
            .unwrap_or(false),
        Error::VaultInvalidLiquidator,
    );

    let position_key = _get_position_key(account, index_asset, is_long);

    let position = _get_position_by_key(position_key);

    require(position.size > 0, Error::VaultEmptyPosition);

    let (liquidation_state, _left_collateral) = _validate_liquidation(account, index_asset, is_long, false);
    require(liquidation_state != 0, Error::VaultCannotBeLiquidated);

    if liquidation_state == 2 {
        // max leverage exceeded but there is collateral remaining after deducting losses 
        // so decreasePosition instead
        _decrease_position(account, index_asset, 0, position.size, is_long, account);
        // TODO liquidation event should be logged
        return;
    }

    let mut position_fee = _get_position_fee(account, index_asset, is_long, position.size);

    let (mut has_profit, mut pnl_delta) = _get_pnl(index_asset, position.size, position.average_price, is_long);

    let (mut funding_rate, mut funding_rate_has_profit) = _calculate_funding_rate(
        index_asset,
        position
            .size,
        is_long,
        position
            .cumulative_funding_rate,
    );

    let mut liquidation_fee = storage::vault.liquidation_fee.try_read().unwrap_or(0);

    // recalculate losses and fees
    // in the order of priority
    let mut available_collateral = position.collateral;

    if funding_rate_has_profit {
        available_collateral = available_collateral + funding_rate;
    }

    if has_profit {
        available_collateral = available_collateral + pnl_delta;
    }

    if !funding_rate_has_profit {
        if available_collateral < funding_rate {
            funding_rate = available_collateral;
            available_collateral = 0;
        } else {
            available_collateral = available_collateral - funding_rate;
        }
    }

    if available_collateral < liquidation_fee {
        liquidation_fee = available_collateral;
        available_collateral = 0;
    } else {
        available_collateral = available_collateral - liquidation_fee;
    }

    if !has_profit {
        if available_collateral < pnl_delta {
            pnl_delta = available_collateral;
            available_collateral = 0;
        } else {
            available_collateral = available_collateral - pnl_delta;
        }
    }

    if available_collateral < position_fee {
        position_fee = available_collateral;
        available_collateral = 0;
    } else {
        available_collateral = available_collateral - position_fee;
    }

    // TODO should we handle somehow the funding rate?
    log(UpdatePnl {
        key: position_key,
        has_profit,
        delta: pnl_delta,
    });

    if position_fee > 0 {
        let new_fee_reserve = _get_fee_reserve() + position_fee;
        _write_fee_reserve(new_fee_reserve);
    }

    let new_cumulative_funding_rate = _decrease_and_update_funding_info(index_asset, position.size, is_long);

    let mark_price = if is_long {
        _get_min_price(index_asset)
    } else {
        _get_max_price(index_asset)
    };
    log(LiquidatePosition {
        key: position_key,
        account,
        index_asset,
        is_long,
        collateral: position.collateral,
        size: position.size,
        mark_price,
        position_fee,
        funding_rate,
        funding_rate_has_profit,
        cumulative_funding_rate: new_cumulative_funding_rate,
    });

    storage::vault.positions.remove(position_key);

    // pay the fee receiver using the pool
    if liquidation_fee > 0 {
        _transfer_out(
            COLLATERAL_ASSET_ID,
            // @TODO: potential revert here
            u64::try_from(liquidation_fee)
                .unwrap(),
            fee_receiver,
        );
    }
}

/// `long_cumulative_funding_rate` and `short_cumulative_funding_rate`
/// are aggregated over time since the market creation (in seconds)
/// per one asset (per one token of the asset)
/// with the precision of `FUNDING_RATE_PRECISION`,
/// the starting value is `2**255`,
/// if the cumulative funding rate increases, the positions pays funding rate to the other side,
/// if the cumulative funding rate decreases, the positions receives funding rate from the other side.
#[storage(read)]
fn _get_funding_info(asset: b256) -> FundingInfo {
    storage::fund.funding_info.get(asset).try_read().unwrap_or(FundingInfo {
        total_short_sizes: 0,
        total_long_sizes: 0,
        long_cumulative_funding_rate: 2u256 ** 255, // zero for signed simulating
        short_cumulative_funding_rate: 2u256 ** 255, // zero for signed simulating
        last_funding_time: 0,
    })
}

/// returns funding rate and whether the position has profit
#[storage(read)]
fn _calculate_funding_rate(
    asset: b256,
    position_size: u256,
    is_long: bool,
    position_cumulative_funding_rate: u256,
) -> (u256, bool) {
    let funding_info = storage::fund.funding_info.get(asset).try_read();
    let funding_info = match funding_info {
        Some(funding_info) => funding_info,
        None => return (0, true),
    };
    let now = timestamp();
    let (current_long_cumulative_funding_rate, current_short_cumulative_funding_rate) = _calculate_cumulative_funding_rate(funding_info, now);

    let (has_profit, funding_rate_with_precision) = if (is_long) {
        if (current_long_cumulative_funding_rate > position_cumulative_funding_rate)
        {
            (false, current_long_cumulative_funding_rate - position_cumulative_funding_rate)
        } else {
            (true, position_cumulative_funding_rate - current_long_cumulative_funding_rate)
        }
    } else {
        if (current_short_cumulative_funding_rate > position_cumulative_funding_rate)
        {
            (
                false,
                current_short_cumulative_funding_rate - position_cumulative_funding_rate,
            )
        } else {
            (true, position_cumulative_funding_rate - current_short_cumulative_funding_rate)
        }
    };
    if has_profit {
        // round down if the position has profit
        (funding_rate_with_precision * position_size / FUNDING_RATE_PRECISION, true)
    } else {
        // round up if the position has losses
        (
            (funding_rate_with_precision * position_size + FUNDING_RATE_PRECISION - 1) / FUNDING_RATE_PRECISION,
            false,
        )
    }
}

#[storage(read, write)]
fn _increase_and_update_funding_info(asset: b256, size: u256, is_long: bool) -> u256 {
    let mut funding_info = _get_funding_info(asset);
    let now = timestamp();
    // calculate new cumulative funding rate before modifying funding info
    if (funding_info.last_funding_time > 0) {
        let (long_cumulative_funding_rate, short_cumulative_funding_rate) = _calculate_cumulative_funding_rate(funding_info, now);
        funding_info.long_cumulative_funding_rate = long_cumulative_funding_rate;
        funding_info.short_cumulative_funding_rate = short_cumulative_funding_rate;
    }
    if (is_long) {
        funding_info.total_long_sizes = funding_info.total_long_sizes + size;
    } else {
        funding_info.total_short_sizes = funding_info.total_short_sizes + size;
    }
    funding_info.last_funding_time = now;
    storage::fund.funding_info.insert(asset, funding_info);
    log(UpdateFundingInfo {
        asset,
        total_short_sizes: funding_info.total_short_sizes,
        total_long_sizes: funding_info.total_long_sizes,
        long_cumulative_funding_rate: funding_info.long_cumulative_funding_rate,
        short_cumulative_funding_rate: funding_info.short_cumulative_funding_rate,
    });
    if is_long {
        funding_info.long_cumulative_funding_rate
    } else {
        funding_info.short_cumulative_funding_rate
    }
}

#[storage(read, write)]
fn _decrease_and_update_funding_info(asset: b256, size: u256, is_long: bool) -> u256 {
    let mut funding_info = _get_funding_info(asset);
    let now = timestamp();
    // calculate new cumulative funding rate before modifying funding info
    if (funding_info.last_funding_time > 0) {
        let (long_cumulative_funding_rate, short_cumulative_funding_rate) = _calculate_cumulative_funding_rate(funding_info, now);
        funding_info.long_cumulative_funding_rate = long_cumulative_funding_rate;
        funding_info.short_cumulative_funding_rate = short_cumulative_funding_rate;
    }
    // TODO underflow check
    if (is_long) {
        funding_info.total_long_sizes = funding_info.total_long_sizes - size;
    } else {
        funding_info.total_short_sizes = funding_info.total_short_sizes - size;
    }
    funding_info.last_funding_time = now;
    storage::fund.funding_info.insert(asset, funding_info);
    log(UpdateFundingInfo {
        asset,
        total_short_sizes: funding_info.total_short_sizes,
        total_long_sizes: funding_info.total_long_sizes,
        long_cumulative_funding_rate: funding_info.long_cumulative_funding_rate,
        short_cumulative_funding_rate: funding_info.short_cumulative_funding_rate,
    });
    if is_long {
        funding_info.long_cumulative_funding_rate
    } else {
        funding_info.short_cumulative_funding_rate
    }
}

#[storage(read, write)]
fn _update_funding_info(asset: b256) {
    let mut funding_info = _get_funding_info(asset);
    let now = timestamp();
    // calculate new cumulative funding rate before modifying funding info
    if (funding_info.last_funding_time > 0) {
        let (long_cumulative_funding_rate, short_cumulative_funding_rate) = _calculate_cumulative_funding_rate(funding_info, now);
        funding_info.long_cumulative_funding_rate = long_cumulative_funding_rate;
        funding_info.short_cumulative_funding_rate = short_cumulative_funding_rate;
    }
    funding_info.last_funding_time = now;
    storage::fund.funding_info.insert(asset, funding_info);
    log(UpdateFundingInfo {
        asset,
        total_short_sizes: funding_info.total_short_sizes,
        total_long_sizes: funding_info.total_long_sizes,
        long_cumulative_funding_rate: funding_info.long_cumulative_funding_rate,
        short_cumulative_funding_rate: funding_info.short_cumulative_funding_rate,
    });
}

/// returns new longs and shorts cumulative funding rates
fn _calculate_cumulative_funding_rate(funding_info: FundingInfo, now: u64) -> (u256, u256) {
    let time_delta = (now - funding_info.last_funding_time).as_u256();
    // from_long means that longs are in excess and pay shorts
    let (from_long, size_delta) = if funding_info.total_long_sizes > funding_info.total_short_sizes
    {
        (true, funding_info.total_long_sizes - funding_info.total_short_sizes)
    } else {
        (false, funding_info.total_short_sizes - funding_info.total_long_sizes)
    };
    let total_funding_rate_delta = time_delta * size_delta * FUNDING_RATE_PRECISION * FUNDING_RATE_FACTOR / FUNDING_RATE_FACTOR_BASE;
    let long_cumulative_funding_rate_delta = if funding_info.total_long_sizes == 0 {
        0
    } else {
        total_funding_rate_delta / funding_info.total_long_sizes
    };
    let short_cumulative_funding_rate_delta = if funding_info.total_short_sizes == 0 {
        0
    } else {
        total_funding_rate_delta / funding_info.total_short_sizes
    };
    if from_long {
        (
            funding_info.long_cumulative_funding_rate + long_cumulative_funding_rate_delta,
            funding_info.short_cumulative_funding_rate - short_cumulative_funding_rate_delta,
        )
    } else {
        (
            funding_info.long_cumulative_funding_rate - long_cumulative_funding_rate_delta,
            funding_info.short_cumulative_funding_rate + short_cumulative_funding_rate_delta,
        )
    }
}
