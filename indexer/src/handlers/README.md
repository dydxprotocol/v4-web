## Events

## VaultAbi Events
### Markets
#### Increase Position
```
```
    pub key: b256,
    pub account: Identity,
    pub collateral_asset: AssetId,
    pub index_asset: AssetId,
    pub collateral_delta: u256,
    pub size_delta: u256,
    pub is_long: bool,
    pub price: u256,
    pub fee: u256,
```

```
- Updates Position (new | increase)
  - Position status = open
  - side = is_long ? LONG : SHORT
  - size = size_delta
  - maxSize = ?constant?
  - entryPrice = price | (calculate average entry price)
  - exitPrice = null
  - realized_pnl = 0 | (realized_pnl);
  - createdAt = block.timestamp
  - createdAtHeight = block.height
  - sumOpen ?
  - sumClose ?
  - netFunding = 0 ??
  - unrealizedPnl = 0 | (caclulate)
  - closeAt = null
  - subaccountNumber = 0
  - ticker = index_asset.ticker
  - collateral = 0 | +=collateral_delta
  - positionFees = ??? # is this needed
  - lastIncreasedTime = block.timestamp
  - account = Accounts.get_or_create(account)
  - market = Market.get_by_index_asset(index_asset)
- Creates Trade
  - createdatHeight = block.height
  - createdAt = block.timestamp
  - side = Buy
  - size = size_delta
  - tradeType = limit
  - market = Market.get_by_index_asset(index_asset)
  - position = new_position
- Updates total open interest
  - Market.openInterest += is_long ? size : -size

#### Close Position
    pub key: b256,
    pub size: u256,
    pub collateral: u256,
    pub average_price: u256,
    pub entry_funding_rate: u256,
    pub reserve_amount: u256,
    pub realized_pnl: Signed256,

- Updates Position 
  - Position status = closed
  - exitPrice = price
  - realized_pnl += realized_pnl;
  - sumOpen ?
  - sumClose ?
  - netFunding = 0 ??
  - unrealizedPnl = 0
  - closeAt = block.timestamp
- Creates Trade
  - createdatHeight = block.height
  - createdAt = block.timestamp
  - side = Sell
  - size = size_delta
  - tradeType = limit
  - market = Market.get_by_index_asset(index_asset)
  - position = new_position
- Updates total open interest
  - Market.openInterest += is_long ? -size : size

#### Decrease Position
    pub key: b256,
    pub account: Identity,
    pub collateral_asset: AssetId,
    pub index_asset: AssetId,
    pub collateral_delta: u256,
    pub size_delta: u256,
    pub is_long: bool,
    pub price: u256,
    pub fee: u256,

- Updates Position 
  - size -= size_delta
  - maxSize = ?constant?
  - realized_pnl = ??? # Shouldn't this have a realized pnl value?; We can calculate
  - sumOpen ?
  - sumClose ?
  - netFunding = 0 ??
  - unrealizedPnl = ??? # Shouldn't we decrease by PNL value (assuming it's already up to date). We can calculate
  - collateral -= collateral_delta
  - positionFees = ??? # is this needed
- Creates Trade
  - createdatHeight = block.height
  - createdAt = block.timestamp
  - side = Sell
  - size = size_delta
  - tradeType = limit
  - market = Market.get_by_index_asset(index_asset)
  - position = new_position
- Updates total open interest
  - Market.openInterest += is_long ? size : -size


#### RegisterPositionByKey ?
Potentially indicates a completely new positions (but does it?)
I believe it only happens on the very first position creation. So this may be useless.

#### Liquidate Position
    pub key: b256,
    pub account: Identity,
    pub collateral_asset: AssetId,
    pub index_asset: AssetId,
    pub is_long: bool,
    pub size: u256,
    pub collateral: u256,
    pub reserve_amount: u256,
    pub realized_pnl: Signed256,
    pub mark_price: u256,

- Updates Position
- Creates Trade
- Updates trader PNL
- Updates total open interest

### Market
#### Set Asset Config
    pub asset: AssetId,
    pub asset_decimals: u32,
    pub asset_weight: u64,
    pub min_profit_bps: u64,
    pub max_rusd_amount: u256,
    pub is_stable: bool,
    pub is_shortable: bool

- Adds market
- Updates whitelisted assets
- Updates Market

### Funding Rates
#### Set Funding Rate Info
    pub asset: AssetId,
    pub funding_rate: u256,
- Updates Funding Rate

## Price Feed
#### Set Price
    pub asset: AssetId,
    pub price: Price,
    pub timestamp: u64

- Creates a new price tick
- Updates all price intervals
