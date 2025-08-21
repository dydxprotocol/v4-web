// SPDX-License-Identifier: Apache-2.0
contract;
 
use std::{
    block::{timestamp as tai64_timestamp},
	call_frames::*,
	context::*, 
	asset::*,
	hash::*
};
use helpers::{
	transfer::transfer_assets
};
use core_interfaces::vault_pricefeed::*;
 
abi Utils {
	fn get_tai64_timestamp() -> u64;
	fn get_unix_timestamp() -> u64;
	fn get_unix_and_tai64_timestamp() -> (u64, u64);

	fn get_contr_balance(
		contr: ContractId,
		asset: AssetId
	) -> u64;

	#[payable]
	fn transfer_assets_to_contract(
		asset: AssetId,
		amount: u64,
		contr: ContractId
	) -> bool;

	fn get_position_key(
		account: Identity,
		collateral_asset: AssetId,
		index_asset: AssetId,
		is_long: bool,
	) -> b256;
}

struct PriceUpdateData {
    asset_id: AssetId,
    price: u256,
}

enum Error {
	UtilsInvalidAmountForwarded: (),
	UtilsInvalidAssetForwarded: ()
}

struct PositionKey {
    pub account: Identity,
    pub collateral_asset: AssetId,
    pub index_asset: AssetId,
    pub is_long: bool,
}

impl Hash for PositionKey {
    fn hash(self, ref mut state: Hasher) {
        self.account.hash(state);
        self.collateral_asset.hash(state);
        self.index_asset.hash(state);
        self.is_long.hash(state);
    }
}

impl Utils for Contract {
	fn get_tai64_timestamp() -> u64 {
		tai64_timestamp()
	}

	fn get_unix_timestamp() -> u64 {
		let tai64_time = tai64_timestamp();
		let unix_time = tai64_time - 2.pow(62) - 10;

		unix_time
	}

	fn get_unix_and_tai64_timestamp() -> (u64, u64) {
		let tai64_time = tai64_timestamp();
		let unix_time = tai64_time - 2.pow(62) - 10;

		(tai64_time, unix_time)
	}

	fn get_contr_balance(
		contr: ContractId,
		asset: AssetId
	) -> u64 {
		balance_of(contr, asset)
	}

	#[payable]
	fn transfer_assets_to_contract(
		asset: AssetId,
		amount: u64,
		contr: ContractId
	) -> bool {
		require(
			msg_amount() == amount,
			Error::UtilsInvalidAmountForwarded
		);
		require(
			msg_asset_id() == asset,
			Error::UtilsInvalidAssetForwarded
		);

		transfer_assets(
			asset,
			Identity::ContractId(contr),
			amount,
		);

		true
	}

	fn get_position_key(
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
}