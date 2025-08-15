// SPDX-License-Identifier: Apache-2.0
contract;

/*
__   ___      _     _   _____               _             
\ \ / (_) ___| | __| | |_   _| __ __ _  ___| | _____ _ __ 
 \ V /| |/ _ \ |/ _` |   | || '__/ _` |/ __| |/ / _ \ '__|
  | | | |  __/ | (_| |   | || | | (_| | (__|   <  __/ |   
  |_| |_|\___|_|\__,_|   |_||_|  \__,_|\___|_|\_\___|_|
*/

mod errors;
mod events;

use std::{
    asset::mint_to,
    context::*,
    revert::require,
    storage::{
        storage_string::*,
        storage_vec::*,
    },
    primitive_conversions::u64::*,
    string::String
};
use std::hash::*;
use helpers::{
    zero::*,
    utils::*, 
    transfer::*
};
use asset_interfaces::{
    yield_tracker::YieldTracker,
    yield_asset::YieldAsset,
    time_distributor::TimeDistributor,
};
use errors::*;
use events::*;

const PRECISION: u256 = 0xC9F2C9CD04674EDEA40000000u256; // 10 ** 30;

storage {
    gov: Identity = ZERO_IDENTITY,
    is_initialized: bool = false,
    
    yield_asset_contr: ContractId = ZERO_CONTRACT,
    time_distributor: ContractId = ZERO_CONTRACT,

    cumulative_reward_per_asset: u256 = 0,

    claimable_reward: StorageMap<Identity, u256> = StorageMap {},
    previous_cumulated_reward_per_asset: StorageMap<Identity, u256> = StorageMap {}
}

impl YieldTracker for Contract {
    #[storage(read, write)]
    fn initialize(yield_asset_contr: ContractId) {
        require(
            !storage.is_initialized.read(), 
            Error::YieldTrackerAlreadyInitialized
        );
        storage.is_initialized.write(true);

        let sender = get_sender();
        storage.gov.write(sender);
        storage.yield_asset_contr.write(yield_asset_contr);
        log(SetGov { gov: sender });
        log(SetYieldAssetContract { yield_asset_contr });
    }

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
        storage.gov.write(gov);
        log(SetGov { gov });
    }

    #[storage(read, write)]
    fn set_time_distributor(time_distributor: ContractId) {
        _only_gov();
        storage.time_distributor.write(time_distributor);
        log(SetTimeDistributor { time_distributor });
    }

    /*
          ____ __     ___
         / / / \ \   / (_) _____      __
        / / /   \ \ / /| |/ _ \ \ /\ / /
       / / /     \ V / | |  __/\ V  V /
      /_/_/       \_/  |_|\___| \_/\_/
    */
    #[storage(read)]
    fn get_assets_per_interval() -> u64 {
        abi(
            TimeDistributor, 
            storage.time_distributor.read().into()
        ).get_assets_per_interval(Identity::ContractId(ContractId::this()))  
    }

    #[storage(read)]
    fn claimable(
        account: Identity,
        // staked balance of the account
        // we can't accurately calculate the staked balance of an account onchain because of Fuel's UTXO model
        // so we pass it as an argument to this function
        yield_asset_staked_balance: u256
    ) -> u256 {
        let yield_asset = abi(YieldAsset, storage.yield_asset_contr.read().into());
        let time_distributor = abi(TimeDistributor, storage.time_distributor.read().into());

        if yield_asset_staked_balance == 0 {
            return storage.claimable_reward.get(account).try_read().unwrap_or(0);
        }

        let pending_rewards = time_distributor.get_distribution_amount(
            Identity::ContractId(ContractId::this())
        ).as_u256() * PRECISION;
        
        let total_staked = yield_asset.total_staked().as_u256();
        let next_cumulative_reward_per_asset = 
            storage.cumulative_reward_per_asset.read() + (pending_rewards / total_staked);

        storage.claimable_reward.get(account).try_read().unwrap_or(0) + (
            yield_asset_staked_balance.multiply(
                next_cumulative_reward_per_asset - 
                storage.previous_cumulated_reward_per_asset.get(account)
                    .try_read().unwrap_or(0)
            ) / PRECISION
        )
    }

    /*
          ____  ____        _     _ _  
         / / / |  _ \ _   _| |__ | (_) ___ 
        / / /  | |_) | | | | '_ \| | |/ __|
       / / /   |  __/| |_| | |_) | | | (__ 
      /_/_/    |_|    \__,_|_.__/|_|_|\___|
    */
    /// callable only by the YieldAsset contract for the specific YieldTracker contract
    /// the YieldAsset contract is responsible for retrieving the latest staked balance of an account
    /// since doing so onchain isn't possible with Fuel's UTXO model
    #[storage(read, write)]
    fn update_rewards(
        account: Identity,
        // staked balance of the account
        yield_asset_staked_balance: u256
    ) {
        _only_yield_asset_contract();

        _update_rewards(account, yield_asset_staked_balance);
    }

    /// callable only by the YieldAsset contract for the specific YieldTracker contract
    /// the YieldAsset contract is responsible for retrieving the latest staked balance of an account
    /// since doing so onchain isn't possible with Fuel's UTXO model
    #[storage(read, write)]
    fn claim(
        account: Identity,
        receiver: Identity,
        // staked balance of the account
        yield_asset_staked_balance: u256
    ) -> u256 {
        _only_yield_asset_contract();

        require(
            get_contract_or_revert() == storage.yield_asset_contr.read(),
            Error::YieldTrackerForbidden
        );

        _update_rewards(account, yield_asset_staked_balance);

        let asset_amount = storage.claimable_reward.get(account).try_read().unwrap_or(0);
        let _ = storage.claimable_reward.remove(account);

        let reward_asset = abi(
            TimeDistributor, 
            storage.time_distributor.read().into()
        ).get_reward_asset(Identity::ContractId(ContractId::this()));
        
        transfer_assets(
            reward_asset,
            receiver,
            // @TODO: potential revert here
            u64::try_from(asset_amount).unwrap()
        );

        asset_amount
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
        Error::YieldTrackerForbidden
    );
}

