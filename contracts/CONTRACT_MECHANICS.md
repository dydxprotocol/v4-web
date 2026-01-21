# STARBOARD: CONTRACT MECHANICS

## Balances

The accounts to manage funds, including fees, collaterals and reserves.

1. total collateral (**TC**): the total collaterals of all markets, not affected by unrealized PnL and funding rates [the protocol secures funds for collaterals regardless of unrealized PnL and funding rates]
2. total protocol fee (**TPF**): the total collected fees that goes to the protocol, from all markets
3. total liquidity (**TL**): the total liquidity added by the liquidity providers, it includes the liquidity fees that serve as rewards [note that the rewards for the liquidity providers are paid out upon removing liquidity and until that they are a part of reserves, a la Uniswap V2]
4. total reserves (**TR**): funds to cover traders’ profits, generally they are liquidity funds and collected traders’ losses, they do not include **TC**, **TPF**

It may hold **TR**<**TL**. It means that paid-out losses exceeded collected profits.

Note that the reserves are shared with all markets (assets).

## PnL

If a profit **P** is accounted, then

```text
TR:=TR-P
```

If **TR**<**P**, then **P** is cut to **TR**,
and remaining amount is lost.

If a loss L is accounted, then

```text
TR:=TR+L
```

## Position Fees

Fees are collected when a trader increases (opens) or decreases (closes or liquidates) a position. Fees are deducted from funds transferred by a trader or from subtracted collateral.
Calculated fees **F** are divided to the protocol fee **PF** and fee for liquidity providers **LF** (50/50 or so):

```text
F=PF+LF
```

It is followed by accountancy:

```text
TPF:=TPF+PF
TL:=TL+LF
TR:=TR+LF
```

Note that it does not cover the liquidator fees. Also note that **F** may be cut in the case of insufficient collateral (theoretically possible).

## Liquidity Provider Fees

If a liquidity provider adds liquidity and pays an amount, a liquidity provider fee **LPF** is charged as % of the amount. The remaining amount is added to the total liquidity.

```text
TPF:=TPF+LPF
```

The same, if a liquidity provider removes liquidity, a liquidity provider fee **LPF** is charged as % of the redemption amount. The remaining amount is returned to the liquidity provider.

```text
TPF:=TPF+LPF
```

Note that if a liquidity provider removes liquidity and **TR**<**TL**, then the redemption amount (the amount removed from **TR**) is less than the remove liquidity. In such case, the liquidity provider fee is calculated based on the redemption amount.

## Funding Rates

If a trader receives funding rates **FR**, then

```text
TR:=TR-FR
```

If **TR**<**FR**, then **FR** are cut to **TR**,
and remaining amount is lost.

If the trader pays funding rates **FR**, then

```text
TR:=TR+FR
```

## Collateral

Simply.

If the position is increased by the collateral **C**, then

```text
TC:=TC+C
```

If the position is decreased by the collateral **C**, then

```text
TC:=TC-C
```

Note that **TC** can never be negative.

Note that the value **C** is not affected by fees, funding rates and PnL. It is not what a trader receives or transfers. It is a raw collateral delta.

Note that collateral is USDC.

## Liquidity

Simply.

If a liquidity provider adds **L** USDC as a liquidity, then it receives **T** LP tokens

```text
T=(LP total supply)*L/TL
```

and

```text
TR:=TR+L
TL:=TL+L
LP total supply:= (LP total supply)+T
```

If a liquidity provider removes **T** LP tokens, it removes **L** USDC from liquidity

```text
L=TL*T/(LP total supply)
```

and

```text
TR:=TR-L
TL:=TL-L
LP total supply:=(LP total supply)-T
```

Note that the liquidity provider does not receive **L** exactly, it is still charged with the liquidity fees.

Note that if **TR**<**TL**, then the redemption amount is decreased proportionally. For details for this case see the section below.

## Cases of insufficient funds

The protocol should handle situations when there is insufficient funds to cover pay outs.

Note that collaterals are secured.

Note that protocol fees are not connected to the reserves, so they are secured too.

Starboard uses a **hard-cap model**.

If trader profits or funding receipts exceed available liquidity, payouts are **capped**.

There is **no deferral**, **no debt**, and **no IOUs**.

### Remove liquidity when **TR**<**TL**

If there are insufficient reserves to cover all liquidity, the protocol needs to mitigate the risk of bank run of liquidity providers.

The liquidity provider burns **T** liquidity tokens and removes **L** liquidity. The redemption amount **R** is the amount subtracted from the reserves.

```text
R=L*TR/TL
```

It follows:

