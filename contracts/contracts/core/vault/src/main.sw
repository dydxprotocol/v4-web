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
use helpers::{utils::*, zero::*};
use src3::SRC3;
use src20::{SetDecimalsEvent, SetNameEvent, SetSymbolEvent, SRC20, TotalSupplyEvent};
use src5::{SRC5, State};
use ownership::{_owner, initialize_ownership, only_owner, renounce_ownership, transfer_ownership};
use core_interfaces::{
    pricefeed_wrapper::PricefeedWrapper,
    vault::{
        FundingInfo,
        Position,
        PositionKey,
        PositionSettlementStatus,
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
use reentrancy::reentrancy_guard;
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
const LP_ASSET_NAME: str[11] = __to_str_array("StarBoardLP");
const LP_ASSET_SYMBOL: str[3] = __to_str_array("SLP");

configurable {
    /// The stable asset used for collaterals, the FUEL asset id for transfers
    BASE_ASSET_ID: AssetId = AssetId::zero(),
    /// The stable asset used for collaterals, the oracle asset for prices
    BASE_ASSET: b256 = b256::zero(),
    /// used to convert the oracle prices to the collateral asset prices
    /// this is also the decimals of LP Token
    BASE_ASSET_DECIMALS: u32 = 0,
    /// The pricefeed provider contract used to get the prices of the assets
    PRICEFEED_WRAPPER: ContractId = ZERO_CONTRACT,
}

storage {
    vault {
        is_initialized: bool = false,
        /// ---------------------  Fees  ---------------------
        /// charged when liquidating a position
        /// 0.1% by default
        liquidation_fee_basis_points: u64 = 10,
        /// charged when adding/removing liquidity
        /// 0.3% by default
        liquidity_fee_basis_points: u64 = 30,
        /// applied to size of leveraged positions on a position increase
        /// 0.1% by default
        increase_position_fee_basis_points: u64 = 10,
        /// applied to size of leveraged positions on a position decrease
        /// 0% by default
        decrease_position_fee_basis_points: u64 = 0,
        // Misc
        approved_routers: StorageMap<Identity, StorageMap<Identity, bool>> = StorageMap {},
        is_liquidator: StorageMap<Identity, bool> = StorageMap {},
        max_leverage: StorageMap<b256, u256> = StorageMap {},
        whitelisted_assets: StorageMap<b256, bool> = StorageMap {},
        // tracks all open Positions
        positions: StorageMap<b256, Position> = StorageMap {},
        // tracks amount of fees (in collateral asset)
        fee_reserve: u256 = 0,
        // track amount of collateral in the pool
        // these are guaranteed funds, paid profits and funding rates do not use them
        total_collateral: u256 = 0,
        // tracks the total amount of reserves for profits and funding rates
        total_reserves: u256 = 0,
        // tracks the total amount of liquidity in the reserves
        // may be greater than total_reserves
        // e.g. paid fees, profits, and funding rates exceed received losses and funding rates
        total_liquidity: u256 = 0,
    },
    fund {
        funding_info: StorageMap<b256, FundingInfo> = StorageMap {},
    },
    // SRC20 support - track total supply of the LP asset
    lp_asset {
        total_supply: u64 = 0,
    },
}

impl SRC20 for Contract {
    #[storage(read)]
    fn total_assets() -> u64 {
        1
    }

    #[storage(read)]
    fn total_supply(asset: AssetId) -> Option<u64> {
        if asset == AssetId::default() {
            // try_read is used instead of read for the sake of upgradability
            Some(storage::lp_asset.total_supply.try_read().unwrap_or(0))
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
            Some(BASE_ASSET_DECIMALS.try_as_u8().unwrap_or(255))
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
        only_owner();

        sl_pause();
        log(SetPaused {
            is_paused: true,
        });
    }

    #[storage(write)]
    fn unpause() {
        only_owner();

        sl_unpause();
        log(SetPaused {
            is_paused: false,
        });
    }
}

impl SRC5 for Contract {
    #[storage(read)]
    fn owner() -> State {
        _owner()
    }
}

impl Vault for Contract {
    /// Get the revision of the contract
    fn get_revision() -> u8 {
        REVISION
    }

    #[storage(read, write)]
    fn initialize(gov: Identity) {
        // try_read is used instead of read for the sake of upgradability
        require(
            !storage::vault
                .is_initialized
                .try_read()
                .unwrap_or(false),
            Error::VaultAlreadyInitialized,
        );
        storage::vault.is_initialized.write(true);
        initialize_ownership(gov);

        // set the default fees
        // skip initialization if set_fees() has been called
        match storage::vault.liquidation_fee_basis_points.try_read() {
            None => {
                storage::vault.liquidation_fee_basis_points.write(10);
            }
            _ => {}
        }
        match storage::vault.liquidity_fee_basis_points.try_read() {
            None => {
                storage::vault.liquidity_fee_basis_points.write(30);
            }
            _ => {}
        }
        match storage::vault.increase_position_fee_basis_points.try_read() {
            None => {
                storage::vault.increase_position_fee_basis_points.write(10);
            }
            _ => {}
        }
        match storage::vault.decrease_position_fee_basis_points.try_read() {
            None => {
                storage::vault.decrease_position_fee_basis_points.write(0);
            }
            _ => {}
        }

        storage::vault.fee_reserve.write(0);
        storage::vault.total_collateral.write(0);
        storage::vault.total_reserves.write(0);
        storage::vault.total_liquidity.write(0);

        storage::lp_asset.total_supply.write(0);
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
            decimals: BASE_ASSET_DECIMALS.try_as_u8().unwrap_or(255),
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
    fn set_liquidator(liquidator: Identity, is_active: bool) {
        only_owner();
        storage::vault.is_liquidator.insert(liquidator, is_active);
        log(SetLiquidator {
            liquidator,
            is_active,
        });
    }

    #[storage(read, write)]
    fn set_fees(
        liquidity_fee_basis_points: u64,
        increase_position_fee_basis_points: u64,
        decrease_position_fee_basis_points: u64,
        liquidation_fee_basis_points: u64,
    ) {
        only_owner();

        require(
            liquidity_fee_basis_points <= MAX_FEE_BASIS_POINTS && increase_position_fee_basis_points <= MAX_FEE_BASIS_POINTS && decrease_position_fee_basis_points <= MAX_FEE_BASIS_POINTS && liquidation_fee_basis_points <= MAX_FEE_BASIS_POINTS,
            Error::VaultInvalidFeeBasisPoints,
        );

        storage::vault
            .liquidity_fee_basis_points
            .write(liquidity_fee_basis_points);
        storage::vault
            .increase_position_fee_basis_points
            .write(increase_position_fee_basis_points);
        storage::vault
            .decrease_position_fee_basis_points
            .write(decrease_position_fee_basis_points);
        storage::vault
            .liquidation_fee_basis_points
            .write(liquidation_fee_basis_points);

        log(SetFees {
            liquidity_fee_basis_points,
            increase_position_fee_basis_points,
            decrease_position_fee_basis_points,
            liquidation_fee_basis_points,
        });
    }

    /// the asset is whitelisted and max leverage is set
    /// max leverage must be multiplied by 10_000 to get actual leverage
    /// e.g: 50 * 10_000 = 50%
    #[storage(read, write)]
    fn set_asset_config(asset: b256, max_leverage: u256) {
        only_owner();

        require(asset != BASE_ASSET, Error::VaultInvalidAsset);
        require(max_leverage <= MAX_LEVERAGE, Error::VaultInvalidMaxLeverage);

        storage::vault.max_leverage.insert(asset, max_leverage);
        storage::vault.whitelisted_assets.insert(asset, true);

        log(SetAssetConfig {
            asset,
            max_leverage,
        });
    }

    #[storage(read, write)]
    fn clear_asset_config(asset: b256) {
        only_owner();

        require(
            storage::vault
                .whitelisted_assets
                .get(asset)
                .try_read()
                .unwrap_or(false),
            Error::VaultAssetNotWhitelisted,
        );

        storage::vault.whitelisted_assets.remove(asset);
        storage::vault.max_leverage.remove(asset);

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
        only_owner();

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
        // _is_increase is false because pnl is realized only on decreasing the position
        let price = _get_price(index_asset, is_long, false);

        _get_pnl(index_asset, size, price, average_price, is_long)
    }

    #[storage(read)]
    fn get_position_liquidation_price(account: Identity, index_asset: b256, is_long: bool) -> u256 {
        _get_position_liquidation_price(account, index_asset, is_long)
    }

    #[storage(read)]
    fn get_position_by_key(position_key: b256) -> Position {
        _get_position_by_key(position_key)
    }

    #[storage(read)]
    fn get_position(account: Identity, index_asset: b256, is_long: bool) -> Position {
        let position_key = _get_position_key(account, index_asset, is_long);
        _get_position_by_key(position_key)
    }

    #[storage(read)]
    fn get_price(asset: b256, is_long: bool, is_increase: bool) -> u256 {
        _get_price(asset, is_long, is_increase)
    }

    #[storage(read)]
    fn get_total_reserves() -> u256 {
        storage::vault.total_reserves.read()
    }

    #[storage(read)]
    fn get_total_liquidity() -> u256 {
        storage::vault.total_liquidity.read()
    }

    #[storage(read)]
    fn get_fee_reserve() -> u256 {
        storage::vault.fee_reserve.try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn is_asset_whitelisted(asset: b256) -> bool {
        _is_asset_whitelisted(asset)
    }

    #[storage(read)]
    fn get_base_asset() -> AssetId {
        BASE_ASSET_ID
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
    fn get_position_funding_rate(account: Identity, index_asset: b256, is_long: bool) -> (u256, bool) {
        let position_key = _get_position_key(account, index_asset, is_long);
        let position = _get_position_by_key(position_key);
        require(position.collateral > 0, Error::VaultInvalidPosition);

        _calculate_funding_rate(
            index_asset,
            position
                .size,
            is_long,
            position
                .cumulative_funding_rate,
        )
    }

    #[storage(read)]
    fn get_liquidation_fee_basis_points() -> u64 {
        storage::vault.liquidation_fee_basis_points.try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_liquidity_fee_basis_points() -> u64 {
        storage::vault.liquidity_fee_basis_points.try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_increase_position_fee_basis_points() -> u64 {
        storage::vault.increase_position_fee_basis_points.try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn get_decrease_position_fee_basis_points() -> u64 {
        storage::vault.decrease_position_fee_basis_points.try_read().unwrap_or(0)
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
        _only_initialized();
        _validate_liquidation(account, index_asset, is_long, should_raise)
    }

    /// simulates the add liquidity operation
    /// it does not take into account the total reserves
    /// returns the amount of lp assets to mint, the amount of collateral to be received by the receiver, and the fee rate
    #[storage(read)]
    fn get_add_liquidity_amount(base_asset_amount: u64) -> (u64, u64, u64) {
        _only_initialized();
        require(base_asset_amount > 0, Error::VaultInvalidBaseAssetAmount);
        _get_add_liquidity_amount(base_asset_amount)
    }

    #[storage(read)]
    fn get_remove_liquidity_amount(lp_asset_amount: u64) -> (u64, u64, u64, u64) {
        _only_initialized();
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
        _only_initialized();
        sl_require_not_paused();
        reentrancy_guard();

        let amount_out = _add_liquidity(receiver);
        amount_out
    }

    #[payable]
    #[storage(read, write)]
    fn remove_liquidity(receiver: Identity) -> u64 {
        _only_initialized();
        sl_require_not_paused();
        reentrancy_guard();

        let amount_out = _remove_liquidity(receiver);

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
        _only_initialized();
        sl_require_not_paused();
        reentrancy_guard();

        let (new_collateral, price) = _increase_position(account, index_asset, size_delta, is_long);
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
        _only_initialized();
        sl_require_not_paused();
        reentrancy_guard();

        _validate_router(account);
        let (new_collateral, price, paid_out_collateral) = _decrease_position(
            account,
            index_asset,
            collateral_delta,
            size_delta,
            is_long,
            receiver,
        );
        (new_collateral, price, paid_out_collateral)
    }

    #[storage(read, write)]
    fn liquidate_position(
        account: Identity,
        index_asset: b256,
        is_long: bool,
        fee_receiver: Identity,
    ) {
        _only_initialized();
        sl_require_not_paused();
        reentrancy_guard();

        _liquidate_position(account, index_asset, is_long, fee_receiver);
    }
}

// ---------------------  Internal  ---------------------

/// Checks if the contract is initialized, reverts if not.
/// # Reverts
///
/// - `VaultNotInitialized` if the contract is not initialized
#[storage(read)]
fn _only_initialized() {
    require(
        // try_read is used instead of read for the sake of upgradability
        storage::vault
            .is_initialized
            .try_read()
            .unwrap_or(false),
        Error::VaultNotInitialized,
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
fn _write_fee_reserve(fee_reserve: u256) {
    storage::vault.fee_reserve.write(fee_reserve);
}

/// the amount after fees is rounded down
/// required fee_basis_points < BASIS_POINTS_DIVISOR, unchecked
fn _get_after_fee_amount(amount: u64, fee_basis_points: u64) -> u64 {
    if amount < u64::max() / BASIS_POINTS_DIVISOR {
        amount * (BASIS_POINTS_DIVISOR - fee_basis_points) / BASIS_POINTS_DIVISOR
    } else {
        let after_fee_amount_u256 = amount.as_u256() * (BASIS_POINTS_DIVISOR - fee_basis_points).as_u256() / BASIS_POINTS_DIVISOR.as_u256();
        // no threat to overflow since all values fit u64
        u64::try_from(after_fee_amount_u256).unwrap()
    }
}

/// the price is the rate of the asset in the base asset (i.e. USDC)
/// the arguments _is_long and _is_increase are for possible future extension - applying the spread
/// The price in the base asset so it is asset_price / base_asset_price
#[storage(read)]
fn _get_price(asset: b256, _is_long: bool, _is_increase: bool) -> u256 {
    let pricefeed_wrapper = abi(PricefeedWrapper, PRICEFEED_WRAPPER.bits());
    let base_asset_price = pricefeed_wrapper.price(BASE_ASSET);
    let asset_price = pricefeed_wrapper.price(asset);
    // overly defensive programming
    require(base_asset_price > 0, Error::VaultInvalidPrice);
    require(asset_price > 0, Error::VaultInvalidPrice);
    if asset_price < u256::max() / PRICE_PRECISION {
        asset_price * PRICE_PRECISION / base_asset_price
    } else {
        require(
            asset_price / base_asset_price < u256::max() / PRICE_PRECISION,
            Error::VaultInvalidPrice,
        );
        asset_price / base_asset_price * PRICE_PRECISION
    }
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

/// return value:
/// 0: no liquidation needed
/// 1: losses exceed collateral
/// 2: max leverage exceeded
/// The liquidation status does not depend on the total reserves.
#[storage(read)]
fn _validate_liquidation(
    account: Identity,
    index_asset: b256,
    is_long: bool,
    should_raise: bool,
) -> (u256, u256) {
    let position_key = _get_position_key(account, index_asset, is_long);

    let position = _get_position_by_key(position_key);

    require(position.size > 0, Error::VaultEmptyPosition);

    // we take the fresh price here, it potentially may be different than for the caller
    // the spread may be applied
    let price = _get_price(index_asset, is_long, false);

    let position_fee = _get_position_fee(account, index_asset, is_long, position.size, false);

    let liquidation_fee = _get_liquidation_fee(account, index_asset, is_long, position.size);

    let (has_profit, pnl_delta) = _get_pnl(
        index_asset,
        position
            .size,
        price,
        position
            .average_price,
        is_long,
    );

    let (funding_rate, funding_rate_has_profit) = _calculate_funding_rate(
        index_asset,
        position
            .size,
        is_long,
        position
            .cumulative_funding_rate,
    );

    let mut available_collateral = position.collateral;
    let mut losses_and_fees = position_fee + liquidation_fee;

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
            require(false, Error::VaultLossesExceedCollateral);
        }
        return (1, 0);
    }

    let remaining_collateral = available_collateral - losses_and_fees;
    // must be set and not zero
    let max_leverage = storage::vault.max_leverage.get(index_asset).read();
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

/// calculates the pnl of a position
/// price is the current price of the index asset
/// the price is not validated, so it must be provided by the caller
/// average_price is the average price of the position
/// is_long is true if the position is long, false if short
/// returns a tuple of (has_profit, pnl_delta)
/// has_profit is true if the position has profit, false if it has loss
/// pnl_delta is the pnl of the position (in the collateral asset)
fn _get_pnl(
    index_asset: b256,
    size: u256,
    price: u256,
    average_price: u256,
    is_long: bool,
) -> (bool, u256) {
    require(average_price > 0, Error::VaultInvalidAveragePrice);

    let (has_profit, price_delta) = if price > average_price {
        (is_long, price - average_price)
    } else {
        (!is_long, average_price - price)
    };

    // overflow safe
    let delta = size * price_delta / average_price;
    (has_profit, delta)
}

/// calculates the liquidation price of a position
/// it is the limit that a long position is liquidated when the price falls below
/// and a short position is liquidated when the price rises above
#[storage(read)]
fn _get_position_liquidation_price(account: Identity, index_asset: b256, is_long: bool) -> u256 {
    let position_key = _get_position_key(account, index_asset, is_long);

    let position = _get_position_by_key(position_key);

    require(position.size > 0, Error::VaultEmptyPosition);

    let position_fee = _get_position_fee(account, index_asset, is_long, position.size, false);

    let liquidation_fee = _get_liquidation_fee(account, index_asset, is_long, position.size);

    let (funding_rate, funding_rate_has_profit) = _calculate_funding_rate(
        index_asset,
        position
            .size,
        is_long,
        position
            .cumulative_funding_rate,
    );

    let mut available_collateral = position.collateral;
    let mut losses_and_fees = position_fee + liquidation_fee;

    if funding_rate_has_profit {
        available_collateral = available_collateral + funding_rate;
    } else {
        losses_and_fees = losses_and_fees + funding_rate;
    }

    // must be set and not zero
    let max_leverage = storage::vault.max_leverage.get(index_asset).read();
    // rounds up
    // ensure the condition minimal_collateral_after_all * max_leverage >= position.size * BASIS_POINTS_DIVISOR
    let minimal_collateral_after_all = (position.size * BASIS_POINTS_DIVISOR.as_u256() + max_leverage - 1) / max_leverage;
    let minimal_collateral_before_pnl = minimal_collateral_after_all + losses_and_fees;

    // calculate the limit pnl that can be realized without liquidation
    // less profit or more loss triggers liquidation
    let (has_profit, pnl_delta) = if available_collateral > minimal_collateral_before_pnl {
        (false, available_collateral - minimal_collateral_before_pnl)
    } else {
        (true, minimal_collateral_before_pnl - available_collateral)
    };

    let average_price = position.average_price;

    // pnl_delta = size * price_delta / average_price;
    let price_delta = if has_profit {
        // rounds down
        pnl_delta * average_price / position.size
    } else {
        // rounds up
        (pnl_delta * average_price + position.size - 1) / position.size
    };

    if has_profit {
        if is_long {
            average_price + price_delta
        } else {
            // in extreme cases, average_price - price_delta may underflow
            if price_delta > average_price {
                0
            } else {
                average_price - price_delta
            }
        }
    } else {
        if is_long {
            // in extreme cases, average_price - price_delta may underflow
            if price_delta > average_price {
                0
            } else {
                average_price - price_delta
            }
        } else {
            average_price + price_delta
        }
    }
}

#[storage(read)]
fn _get_position_fee(
    _account: Identity,
    _index_asset: b256,
    _is_long: bool,
    size_delta: u256,
    is_increase: bool,
) -> u256 {
    if size_delta == 0 {
        return 0;
    }

    let position_fee_basis_points = if is_increase {
        storage::vault.increase_position_fee_basis_points.read()
    } else {
        storage::vault.decrease_position_fee_basis_points.read()
    };

    size_delta * position_fee_basis_points.as_u256() / BASIS_POINTS_DIVISOR.as_u256()
}

#[storage(read)]
fn _get_liquidation_fee(
    _account: Identity,
    _index_asset: b256,
    _is_long: bool,
    size_delta: u256,
) -> u256 {
    if size_delta == 0 {
        return 0;
    }

    let liquidation_fee_basis_points = storage::vault.liquidation_fee_basis_points.read();

    size_delta * liquidation_fee_basis_points.as_u256() / BASIS_POINTS_DIVISOR.as_u256()
}

#[storage(read)]
fn _get_position_pnl(account: Identity, index_asset: b256, is_long: bool) -> (bool, u256) {
    let position_key = _get_position_key(account, index_asset, is_long);

    let position = _get_position_by_key(position_key);

    // _is_increase is false because pnl is realized only on decreasing the position
    let price = _get_price(index_asset, is_long, false);

    _get_pnl(
        index_asset,
        position
            .size,
        price,
        position
            .average_price,
        is_long,
    )
}

#[storage(read)]
fn _validate_router(account: Identity) {
    let sender = get_sender();

    if sender == account {
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

/// calculates the next average price for a position
/// that is the weighted harmonic average of prices at the time of position increase with size coefficient
/// in other words this is the average price that assets are bought or sold at
/// it is required that size > 0, average_price > 0, next_price > 0
fn _get_next_average_price(
    index_asset: b256,
    size: u256,
    average_price: u256,
    is_long: bool,
    next_price: u256,
    size_delta: u256,
) -> u256 {
    // tokens are multiplied by very high constant numbers to ensure precision
    let tokens = size * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION / average_price;
    let tokens_delta = size_delta * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION / next_price;
    (size + size_delta) * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION / (tokens + tokens_delta)
}

#[storage(read, write)]
fn _withdraw_fees(receiver: Identity) -> u64 {
    let amount = u64::try_from(_get_fee_reserve()).unwrap();
    if amount == 0 {
        return 0;
    }

    storage::vault.fee_reserve.write(0);

    _transfer_out(BASE_ASSET_ID, u64::try_from(amount).unwrap(), receiver);

    log(WithdrawFees {
        receiver,
        amount,
    });

    amount
}

#[storage(read)]
fn _get_add_liquidity_amount(base_asset_amount: u64) -> (u64, u64, u64) {
    let fee_basis_points = storage::vault.liquidity_fee_basis_points.read();

    let amount_after_fees = _get_after_fee_amount(base_asset_amount, fee_basis_points);

    let total_lp_assets = storage::lp_asset.total_supply.read();
    let total_liquidity = storage::vault.total_liquidity.read();
    // no threat to overflow since all values fit u64
    let mint_amount_u256 = if total_liquidity == 0 {
        amount_after_fees.as_u256()
    } else {
        total_lp_assets.as_u256() * amount_after_fees.as_u256() / total_liquidity
    };
    // not threat to overflow since total_lp_assets <= total_liquidity
    let mint_amount = u64::try_from(mint_amount_u256).unwrap();
    (mint_amount, amount_after_fees, fee_basis_points)
}

#[storage(read, write)]
fn _add_liquidity(receiver: Identity) -> u64 {
    require(!receiver.is_zero(), Error::VaultReceiverCannotBeZero);

    let base_asset_amount = _transfer_in(BASE_ASSET_ID);
    require(base_asset_amount > 0, Error::VaultInvalidBaseAssetAmount);

    let (mint_amount, amount_after_fees, fee_basis_points) = _get_add_liquidity_amount(base_asset_amount);
    require(mint_amount > 0, Error::VaultDustyBaseAssetAmount);

    let fee_amount = base_asset_amount - amount_after_fees;

    _write_fee_reserve(_get_fee_reserve() + fee_amount.as_u256());

    let new_total_reserves = storage::vault.total_reserves.read() + amount_after_fees.as_u256();
    storage::vault.total_reserves.write(new_total_reserves);

    let new_total_liquidity = storage::vault.total_liquidity.read() + amount_after_fees.as_u256();
    storage::vault.total_liquidity.write(new_total_liquidity);

    let new_supply = mint_amount + storage::lp_asset.total_supply.read();
    storage::lp_asset.total_supply.write(new_supply);

    mint_to(receiver, DEFAULT_SUB_ID, mint_amount);

    log(TotalSupplyEvent {
        asset: AssetId::default(),
        supply: new_supply,
        sender: msg_sender().unwrap(),
    });

    log(AddLiquidity {
        account: receiver,
        base_asset_amount,
        liquidity_amount: amount_after_fees,
        lp_asset_amount: mint_amount,
        fee: fee_amount,
    });

    mint_amount
}

#[storage(read)]
fn _get_remove_liquidity_amount(lp_asset_amount: u64) -> (u64, u64, u64, u64) {
    let fee_basis_points = storage::vault.liquidity_fee_basis_points.read();

    let total_lp_assets = storage::lp_asset.total_supply.read();
    let total_reserves = storage::vault.total_reserves.read();
    let total_liquidity = storage::vault.total_liquidity.read();

    // no threat to overflow since all values fit u64
    let liquidity_amount_u256 = total_liquidity * lp_asset_amount.as_u256() / total_lp_assets.as_u256();
    // not threat to overflow since all values fit u64
    let liquidity_amount = u64::try_from(liquidity_amount_u256).unwrap();

    let redemption_amount_u256 = if total_liquidity > total_reserves {
        // not threat to overflow since total_reserves <= total_liquidity and all values fit u64
        liquidity_amount_u256 * total_reserves / total_liquidity
    } else {
        liquidity_amount_u256
    };
    // not threat to overflow since all values fit u64
    let redemption_amount = u64::try_from(redemption_amount_u256).unwrap();

    let amount_out = _get_after_fee_amount(redemption_amount, fee_basis_points);
    (liquidity_amount, redemption_amount, amount_out, fee_basis_points)
}

#[storage(read, write)]
fn _remove_liquidity(receiver: Identity) -> u64 {
    require(!receiver.is_zero(), Error::VaultReceiverCannotBeZero);

    let lp_asset_amount = _transfer_in(AssetId::default());
    require(lp_asset_amount > 0, Error::VaultInvalidLpAssetAmount);

    let (liquidity_amount, redemption_amount, amount_out, fee_basis_points) = _get_remove_liquidity_amount(lp_asset_amount);

    require(amount_out > 0, Error::VaultInvalidAmountOut);

    let fee_amount = redemption_amount - amount_out;

    _write_fee_reserve(_get_fee_reserve() + fee_amount.as_u256());

    let new_total_reserves = storage::vault.total_reserves.read() - redemption_amount.as_u256();
    storage::vault.total_reserves.write(new_total_reserves);

    let new_total_liquidity = storage::vault.total_liquidity.read() - liquidity_amount.as_u256();
    storage::vault.total_liquidity.write(new_total_liquidity);

    // not threat to overflow since all values fit u64
    let burn_amount_u64 = u64::try_from(lp_asset_amount).unwrap();
    let new_supply = storage::lp_asset.total_supply.read() - burn_amount_u64;
    storage::lp_asset.total_supply.write(new_supply);
    burn(DEFAULT_SUB_ID, burn_amount_u64);
    log(TotalSupplyEvent {
        asset: AssetId::default(),
        supply: new_supply,
        sender: msg_sender().unwrap(),
    });

    log(RemoveLiquidity {
        account: receiver,
        base_asset_amount: amount_out,
        liquidity_amount,
        lp_asset_amount: burn_amount_u64,
        fee: fee_amount,
    });

    _transfer_out(BASE_ASSET_ID, amount_out, receiver);

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

    let collateral_delta = _transfer_in(BASE_ASSET_ID).as_u256();

    let total_reserves = storage::vault.total_reserves.read();

    let position_fee = _get_position_fee(account, index_asset, is_long, size_delta, true);

    let liquidity_fee = position_fee / 2;
    let protocol_fee = position_fee - liquidity_fee;

    let (funding_rate, funding_rate_has_profit) = _calculate_funding_rate(
        index_asset,
        position
            .size,
        is_long,
        position
            .cumulative_funding_rate,
    );

    let (
        out_protocol_fee,
        out_liquidity_fee,
        _,
        out_funding_rate,
        _,
        out_collateral,
        out_total_reserves,
        status,
    ) = _calculate_settlement(
        protocol_fee,
        liquidity_fee,
        0,
        funding_rate,
        funding_rate_has_profit,
        0,
        true,
        position
            .collateral + collateral_delta,
        total_reserves,
    );

    match status {
        PositionSettlementStatus::InsufficientCollateral => {
            require(false, Error::VaultInsufficientCollateral);
        }
        _ => {}
    }

    let out_position_fee = out_protocol_fee + out_liquidity_fee;

    let price = _get_price(index_asset, is_long, true);

    // update the average price before the size and collateral are updated
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

    // update the total collateral before the size and collateral are updated
    // no threat to underflow
    storage::vault
        .total_collateral
        .write(storage::vault.total_collateral.read() + out_collateral - position.collateral);
    storage::vault
        .total_liquidity
        .write(storage::vault.total_liquidity.read() + out_liquidity_fee);
    // total_reserves must be written before _validate_liquidation is called
    storage::vault.total_reserves.write(out_total_reserves);
    _write_fee_reserve(_get_fee_reserve() + out_protocol_fee);

    position.size = position.size + size_delta;
    position.collateral = out_collateral;

    // collateral may be high because of funding rate, the excess is not returned to the user
    require(
        position
            .size >= position
            .collateral,
        Error::VaultSizeMustBeMoreThanCollateral,
    );

    let new_cumulative_funding_rate = _increase_and_update_funding_info(index_asset, size_delta, is_long);
    position.cumulative_funding_rate = new_cumulative_funding_rate;

    // we need to have a storage write here because _validate_liquidation re-constructs the position key and 
    // validates the average_price. If not for this position write, it would receive a stale avg price (could be 0)
    storage::vault.positions.insert(position_key, position);

    let (_liquidation_state, _left_collateral) = _validate_liquidation(account, index_asset, is_long, true);

    log(IncreasePosition {
        key: position_key,
        collateral_delta,
        size_delta,
        price,
        out_average_price: position.average_price,
        out_liquidity_fee,
        out_protocol_fee,
        funding_rate,
        out_funding_rate,
        funding_rate_has_profit,
        pnl_delta: 0,
        out_pnl_delta: 0,
        pnl_delta_has_profit: true,
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

    let total_reserves = storage::vault.total_reserves.read();

    let price = _get_price(index_asset, is_long, false);

    let position_fee = _get_position_fee(account, index_asset, is_long, size_delta, false);

    let liquidity_fee = position_fee / 2;
    let protocol_fee = position_fee - liquidity_fee;

    let (has_profit, pnl_delta) = _get_pnl(
        index_asset,
        size_delta,
        price,
        position
            .average_price,
        is_long,
    );

    let (funding_rate, funding_rate_has_profit) = _calculate_funding_rate(
        index_asset,
        position
            .size,
        is_long,
        position
            .cumulative_funding_rate,
    );
    let (
        out_protocol_fee,
        out_liquidity_fee,
        _,
        out_funding_rate,
        out_pnl_delta,
        mut out_collateral,
        out_total_reserves,
        status,
    ) = _calculate_settlement(
        protocol_fee,
        liquidity_fee,
        0,
        funding_rate,
        funding_rate_has_profit,
        pnl_delta,
        has_profit,
        position
            .collateral,
        total_reserves,
    );

    match status {
        PositionSettlementStatus::InsufficientCollateral => {
            require(false, Error::VaultInsufficientCollateral);
        }
        _ => {}
    }

    let out_position_fee = out_protocol_fee + out_liquidity_fee;

    // if the position is not closed, amount above the collateral target is returned to the user
    let collateral_target = position.collateral - collateral_delta;
    let mut amount_out = 0;
    if position.size == size_delta {
        amount_out = out_collateral;
        out_collateral = 0;
    } else if out_collateral > collateral_target {
        amount_out = out_collateral - collateral_target;
        out_collateral = collateral_target;
    } else {
        amount_out = 0;
        // out_collateral is unchanged
    }

    // update the total collateral before the size and collateral are updated
    // no threat to underflow
    storage::vault
        .total_collateral
        .write(storage::vault.total_collateral.read() + out_collateral - position.collateral);
    storage::vault
        .total_liquidity
        .write(storage::vault.total_liquidity.read() + out_liquidity_fee);
    // total_reserves must be written before _validate_liquidation is called
    storage::vault.total_reserves.write(out_total_reserves);
    _write_fee_reserve(_get_fee_reserve() + out_protocol_fee);

    let new_cumulative_funding_rate = _decrease_and_update_funding_info(index_asset, size_delta, is_long);

    if position.size != size_delta {
        // update the position
        position.collateral = out_collateral;
        // no threat to underflow
        position.size = position.size - size_delta;

        position.cumulative_funding_rate = new_cumulative_funding_rate;

        // collateral may be high because of funding rate, the excess is not returned to the user
        require(
            position
                .size >= position
                .collateral,
            Error::VaultSizeMustBeMoreThanCollateral,
        );

        // update storage because the above changes are ignored by call to other fn `validate_liquidation`
        // we need to have a storage write here because _validate_liquidation re-constructs the position key and 
        // validates the max_leverage. If not for this position write, it would receive an incorrect max_leverage error
        storage::vault.positions.insert(position_key, position);

        let (_liquidation_state, _left_collateral) = _validate_liquidation(account, index_asset, is_long, true);

        log(DecreasePosition {
            key: position_key,
            collateral_delta,
            size_delta,
            price,
            out_average_price: position.average_price,
            out_liquidity_fee,
            out_protocol_fee,
            funding_rate,
            out_funding_rate,
            funding_rate_has_profit,
            pnl_delta,
            out_pnl_delta,
            pnl_delta_has_profit: has_profit,
            cumulative_funding_rate: new_cumulative_funding_rate,
            amount_out,
            receiver,
        });
    } else {
        // remove the position
        storage::vault.positions.remove(position_key);

        log(DecreasePosition {
            key: position_key,
            collateral_delta,
            size_delta,
            price,
            out_average_price: position.average_price,
            out_liquidity_fee,
            out_protocol_fee,
            funding_rate: out_funding_rate,
            out_funding_rate,
            funding_rate_has_profit,
            pnl_delta,
            out_pnl_delta,
            pnl_delta_has_profit: has_profit,
            cumulative_funding_rate: new_cumulative_funding_rate,
            amount_out,
            receiver,
        });
        log(ClosePosition {
            key: position_key,
        });
    }

    if amount_out > 0 {
        // safe to cast to u64
        _transfer_out(BASE_ASSET_ID, u64::try_from(amount_out).unwrap(), receiver);
    }
    (position.collateral, price, amount_out)
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

    let total_reserves = storage::vault.total_reserves.read();

    let price = _get_price(index_asset, is_long, false);

    let position_fee = _get_position_fee(account, index_asset, is_long, position.size, false);

    let liquidity_fee = position_fee / 2;
    let protocol_fee = position_fee - liquidity_fee;

    let (has_profit, pnl_delta) = _get_pnl(
        index_asset,
        position
            .size,
        price,
        position
            .average_price,
        is_long,
    );

    let (funding_rate, funding_rate_has_profit) = _calculate_funding_rate(
        index_asset,
        position
            .size,
        is_long,
        position
            .cumulative_funding_rate,
    );

    let liquidation_fee = _get_liquidation_fee(account, index_asset, is_long, position.size);

    let (
        out_protocol_fee,
        out_liquidity_fee,
        out_liquidation_fee,
        out_funding_rate,
        out_pnl_delta,
        out_collateral,
        out_total_reserves,
        _,
    ) = _calculate_settlement(
        protocol_fee,
        liquidity_fee,
        liquidation_fee,
        funding_rate,
        funding_rate_has_profit,
        pnl_delta,
        has_profit,
        position
            .collateral,
        total_reserves,
    );

    let out_position_fee = out_protocol_fee + out_liquidity_fee;

    storage::vault
        .total_collateral
        .write(storage::vault.total_collateral.read() - position.collateral);
    storage::vault
        .total_liquidity
        .write(storage::vault.total_liquidity.read() + out_liquidity_fee);
    // remaining collateral is moved to the reserves
    storage::vault
        .total_reserves
        .write(out_total_reserves + out_collateral);
    _write_fee_reserve(_get_fee_reserve() + out_protocol_fee);

    let new_cumulative_funding_rate = _decrease_and_update_funding_info(index_asset, position.size, is_long);

    storage::vault.positions.remove(position_key);

    log(LiquidatePosition {
        key: position_key,
        price,
        out_liquidity_fee,
        out_protocol_fee,
        out_liquidation_fee,
        funding_rate,
        out_funding_rate,
        funding_rate_has_profit,
        pnl_delta,
        out_pnl_delta,
        pnl_delta_has_profit: has_profit,
        cumulative_funding_rate: new_cumulative_funding_rate,
        fee_receiver,
    });

    // pay the fee receiver using the pool
    if out_liquidation_fee > 0 {
        _transfer_out(
            BASE_ASSET_ID,
            // safe to cast to u64
            u64::try_from(out_liquidation_fee)
                .unwrap(),
            fee_receiver,
        );
    }
}

/// The pure function to calculate the settlement of the position.
/// It checks if there is enough collateral or total reserves to cover the settlement.
/// If not, it cuts the values according to priorities.
/// Priorities are: fees, the funding rate, and the pnl delta.
/// The complexity comes from the fact that the function aggregates the flows to cover all cases.
/// Returns updated values of the protocol fee, liquidity fee, liquidation fee, funding rate, pnl delta, collateral, total reserves, and the status.
/// The status is: success, insufficient collateral, or insufficient reserves.
/// The insufficient collateral status overrides the insufficient reserves status if both are set.
///
/// Rules.
/// If funding_rate_has_profit is true, the funding_rate amount is moved from the reserves to the collateral.
/// If it is false, then the funding_rate amount is moved from the collateral to the reserves.
/// If pnl_delta_has_profit is true, the pnl_delta amount is moved from the reserves to the collateral.
/// If it is false, then the pnl_delta amount is moved from the collateral to the reserves.
/// The liquidity fee is moved from the collateral to the reserves always.
/// The protocol fee is subtracted from the collateral (collected in a separate record).
/// The liquidation fee is subtracted from the collateral (collected in a separate record).
/// The final collateral cannot be negative.
/// If it is negative, the status is set to insufficient collateral and outgoing payments are cut so the final collateral is 0.
/// The final total reserves cannot be negative.
/// If it is negative, the status is set to insufficient reserves and outgoing payments are cut so the final reserves is 0.
/// The payments have priorities (descending order): protocol fee, liquidation fee, liquidity fee, funding rate, pnl delta.
/// If the collateral or reserves are insufficient, the payments are cut according to the priorities.
/// The funds flow is optimized so incomes are first accounted for and then expenses -
/// it is relevant when payments are cut.
fn _calculate_settlement(
    protocol_fee: u256,
    liquidity_fee: u256,
    liquidation_fee: u256,
    funding_rate: u256,
    funding_rate_has_profit: bool,
    pnl_delta: u256,
    pnl_delta_has_profit: bool,
    collateral: u256,
    total_reserves: u256,
) -> (u256, u256, u256, u256, u256, u256, u256, PositionSettlementStatus) {
    // amount that goes from the collateral to the reserves
    let amount_to_reserves = liquidity_fee + (if !funding_rate_has_profit {
        funding_rate
    } else {
        0
    }) + (if !pnl_delta_has_profit { pnl_delta } else { 0 });

    // amount that goes from the reserves to the collateral
    let amount_to_collateral = (if funding_rate_has_profit {
        funding_rate
    } else {
        0
    }) + (if pnl_delta_has_profit { pnl_delta } else { 0 });

    let mut out_collateral = collateral;
    let mut out_reserves = total_reserves;
    let mut out_liquidity_fee = liquidity_fee; // default value when amount_to_collateral == amount_to_reserves
    let mut out_funding_rate = funding_rate; // default value when amount_to_collateral == amount_to_reserves
    let mut out_pnl_delta = pnl_delta; // default value when amount_to_collateral == amount_to_reserves
    // we do not use a simple comparison out_reserves ==0 or out_collateral ==0 at the end
    // in order to to cover boundary cases
    let mut status = PositionSettlementStatus::Success;

    // this is ok to cover the case when reserves -> collateral before other fees
    // the aggregated flow moves funds from the reserves to the collateral
    if amount_to_collateral > amount_to_reserves {
        out_reserves = out_reserves + amount_to_reserves;
        out_liquidity_fee = liquidity_fee;
        if funding_rate_has_profit {
            out_funding_rate = if out_reserves < funding_rate {
                out_reserves
            } else {
                funding_rate
            };
            out_reserves = out_reserves - out_funding_rate;
            out_collateral = out_collateral + out_funding_rate;
        }
        if pnl_delta_has_profit {
            out_pnl_delta = if out_reserves < pnl_delta {
                out_reserves
            } else {
                pnl_delta
            };
            out_reserves = out_reserves - out_pnl_delta;
            out_collateral = out_collateral + out_pnl_delta;
        }
        // save to substract, finally in this if-block out_collateral does not decrease
        out_collateral = out_collateral - amount_to_reserves;
        if amount_to_collateral > total_reserves + amount_to_reserves
        {
            status = PositionSettlementStatus::InsufficientReserves;
        }
    }

    let out_protocol_fee = if out_collateral < protocol_fee {
        out_collateral
    } else {
        protocol_fee
    };
    out_collateral = out_collateral - out_protocol_fee;
    if out_protocol_fee < protocol_fee {
        // this may override InsufficientReserves, but that's ok
        status = PositionSettlementStatus::InsufficientCollateral;
    }

    let out_liquidation_fee = if out_collateral < liquidation_fee {
        out_collateral
    } else {
        liquidation_fee
    };
    out_collateral = out_collateral - out_liquidation_fee;
    if out_liquidation_fee < liquidation_fee {
        // this may override InsufficientReserves, but that's ok
        status = PositionSettlementStatus::InsufficientCollateral;
    }

    // the aggregated flow moves funds from the collateral to the reserves
    if amount_to_collateral < amount_to_reserves {
        // we have to update the status before the out_collateral is updated
        if amount_to_reserves > out_collateral + amount_to_collateral
        {
            status = PositionSettlementStatus::InsufficientCollateral;
        }
        out_collateral = out_collateral + amount_to_collateral;
        out_liquidity_fee = if out_collateral < liquidity_fee {
            out_collateral
        } else {
            liquidity_fee
        };
        out_collateral = out_collateral - out_liquidity_fee;
        out_reserves = out_reserves + out_liquidity_fee;
        if !funding_rate_has_profit {
            out_funding_rate = if out_collateral < funding_rate {
                out_collateral
            } else {
                funding_rate
            };
            out_collateral = out_collateral - out_funding_rate;
            out_reserves = out_reserves + out_funding_rate;
        }
        if !pnl_delta_has_profit {
            out_pnl_delta = if out_collateral < pnl_delta {
                out_collateral
            } else {
                pnl_delta
            };
            out_collateral = out_collateral - out_pnl_delta;
            out_reserves = out_reserves + out_pnl_delta;
        }
        // save to substract, finally in this if-block out_reserves does not decrease
        out_reserves = out_reserves - amount_to_collateral;
    }
    (
        out_protocol_fee,
        out_liquidity_fee,
        out_liquidation_fee,
        out_funding_rate,
        out_pnl_delta,
        out_collateral,
        out_reserves,
        status,
    )
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

/// returns the funding rate value and the flag whether it is a profit or loss
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
    // no threat to underflow
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