#[storage(read)]
fn _only_yield_asset_contract() {
    require(
        get_contract_or_revert() == storage.yield_asset_contr.read(),
        Error::YieldTrackerForbidden
    );
}

#[storage(read, write)]
fn _update_rewards(
    account: Identity,
    // staked balance of the account
    yield_asset_staked_balance: u256
) {
    let yield_asset = abi(YieldAsset, storage.yield_asset_contr.read().into());
    let mut block_reward: u256 = 0;

    if !storage.time_distributor.read().is_zero() {
        block_reward = abi(
            TimeDistributor, 
            storage.time_distributor.read().into()
        ).distribute().as_u256();
    }

    let mut cumulative_reward_per_asset = storage.cumulative_reward_per_asset.read();
    let total_staked = yield_asset.total_staked().as_u256();

    // only update cumulativeRewardPerToken when there are stakers, i.e. when totalStaked > 0
    // if blockReward == 0, then there will be no change to cumulativeRewardPerToken
    if total_staked > 0 && block_reward > 0 {
        cumulative_reward_per_asset = cumulative_reward_per_asset + (block_reward * PRECISION / total_staked);
        storage.cumulative_reward_per_asset.write(cumulative_reward_per_asset);
    }

    // cumulativeRewardPerToken can only increase
    // so if cumulativeRewardPerToken is zero, it means there are no rewards yet
    if cumulative_reward_per_asset == 0 {
        return;
    }

    if account != ZERO_IDENTITY {
        let previous_cumulated_reward = storage.previous_cumulated_reward_per_asset.get(account).try_read().unwrap_or(0);

        let claimable_reward: u256 = storage.claimable_reward.get(account).try_read().unwrap_or(0) +
            ((yield_asset_staked_balance * (cumulative_reward_per_asset - previous_cumulated_reward)) / PRECISION);
        
        storage.claimable_reward.insert(account, claimable_reward);
        storage.previous_cumulated_reward_per_asset.insert(account, cumulative_reward_per_asset);
    }
}