## Starboard Finance First Deliverable

### Overall summary
Deploy modified ruscet contracts to mainnet allowing for long and short positions to be taken on crypto assets (ETH, BTC, FUEL, stFUEL). 
Deploy a forked version of the DYDX frontend with branding changes as a frontend for the newly deployed contracts. 
Allow for the shorting and longing of the given assets with X leverage (see open questions). 
Allow LPs to deposit funds into the liquidity pool and take part in both the gains and losses of the platform.

### User groups
- Traders
- Funding Rate arbitragers
- Liquidity Providers

### Stories



### Contract changes
1. Take the ruscet contracts and make the following modifications
  a. Enable only USDC to be deposited into the vault as a vault asset (Prevents the use of the system as a swap platform)
  b. Allow only USDC to be deposited as collateral for both long and short positions 
    (Pro: Resolves issues with usd value creditation of collateral)
    (Con: Increases risk on house of winning long positions as collateral value increase is not captured by the protocol)
  c. Remove the use of RUSD as a lp position asset (Prefers only RLP positions that carry proportional house value/risk)
  d. Update to using newest version of forc
  e. Configure the position and funding fees to be paid relative position length and OI imbalances respectively
2. Update and improve testing coverage for tests
3. Deploy contracts to testnet
4. Deploy contracts to mainnet
5. Provision an audit for contract changes
6. Update oracles to use stork to gain access to steth pricing

### Frontend Changes
1. Modify frontend branding with the following
  a. New color palette
  b. New logos
  c. Update copy to reflect the fuel network and starboard rather than dydx (cosmos chain) and dydx platform
2. Update the frontend to use a custom Fuel client that does the following:
  a. Reads application state from the indexer
  b. Writes for the following actions to the fuel network via the fuel-ts-sdk: (CUD trader positions (long and short), CUD LP positions)
3. Update the frontend wallet to connect via the fuel connectors and to fetch address, and wallet funds from the fuel network
4. Processes and returns errors from the fuel network appropriately
5. Replace read calls in the custom client to use the sqd indexer rather than the dydx one
6. Modify the client reads that rely on webhooks to use the indexer graphql api instead

### Indexer
1. Create a new subsquid indexer that takes events from the starboard contracts and provides a dydx compliant
  a. Map out the differences between the Ruscet state model and the dydx state model
  b. Create an interface for the indexer that is close to compliant with the dydx indexer
  c. Write handlers that process the events and update indexer state to reflect the current state of the app

### Additional extension
1. Create a simple version of the UI for use in the worldchain mini app store
  a. This should allow simple long short bets with leverage with minimal clicks
  b. This should use the EVM connectors to allow for worldchain wallets to control user actions
  c. The user should be able to see trading history, current positions and price history

### Open questions
- How much leverage should be allowed for each asset?
- How will using rest endpoints for fetching real-time data effect the speed and responsiveness of the app

