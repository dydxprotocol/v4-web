contract;

use src20::SRC20;
use std::string::String;
use std::asset::mint_to;
use std::constants::DEFAULT_SUB_ID;

configurable {
    /// The name of the asset minted by this contract.
    NAME: str[7] = __to_str_array("MyAsset"),
    /// The symbol of the asset minted by this contract.
    SYMBOL: str[5] = __to_str_array("MYTKN"),
}

storage {
    /// The total supply of the asset minted by this contract.
    total_supply: u64 = 0,
    initialized: bool = false,
}

const DECIMALS: u8 = 6;
const FAUCET_AMOUNT: u64 = 1_000_000_000_000;

abi TestnetToken {
    #[storage(read, write)]
    fn faucet();

    #[storage(read, write)]
    fn initialize();

    fn get_asset_id() -> AssetId;
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
            Some(String::from_ascii_str(from_str_array(NAME)))
        } else {
            None
        }
    }
 
    #[storage(read)]
    fn symbol(asset: AssetId) -> Option<String> {
        if asset == AssetId::default() {
            Some(String::from_ascii_str(from_str_array(SYMBOL)))
        } else {
            None
        }
    }
 
    #[storage(read)]
    fn decimals(asset: AssetId) -> Option<u8> {
        if asset == AssetId::default() {
            Some(DECIMALS)
        } else {
            None
        }
    }
}

impl TestnetToken for Contract {
    #[storage(read, write)]
    fn faucet() {
        require(
            storage.initialized.read(),
            "NotInitialized",
        );
        let mut _total_supply = storage.total_supply.read();
        _total_supply += FAUCET_AMOUNT;
        storage.total_supply.write(_total_supply);
        let to = msg_sender().unwrap();
        log(TotalSupplyEvent{asset: AssetId::default(), supply: _total_supply, sender: to});
        mint_to(to, DEFAULT_SUB_ID, FAUCET_AMOUNT);
    }

    #[storage(read, write)]
    fn initialize() {
        // require(
        //     !storage.initialized.read(),
        //     "AlreadyInitialized",
        // );
        // storage.initialized.write(true);
        // let sender = msg_sender().unwrap();
        // let asset_id = AssetId::default();
        // log(SetNameEvent{asset: asset_id, name: Some(String::from_ascii_str(from_str_array(NAME))), sender: sender});
        // log(SetSymbolEvent{asset: asset_id, symbol: Some(String::from_ascii_str(from_str_array(SYMBOL))), sender: sender});
        // log(SetDecimalsEvent{asset: asset_id, decimals: DECIMALS, sender: sender});
        // log(TotalSupplyEvent{asset: asset_id, supply: 0, sender: sender});
    }

    fn get_asset_id() -> AssetId {
        // AssetId::new(ContractId::this(), DEFAULT_SUB_ID)
        AssetId::default()
    }
}

// These events are the standard events for a SRC20 token. Not included in the old SRC20 library.

/// The event emitted when the name is set.
pub struct SetNameEvent {
    /// The asset for which name is set.
    pub asset: AssetId,
    /// The name that is set.
    pub name: Option<String>,
    /// The caller that set the name.
    pub sender: Identity,
}

/// The event emitted when the symbol is set.
pub struct SetSymbolEvent {
    /// The asset for which symbol is set.
    pub asset: AssetId,
    /// The symbol that is set.
    pub symbol: Option<String>,
    /// The caller that set the symbol.
    pub sender: Identity,
}

/// The event emitted when the decimals is set.
pub struct SetDecimalsEvent {
    /// The asset for which decimals is set.
    pub asset: AssetId,
    /// The decimals that is set.
    pub decimals: u8,
    /// The caller that set the decimals.
    pub sender: Identity,
}

/// The event emitted when the total supply is changed.
pub struct TotalSupplyEvent {
    /// The asset for which supply is updated.
    pub asset: AssetId,
    /// The new supply of the asset.
    pub supply: u64,
    /// The caller that updated the supply.
    pub sender: Identity,
}