```text
TR:=TR-R
TL:=TL-L
```

So the redemption amount is proportional to the available reserves.

Note that the redemption amount is a subject to the fees before it is sent to the liquidity provider.

The unpaid funds are lost.

Note that this does not apply to adding liquidity.

### Position Management - the reserves

Opening, increasing, closing, decreasing and liquidation follow the same rules.

If there is not enough reserves to cover all profits and funding rates to be paid out to the user, the payments are capped and executed with the priorities until the reserves deplete: the funding rates, PnL.

Unpaid amounts are lost.

### Position Management - the collateral

The case with an insufficient collateral is possible only when a position is liquidated.

If there is not enough collateral to cover all fees, losses and funding rates to be paid by the user, then the payments are capped and executed with the priorities until the collateral depletes: the fees, the funding rates, PnL.

Unpaid amounts are lost.

## Fees structure

### Position fee

The fee is charged when increasing (opening) and decreasing (closing) positions.
It is also charged in case of liquidation.

The default fee rate is 0.1%. The max fee rate is 5%.

The formula is:

```text
F:=position_fee_rate * size_delta
```

_size_delta_ is an absolute change of position’s size.

The position fee is split into a part that goes to liquidity providers (the liquidity fee **LF**) and the protocol (the protocol fee **PF**) 50/50:

```text
LF:=F/2
PF:=F/2
TR:=TR+LF
TL:=TL+LF
TPF:=TPF+PF
```

### Liquidity Provider Fee

The fee is charged when adding and removing liquidity by a liquidity provider.

The default fee rate is 0.3%. The max fee rate is 5%.

The formula is:

```text
liquidity_fee:=liquidity_fee_rate * redemption_amount
```

The liquidity fee goes to the protocol:

```text
TPF:=TPF+liquidity_fee
```

Note that the redemption amount may be less than the liquidity delta if **TR**<**TL**.

### Liquidation fee

The fee is charged when a position is liquidated.

The default fee rate is 0.1%. The max fee rate is 5%.

The formula is:

```text
liquidation_fee:=liquidation_fee_rate * position_size
```

The liquidation fee goes to a liquidator.

## Positions Rules

### Increase Position

Increasing existing positions and opening new positions follow the same rules.

1. A trader specifies non negative collateral delta and non negative size delta. The deltas will be added to the position.
2. The size delta is added to the position size (if the position exists), a new average position price is calculated (see below), no PnL is applied.
3. The collateral delta is added to the collateral (if the position exists), the fees are charged from the collateral, the funding rate is added to or subtracted from the collateral.
4. At the end, the updated position is validated - checked if it is eligible for liquidation.

### Decrease Position

Decreasing and closing existing positions follow the same rules.

1. A trader specifies non negative collateral delta and non negative size delta. The deltas will be subtracted from the position. If the size delta equals the position delta, the position is to be closed.
2. The size delta is subtracted from the position size, no new average position price is calculated, PnL is calculated based on the size delta, the recent average position price and current asset price (see below).
3. The target collateral is calculated as the position collateral - the collateral delta. The position collateral is updated: the fees are charged, the funding rate and PnL are added or subtracted (note that the collateral delta is not subtracted here). And then the amount to be transferred back to the trader is calculated:

- If the position is to be closed: the whole updated collateral is returned to the trader.
- Else if the updated collateral is greater than the target collateral: the collateral is shortened to the target collateral and the excess is returned to the trader.
- Else: nothing is returned to the trader.

4. If the position is to be closed, there is no validation. Otherwise, at the end, the position is validated - checked if it is eligible for liquidation.

### Others

If a trader increases or decreases existing position, and after adding the funding rate and pnl it turns out that the collateral is greater than the size, an error is thrown (an alternative would be to return the surplus collateral to the trader).

## The Average Price formula

The position's average price **AP** is updated on every position increase.

Let **price** be the current asset's price. Let the existing position size **size** be increased by **size_delta**.

If the position is open (was empty before), the formula is

```text
AP:=price
```

If **size**>0, then **AP**>0 and the new value is

```text
assets:=size/AP
assets_delta:=size_delta/price
AP:=(size+size_delta)/(assets+assets_delta)
```

## The PnL formula

At any time, PnL for a given position can be calculated. PnL is expressed in USDC.

Having the position with the size **size** and the average price **AP** and the current price **price**, first calculate

```text
price_delta:=price-AP
```

Then for the long position

```text
PnL:=size*price_delta/AP
```

and for the short position

```text
PnL:=size*(-price_delta)/AP
```

Note that PnL is a signed value: positive indicates profits, negative indicates losses.
