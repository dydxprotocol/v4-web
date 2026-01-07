import { AbstractContract, WalletUnlocked } from "fuels"
import { launchNode, getNodeWallets } from "./node.js"
import {
    call,
    AddressIdentity,
    walletToAddressIdentity,
    expandDecimals,
    BASE_ASSET,
    USDC_ASSET,
    BTC_ASSET,
    getBtcConfig,
    getAssetId,
    moveBlockchainTime,
} from "./utils.js"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
    Fungible,
    FungibleFactory,
    PricefeedWrapper,
    PricefeedWrapperFactory,
    StorkMock,
    StorkMockFactory,
    Vault,
    VaultExposeFactory,
    SimpleProxyFactory,
} from "../types/index.js"

describe("Vault.total-liquidity", () => {
    let attachedContracts: AbstractContract[]
    let launchedNode: LaunchTestNodeReturn<DeployContractConfig[]>
    let deployer: WalletUnlocked
    let user0: WalletUnlocked
    let user1: WalletUnlocked
    let liquidator: WalletUnlocked
    let deployerIdentity: AddressIdentity
    let user0Identity: AddressIdentity
    let user1Identity: AddressIdentity
    let liquidatorIdentity: AddressIdentity
    let USDC: Fungible
    let USDC_ASSET_ID: string
    let LP_ASSET_ID: string // the LP fungible asset
    let storkMock: StorkMock
    let pricefeedWrapper: PricefeedWrapper
    let vault: Vault
    let vaultUser0: Vault
    let vaultUser1: Vault
    let vaultLiquidator: Vault

    beforeEach(async () => {
        launchedNode = await launchNode()
        ;[deployer, user0, user1, , liquidator] = getNodeWallets(launchedNode)

        deployerIdentity = walletToAddressIdentity(deployer)
        user0Identity = walletToAddressIdentity(user0)
        user1Identity = walletToAddressIdentity(user1)
        liquidatorIdentity = walletToAddressIdentity(liquidator)

        /*
            NativeAsset + Pricefeed
        */
        const { waitForResult: waitForResultUSDC } = await FungibleFactory.deploy(deployer)
        const { contract: USDCDeployed } = await waitForResultUSDC()
        USDC = USDCDeployed

        USDC_ASSET_ID = getAssetId(USDC)

        const { waitForResult: waitForResultStorkMock } = await StorkMockFactory.deploy(deployer)
        const { contract: storkMockDeployed } = await waitForResultStorkMock()
        storkMock = storkMockDeployed
        const { waitForResult: waitForResultPricefeedWrapper } = await PricefeedWrapperFactory.deploy(deployer, {
            configurableConstants: {
                STORK_CONTRACT: { bits: storkMock.id.b256Address },
            },
        })
        const { contract: pricefeedWrapperDeployed } = await waitForResultPricefeedWrapper()
        pricefeedWrapper = pricefeedWrapperDeployed

        const { waitForResult: waitForResultVaultImpl } = await VaultExposeFactory.deploy(deployer, {
            configurableConstants: {
                BASE_ASSET_ID: { bits: USDC_ASSET_ID },
                BASE_ASSET,
                BASE_ASSET_DECIMALS: 9,
                PRICEFEED_WRAPPER: { bits: pricefeedWrapper.id.b256Address },
            },
        })
        const { contract: vaultImpl } = await waitForResultVaultImpl()

        const { waitForResult: waitForResultSimpleProxy } = await SimpleProxyFactory.deploy(deployer, {
            configurableConstants: {
                DEPLOYER: { bits: deployer.address.toHexString() },
            },
        })
        const { contract: simpleProxy } = await waitForResultSimpleProxy()
        await call(
            simpleProxy.functions.initialize_proxy(deployerIdentity, {
                bits: vaultImpl.id.toHexString(),
            }),
        )
        vault = new Vault(simpleProxy.id.toAddress(), deployer)

        attachedContracts = [vault, vaultImpl, storkMock, pricefeedWrapper]

        await call(vault.functions.initialize(deployerIdentity).addContracts([vaultImpl]))
        LP_ASSET_ID = (await vault.functions.get_lp_asset().get()).value.bits.toString()
        await call(vault.functions.set_liquidator(liquidatorIdentity, true).addContracts([vaultImpl]))

        await call(
            vault.functions
                .set_fees(
                    30, // liquidity_fee_basis_points
                    10, // position_fee_basis_points
                    expandDecimals(5), // liquidation_fee
                )
                .addContracts([vaultImpl]),
        )

        vaultUser0 = new Vault(vault.id.toAddress(), user0)
        vaultUser1 = new Vault(vault.id.toAddress(), user1)
        vaultLiquidator = new Vault(vault.id.toAddress(), liquidator)

        await call(storkMock.functions.update_price(USDC_ASSET, expandDecimals(1, 18)))

        await call(vault.functions.set_asset_config(...getBtcConfig()).addContracts([vaultImpl]))

        await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(40000, 18)))

        await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
    })

    describe("add liquidity", () => {
        it("increases total_liquidity by amount after fees", async () => {
            const totalLiquidityBefore = (await vault.functions.get_total_liquidity().get()).value

            await call(USDC.functions.mint(user0Identity, expandDecimals(10000)))
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(10000), USDC_ASSET_ID],
                    }),
            )

            const totalLiquidityAfter = (await vault.functions.get_total_liquidity().get()).value
            const liquidityIncrease = totalLiquidityAfter.toNumber() - totalLiquidityBefore.toNumber()

            // total_liquidity should increase by amount_after_fees
            // 10000 * 0.997 = 9970 (after 0.3% fee)
            expect(totalLiquidityAfter.toNumber()).gt(totalLiquidityBefore.toNumber())
            expect(liquidityIncrease).gte(Number(expandDecimals(9960)))
            expect(liquidityIncrease).lte(Number(expandDecimals(9970)))
        })

        it("total_liquidity equals total_reserves when no trades have occurred", async () => {
            await call(USDC.functions.mint(user0Identity, expandDecimals(10000)))
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(10000), USDC_ASSET_ID],
                    }),
            )

            const totalLiquidity = (await vault.functions.get_total_liquidity().get()).value
            const totalReserves = (await vault.functions.get_total_reserves().get()).value

            // When no trades have occurred, total_liquidity should equal total_reserves
            expect(totalLiquidity.toNumber()).eq(totalReserves.toNumber())
        })

        it("total_liquidity accumulates across multiple adds", async () => {
            const totalLiquidityInitial = (await vault.functions.get_total_liquidity().get()).value

            // First add
            await call(USDC.functions.mint(user0Identity, expandDecimals(10000)))
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(10000), USDC_ASSET_ID],
                    }),
            )

            const totalLiquidityAfterFirst = (await vault.functions.get_total_liquidity().get()).value

            // Second add
            await call(USDC.functions.mint(user1Identity, expandDecimals(10000)))
            await call(
                vaultUser1.functions
                    .add_liquidity(user1Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(5000), USDC_ASSET_ID],
                    }),
            )

            const totalLiquidityAfterSecond = (await vault.functions.get_total_liquidity().get()).value

            // Verify accumulation
            expect(totalLiquidityAfterSecond.toNumber()).gt(totalLiquidityAfterFirst.toNumber())
            expect(totalLiquidityAfterFirst.toNumber()).gt(totalLiquidityInitial.toNumber())

            // The increase from second add should be approximately 5000 * 0.997
            const secondIncrease = totalLiquidityAfterSecond.toNumber() - totalLiquidityAfterFirst.toNumber()
            expect(secondIncrease).gte(Number(expandDecimals(4980)))
            expect(secondIncrease).lte(Number(expandDecimals(4985)))
        })
    })

    describe("remove liquidity", () => {
        beforeEach(async () => {
            // Set up: user0 has liquidity
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(10000), USDC_ASSET_ID],
                    }),
            )
        })

        it("decreases total_liquidity by liquidity_amount", async () => {
            const lpBalance = await user0.getBalance(LP_ASSET_ID)
            const totalLiquidityBefore = (await vault.functions.get_total_liquidity().get()).value

            // Get expected liquidity_amount
            const removeResult = (await vault.functions.get_remove_liquidity_amount(lpBalance).get()).value
            const expectedLiquidityAmount = removeResult[0].toNumber() // liquidity_amount

            await call(
                vaultUser0.functions
                    .remove_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [lpBalance, LP_ASSET_ID],
                    }),
            )

            const totalLiquidityAfter = (await vault.functions.get_total_liquidity().get()).value
            const liquidityDecrease = totalLiquidityBefore.toNumber() - totalLiquidityAfter.toNumber()

            // total_liquidity should decrease by liquidity_amount (not redemption_amount)
            expect(totalLiquidityAfter.toNumber()).lt(totalLiquidityBefore.toNumber())
            expect(liquidityDecrease).eq(expectedLiquidityAmount)
        })

        it("partial removal decreases total_liquidity proportionally", async () => {
            const lpBalance = await user0.getBalance(LP_ASSET_ID)
            const totalLiquidityBefore = (await vault.functions.get_total_liquidity().get()).value

            const removeAmount = lpBalance.div(2)

            // Get expected liquidity_amount for partial removal
            const removeResult = (await vault.functions.get_remove_liquidity_amount(removeAmount).get()).value
            const expectedLiquidityAmount = removeResult[0].toNumber()

            await call(
                vaultUser0.functions
                    .remove_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [removeAmount, LP_ASSET_ID],
                    }),
            )

            const totalLiquidityAfter = (await vault.functions.get_total_liquidity().get()).value
            const liquidityDecrease = totalLiquidityBefore.toNumber() - totalLiquidityAfter.toNumber()

            // Should decrease by the liquidity_amount for the removed LP tokens
            expect(liquidityDecrease).eq(expectedLiquidityAmount)
            expect(totalLiquidityAfter.toNumber()).gt(0) // Still has liquidity remaining
        })
    })

    describe("increase position", () => {
        beforeEach(async () => {
            // Set up: user0 provides liquidity for traders
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(40000), USDC_ASSET_ID],
                    }),
            )
        })

        it("increases total_liquidity by liquidity fee portion of position fees", async () => {
            const totalLiquidityBefore = (await vault.functions.get_total_liquidity().get()).value

            await call(USDC.functions.mint(user1Identity, expandDecimals(50000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )

            const totalLiquidityAfter = (await vault.functions.get_total_liquidity().get()).value

            // total_liquidity should increase by the liquidity_fee portion
            // Position fee is 0.1% of size_delta, split 50/50 between protocol and liquidity
            // liquidity_fee = 1000 * 0.001 / 2 = 0.5
            expect(totalLiquidityAfter.toNumber()).gt(totalLiquidityBefore.toNumber())

            const liquidityIncrease = totalLiquidityAfter.toNumber() - totalLiquidityBefore.toNumber()
            // Should be approximately half of position fee (0.5 USDC worth)
            expect(liquidityIncrease).gt(0)
        })

        it("total_liquidity increases accumulate across multiple position increases", async () => {
            const totalLiquidityInitial = (await vault.functions.get_total_liquidity().get()).value

            await call(USDC.functions.mint(user1Identity, expandDecimals(50000)))

            // First position increase
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )

            const totalLiquidityAfterFirst = (await vault.functions.get_total_liquidity().get()).value

            // Second position increase
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(2000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(200), USDC_ASSET_ID],
                    }),
            )

            const totalLiquidityAfterSecond = (await vault.functions.get_total_liquidity().get()).value

            // Verify accumulation
            expect(totalLiquidityAfterSecond.toNumber()).gt(totalLiquidityAfterFirst.toNumber())
            expect(totalLiquidityAfterFirst.toNumber()).gt(totalLiquidityInitial.toNumber())
        })
    })

    describe("decrease position", () => {
        beforeEach(async () => {
            // Set up: user0 provides liquidity, user1 opens a position
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(40000), USDC_ASSET_ID],
                    }),
            )

            await call(USDC.functions.mint(user1Identity, expandDecimals(50000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(2000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(200), USDC_ASSET_ID],
                    }),
            )
        })

        it("increases total_liquidity by liquidity fee when decreasing position", async () => {
            const totalLiquidityBefore = (await vault.functions.get_total_liquidity().get()).value

            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value

            // Decrease half the position
            await call(
                vaultUser1.functions
                    .decrease_position(
                        user1Identity,
                        BTC_ASSET,
                        position.collateral.div(2),
                        position.size.div(2),
                        true,
                        user1Identity,
                    )
                    .addContracts(attachedContracts),
            )

            const totalLiquidityAfter = (await vault.functions.get_total_liquidity().get()).value

            // total_liquidity should increase by the liquidity_fee portion
            expect(totalLiquidityAfter.toNumber()).gt(totalLiquidityBefore.toNumber())
        })

        it("increases total_liquidity when closing position completely", async () => {
            const totalLiquidityBefore = (await vault.functions.get_total_liquidity().get()).value

            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value

            // Close position completely
            await call(
                vaultUser1.functions
                    .decrease_position(user1Identity, BTC_ASSET, position.collateral, position.size, true, user1Identity)
                    .addContracts(attachedContracts),
            )

            const totalLiquidityAfter = (await vault.functions.get_total_liquidity().get()).value

            // total_liquidity should increase by liquidity_fee
            expect(totalLiquidityAfter.toNumber()).gt(totalLiquidityBefore.toNumber())
        })
    })

    describe("liquidate position", () => {
        beforeEach(async () => {
            // Set up: user0 provides liquidity, user1 opens a position
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(40000), USDC_ASSET_ID],
                    }),
            )

            await call(USDC.functions.mint(user1Identity, expandDecimals(50000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
        })

        it("increases total_liquidity by liquidity fee when liquidating", async () => {
            const totalLiquidityBefore = (await vault.functions.get_total_liquidity().get()).value

            // Make position liquidatable by moving price against it
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36000, 18)))

            // Verify it's liquidatable
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState[0].toString()).not.eq("0") // Should be liquidatable

            // Liquidate
            await call(
                vaultLiquidator.functions
                    .liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity)
                    .addContracts(attachedContracts),
            )

            const totalLiquidityAfter = (await vault.functions.get_total_liquidity().get()).value

            // total_liquidity should increase by liquidity_fee
            expect(totalLiquidityAfter.toNumber()).gt(totalLiquidityBefore.toNumber())
        })
    })

    describe("PnL and funding rates do not affect total_liquidity", () => {
        beforeEach(async () => {
            // Set up: user0 provides liquidity, user1 opens a position
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(40000), USDC_ASSET_ID],
                    }),
            )
        })

        it("total_liquidity unchanged by profitable PnL when closing position", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(50000)))

            // Open a large position
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(10000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(2000), USDC_ASSET_ID],
                    }),
            )

            const totalLiquidityBefore = (await vault.functions.get_total_liquidity().get()).value
            const totalReservesBefore = (await vault.functions.get_total_reserves().get()).value

            // Price moves significantly in favor of the trader (large profit)
            // Current price is 40000, move to 50000 (25% profit)
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(50000, 18)))

            // Get position details
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value

            // Verify position has profit
            const [hasProfit, pnl] = (await vault.functions.get_position_pnl(user1Identity, BTC_ASSET, true).get()).value
            expect(hasProfit).eq(true)
            expect(pnl.toNumber()).gt(Number(expandDecimals(2000))) // Large profit

            // Close position completely - this will pay out large PnL from reserves
            await call(
                vaultUser1.functions
                    .decrease_position(user1Identity, BTC_ASSET, position.collateral, position.size, true, user1Identity)
                    .addContracts(attachedContracts),
            )

            const totalLiquidityAfter = (await vault.functions.get_total_liquidity().get()).value
            const totalReservesAfter = (await vault.functions.get_total_reserves().get()).value

            // total_liquidity should only increase by liquidity_fee (small amount)
            // It should NOT be affected by the large PnL payout
            const liquidityIncrease = totalLiquidityAfter.toNumber() - totalLiquidityBefore.toNumber()

            // The increase should only be the liquidity_fee portion of position fees
            // Position fee is 0.1% of size, split 50/50: liquidity_fee = 10000 * 0.001 / 2 = 5
            expect(totalLiquidityAfter.toNumber()).gt(totalLiquidityBefore.toNumber())
            expect(liquidityIncrease).lt(Number(expandDecimals(10))) // Much less than PnL

            // total_reserves should decrease significantly due to PnL payout
            expect(totalReservesAfter.toNumber()).lt(totalReservesBefore.toNumber())

            // Verify total_liquidity > total_reserves (because reserves decreased but liquidity only increased by small fee)
            expect(totalLiquidityAfter.toNumber()).gt(totalReservesAfter.toNumber())
        })

        it("total_liquidity unchanged by funding rate profit when closing position", async () => {
            // Set fees to zero to isolate funding rate effects
            await call(
                vault.functions
                    .set_fees(
                        0, // liquidity_fee_basis_points
                        0, // position_fee_basis_points
                        0, // liquidation_fee
                    )
                    .addContracts([attachedContracts[1]]),
            )

            await call(USDC.functions.mint(user1Identity, expandDecimals(50000)))

            // Open a large long position
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(10000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(2000), USDC_ASSET_ID],
                    }),
            )

            const totalLiquidityBefore = (await vault.functions.get_total_liquidity().get()).value
            const totalReservesBefore = (await vault.functions.get_total_reserves().get()).value

            // Generate funding rate profit by waiting and creating imbalance
            // Longs pay shorts when longs > shorts
            // We need shorts to pay longs, so we create more shorts
            await call(USDC.functions.mint(user0Identity, expandDecimals(50000)))
            await call(
                vaultUser0.functions
                    .increase_position(user0Identity, BTC_ASSET, expandDecimals(20000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(3000), USDC_ASSET_ID],
                    }),
            )

            // Now longs (user1) should receive funding rate (shorts pay longs)
            // Wait for time to pass to accumulate funding rate
            await moveBlockchainTime(launchedNode, 1000)

            // Update price to refresh timestamp
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(40000, 18)))
            await call(storkMock.functions.update_price(USDC_ASSET, expandDecimals(1, 18)))

            // Get position details
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value

            // Verify position has funding rate profit
            const [fundingRate, fundingHasProfit] = (
                await vault.functions.get_position_funding_rate(user1Identity, BTC_ASSET, true).get()
            ).value
            expect(fundingHasProfit).eq(true)
            expect(fundingRate.toNumber()).gt(0) // Has funding rate profit

            // Close position completely - this will pay out funding rate from reserves
            await call(
                vaultUser1.functions
                    .decrease_position(user1Identity, BTC_ASSET, position.collateral, position.size, true, user1Identity)
                    .addContracts(attachedContracts),
            )

            const totalLiquidityAfter = (await vault.functions.get_total_liquidity().get()).value
            const totalReservesAfter = (await vault.functions.get_total_reserves().get()).value

            // total_liquidity should remain unchanged (since fees are zero)
            // It should NOT be affected by the funding rate payout
            expect(totalLiquidityAfter.toNumber()).eq(totalLiquidityBefore.toNumber())

            // total_reserves should decrease due to funding rate payout
            expect(totalReservesAfter.toNumber()).lt(totalReservesBefore.toNumber())

            // Verify total_liquidity > total_reserves (because reserves decreased but liquidity unchanged)
            expect(totalLiquidityAfter.toNumber()).gt(totalReservesAfter.toNumber())
        })

        it("total_liquidity only increases by liquidity_fee when closing profitable position with fees", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(50000)))

            // Open a large position
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(10000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(2000), USDC_ASSET_ID],
                    }),
            )

            const totalLiquidityBefore = (await vault.functions.get_total_liquidity().get()).value

            // Price moves in favor of the trader (profit)
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(45000, 18)))

            // Get position details
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value

            // Verify position has profit
            const [hasProfit, pnl] = (await vault.functions.get_position_pnl(user1Identity, BTC_ASSET, true).get()).value
            expect(hasProfit).eq(true)
            expect(pnl.toNumber()).gt(Number(expandDecimals(1000))) // Significant profit

            // Calculate expected liquidity_fee for closing this position
            // Position fee = 0.1% of size_delta (10000), liquidity_fee = half of that = 5
            const expectedLiquidityFee = Math.floor(Number(expandDecimals(10000)) * 0.001 * 0.5)

            // Close position completely
            await call(
                vaultUser1.functions
                    .decrease_position(user1Identity, BTC_ASSET, position.collateral, position.size, true, user1Identity)
                    .addContracts(attachedContracts),
            )

            const totalLiquidityAfter = (await vault.functions.get_total_liquidity().get()).value
            const liquidityIncrease = totalLiquidityAfter.toNumber() - totalLiquidityBefore.toNumber()

            // total_liquidity should only increase by liquidity_fee
            // The large PnL profit does NOT affect total_liquidity
            expect(liquidityIncrease).eq(expectedLiquidityFee)

            // Verify the increase is small compared to the PnL
            expect(liquidityIncrease).lt(pnl.toNumber() / 100) // Much smaller than PnL
        })

        it("total_liquidity unchanged by losses when closing position", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(50000)))

            // Open a large position
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(10000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(2000), USDC_ASSET_ID],
                    }),
            )

            const totalLiquidityBefore = (await vault.functions.get_total_liquidity().get()).value
            const totalReservesBefore = (await vault.functions.get_total_reserves().get()).value

            // Price moves against the trader (large loss)
            // Current price is 40000, move to 35000 (10% loss)
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(35000, 18)))

            // Get position details
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value

            // Verify position has loss
            const [hasProfit, pnl] = (await vault.functions.get_position_pnl(user1Identity, BTC_ASSET, true).get()).value
            expect(hasProfit).eq(false)
            expect(pnl.toNumber()).lt(Number(expandDecimals(2000))) // not more than the collateral

            // Close position completely - losses go to reserves (increasing them)
            await call(
                vaultUser1.functions
                    .decrease_position(user1Identity, BTC_ASSET, position.collateral, position.size, true, user1Identity)
                    .addContracts(attachedContracts),
            )

            const totalLiquidityAfter = (await vault.functions.get_total_liquidity().get()).value
            const totalReservesAfter = (await vault.functions.get_total_reserves().get()).value

            // total_liquidity should only increase by liquidity_fee (small amount)
            // It should NOT be affected by the loss
            const liquidityIncrease = totalLiquidityAfter.toNumber() - totalLiquidityBefore.toNumber()
            expect(liquidityIncrease).lt(Number(expandDecimals(10))) // Small increase (just fees)

            // total_reserves should increase due to losses being added to reserves
            expect(totalReservesAfter.toNumber()).gt(totalReservesBefore.toNumber())

            // Verify total_liquidity < total_reserves (because reserves increased but liquidity only by small fee)
            expect(totalLiquidityAfter.toNumber()).lt(totalReservesAfter.toNumber())
        })
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
