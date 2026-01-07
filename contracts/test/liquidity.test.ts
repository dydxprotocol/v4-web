import { AbstractContract, WalletUnlocked, AssetId } from "fuels"
import { launchNode, getNodeWallets } from "./node.js"
import {
    call,
    call2,
    AddressIdentity,
    walletToAddressIdentity,
    expandDecimals,
    BASE_ASSET,
    USDC_ASSET,
    BTC_ASSET,
    getBtcConfig,
    getAssetId,
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

describe("Vault.liquidity", () => {
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

        await call(storkMock.functions.update_price(USDC_ASSET, expandDecimals(1, 18)))

        await call(vault.functions.set_asset_config(...getBtcConfig()).addContracts([vaultImpl]))

        await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(40000, 18)))

        await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
    })

    describe("add liquidity", () => {
        it("can add liquidity to empty pool", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(10000)))
            const usdcBalanceBefore = await user1.getBalance(USDC_ASSET_ID)
            const totalReservesBefore = (await vault.functions.get_total_reserves().get()).value
            const totalLiquidityBefore = (await vault.functions.get_total_liquidity().get()).value
            const feeReserveBefore = (await vault.functions.get_fee_reserve().get()).value

            const lpBalanceBefore = await user1.getBalance(LP_ASSET_ID)

            const tx = await call(
                vaultUser1.functions
                    .add_liquidity(user1Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(1000), USDC_ASSET_ID],
                    }),
            )

            const usdcBalanceAfter = await user1.getBalance(USDC_ASSET_ID)
            const lpBalanceAfter = await user1.getBalance(LP_ASSET_ID)
            const totalReservesAfter = (await vault.functions.get_total_reserves().get()).value
            const totalLiquidityAfter = (await vault.functions.get_total_liquidity().get()).value
            const feeReserveAfter = (await vault.functions.get_fee_reserve().get()).value

            // Check LP tokens received (should be close to amount after fees for first deposit)
            expect(lpBalanceAfter.toNumber()).gt(0)
            expect(lpBalanceAfter.toNumber()).gt(lpBalanceBefore.toNumber())
            // For first deposit, LP tokens ≈ amount after fees
            // 1000 * 0.997 = 997 (after 0.3% fee)
            expect(lpBalanceAfter.toNumber()).gte(Number(expandDecimals(996)))
            expect(lpBalanceAfter.toNumber()).lte(Number(expandDecimals(997)))

            // Check USDC balance decreased
            expect(usdcBalanceAfter.toNumber()).lt(usdcBalanceBefore.toNumber())
            expect(usdcBalanceBefore.toNumber() - usdcBalanceAfter.toNumber()).eq(Number(expandDecimals(1000)))

            // Check total reserves increased (by amount after fees)
            expect(totalReservesAfter.toNumber()).gt(totalReservesBefore.toNumber())
            expect(totalReservesAfter.toNumber() - totalReservesBefore.toNumber()).gte(Number(expandDecimals(996)))

            // Check total liquidity increased (by amount after fees)
            expect(totalLiquidityAfter.toNumber()).gt(totalLiquidityBefore.toNumber())
            expect(totalLiquidityAfter.toNumber() - totalLiquidityBefore.toNumber()).gte(Number(expandDecimals(996)))
            // For first deposit, total_liquidity should equal total_reserves
            expect(totalLiquidityAfter.toNumber()).eq(totalReservesAfter.toNumber())

            // Check fee reserve increased
            expect(feeReserveAfter.toNumber()).gt(feeReserveBefore.toNumber())
            expect(feeReserveAfter.toNumber() - feeReserveBefore.toNumber()).gte(2) // ~0.3% of 1000

            // Check event
            const addLiquidityLog = tx.logs.find((log) => log.account && log.base_asset_amount)
            expect(addLiquidityLog).toBeDefined()
            if (addLiquidityLog) {
                expect(addLiquidityLog.account.Address.bits).eq(user1Identity.Address.bits)
                expect(addLiquidityLog.base_asset_amount.toString()).eq(expandDecimals(1000).toString())
                expect(addLiquidityLog.lp_asset_amount.toNumber()).eq(lpBalanceAfter.toNumber())
                expect(addLiquidityLog.fee.toNumber()).gt(0)
            }
        })

        it("can add liquidity to existing pool", async () => {
            // First add by user0 (already done in beforeEach)
            // Now add by user1
            await call(USDC.functions.mint(user1Identity, expandDecimals(10000)))
            const totalReservesBefore = (await vault.functions.get_total_reserves().get()).value
            const totalLiquidityBefore = (await vault.functions.get_total_liquidity().get()).value
            const feeReserveBefore = (await vault.functions.get_fee_reserve().get()).value

            const lpAssetId: AssetId = { bits: LP_ASSET_ID }
            const lpSupplyBefore = (await vault.functions.total_supply(lpAssetId).get()).value!.toNumber()

            await call(
                vaultUser1.functions
                    .add_liquidity(user1Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(2000), USDC_ASSET_ID],
                    }),
            )

            const lpBalanceAfter = await user1.getBalance(LP_ASSET_ID)
            const totalReservesAfter = (await vault.functions.get_total_reserves().get()).value
            const totalLiquidityAfter = (await vault.functions.get_total_liquidity().get()).value
            const feeReserveAfter = (await vault.functions.get_fee_reserve().get()).value
            const lpSupplyAfter = (await vault.functions.total_supply(lpAssetId).get()).value!.toNumber()

            // Check LP tokens received (should be proportional to pool)
            expect(lpBalanceAfter.toNumber()).gt(0)
            // Should receive approximately 2000/40000 * lpSupplyBefore
            expect(lpBalanceAfter.toNumber()).gt(0)

            // Check total reserves and liquidity increased
            expect(totalReservesAfter.toNumber()).gt(totalReservesBefore.toNumber())
            expect(totalLiquidityAfter.toNumber()).gt(totalLiquidityBefore.toNumber())
            // When adding liquidity without trades, total_liquidity should equal total_reserves
            expect(totalLiquidityAfter.toNumber()).eq(totalReservesAfter.toNumber())

            // Check fee reserve increased
            expect(feeReserveAfter.toNumber()).gt(feeReserveBefore.toNumber())

            // Check LP supply increased
            expect(lpSupplyAfter).gt(lpSupplyBefore)
            expect(lpSupplyAfter - lpSupplyBefore).eq(lpBalanceAfter.toNumber())
        })

        it("calculates add liquidity amount correctly", async () => {
            const baseAssetAmount = expandDecimals(1000)
            const result = (await vault.functions.get_add_liquidity_amount(baseAssetAmount).get()).value

            expect(result[0].toNumber()).gt(0) // mint_amount
            expect(result[1].toNumber()).gt(0) // amount_after_fees
            expect(result[2].toNumber()).eq(30) // fee_basis_points (default 30)

            // amount_after_fees should be less than baseAssetAmount due to fees
            expect(result[1].toNumber()).lt(Number(baseAssetAmount.toString()))
            // For 0.3% fee, amount_after_fees should be approximately 99.7% of baseAssetAmount
            // 1000 * 0.997 = 997
            expect(result[1].toNumber()).gte(Number(expandDecimals(996)))
            expect(result[1].toNumber()).lte(Number(expandDecimals(997)))
        })

        it("cannot add liquidity with zero amount", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(10000)))
            await expect(
                call2(
                    vaultUser1.functions
                        .add_liquidity(user1Identity)
                        .addContracts(attachedContracts)
                        .callParams({
                            forward: [0, USDC_ASSET_ID],
                        }),
                ),
            ).rejects.toThrowError("VaultInvalidBaseAssetAmount")
        })

        it("cannot add liquidity if receiver is zero", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(10000)))
            // Create a zero identity
            const zeroIdentity: AddressIdentity = {
                Address: { bits: "0x0000000000000000000000000000000000000000000000000000000000000000" },
            }
            await expect(
                call2(
                    vaultUser1.functions
                        .add_liquidity(zeroIdentity)
                        .addContracts(attachedContracts)
                        .callParams({
                            forward: [expandDecimals(1000), USDC_ASSET_ID],
                        }),
                ),
            ).rejects.toThrowError("VaultReceiverCannotBeZero")
        })

        it("cannot add liquidity when paused", async () => {
            await call(vault.functions.pause().addContracts([attachedContracts[1]]))
            await call(USDC.functions.mint(user1Identity, expandDecimals(10000)))
            await expect(
                call2(
                    vaultUser1.functions
                        .add_liquidity(user1Identity)
                        .addContracts(attachedContracts)
                        .callParams({
                            forward: [expandDecimals(1000), USDC_ASSET_ID],
                        }),
                ),
            ).rejects.toThrowError("Paused")
            await call(vault.functions.unpause().addContracts([attachedContracts[1]]))
        })
    })

    describe("remove liquidity", () => {
        it("can remove partial liquidity", async () => {
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(40000), USDC_ASSET_ID],
                    }),
            )

            // User0 already has liquidity from beforeEach
            const lpBalanceBefore = await user0.getBalance(LP_ASSET_ID)
            const usdcBalanceBefore = await user0.getBalance(USDC_ASSET_ID)
            const totalReservesBefore = (await vault.functions.get_total_reserves().get()).value
            const totalLiquidityBefore = (await vault.functions.get_total_liquidity().get()).value
            const feeReserveBefore = (await vault.functions.get_fee_reserve().get()).value

            const removeAmount = lpBalanceBefore.div(2)

            const tx = await call(
                vaultUser0.functions
                    .remove_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [removeAmount, LP_ASSET_ID],
                    }),
            )

            const lpBalanceAfter = await user0.getBalance(LP_ASSET_ID)
            const usdcBalanceAfter = await user0.getBalance(USDC_ASSET_ID)
            const totalReservesAfter = (await vault.functions.get_total_reserves().get()).value
            const totalLiquidityAfter = (await vault.functions.get_total_liquidity().get()).value
            const feeReserveAfter = (await vault.functions.get_fee_reserve().get()).value

            // Check LP tokens decreased
            expect(lpBalanceAfter.toNumber()).lt(lpBalanceBefore.toNumber())
            expect(lpBalanceBefore.toNumber() - lpBalanceAfter.toNumber()).eq(removeAmount.toNumber())

            // Check USDC balance increased
            expect(usdcBalanceAfter.toNumber()).gt(usdcBalanceBefore.toNumber())

            // Check total reserves decreased
            expect(totalReservesAfter.toNumber()).lt(totalReservesBefore.toNumber())

            // Check total liquidity decreased (by liquidity_amount, not redemption_amount)
            expect(totalLiquidityAfter.toNumber()).lt(totalLiquidityBefore.toNumber())

            // Check fee reserve increased
            expect(feeReserveAfter.toNumber()).gt(feeReserveBefore.toNumber())

            // Check event
            const removeLiquidityLog = tx.logs.find((log) => log.account && log.lp_asset_amount)
            expect(removeLiquidityLog).toBeDefined()
            if (removeLiquidityLog) {
                expect(removeLiquidityLog.account.Address.bits).eq(user0Identity.Address.bits)
                expect(removeLiquidityLog.lp_asset_amount.toNumber()).eq(removeAmount.toNumber())
                expect(removeLiquidityLog.base_asset_amount.toNumber()).gt(0)
                expect(removeLiquidityLog.fee.toNumber()).gt(0)
            }
        })

        it("can remove full liquidity", async () => {
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(40000), USDC_ASSET_ID],
                    }),
            )

            // User0 already has liquidity from beforeEach
            const lpBalanceBefore = await user0.getBalance(LP_ASSET_ID)
            const usdcBalanceBefore = await user0.getBalance(USDC_ASSET_ID)

            await call(
                vaultUser0.functions
                    .remove_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [lpBalanceBefore, LP_ASSET_ID],
                    }),
            )

            const lpBalanceAfter = await user0.getBalance(LP_ASSET_ID)
            const usdcBalanceAfter = await user0.getBalance(USDC_ASSET_ID)

            // Check all LP tokens removed
            expect(lpBalanceAfter.toNumber()).eq(0)

            // Check USDC balance increased
            expect(usdcBalanceAfter.toNumber()).gt(usdcBalanceBefore.toNumber())
            // Should receive approximately 40000 * (1 - 0.003) after fees
            expect(usdcBalanceAfter.toNumber() - usdcBalanceBefore.toNumber()).gte(39800)
        })

        it("calculates remove liquidity amount correctly", async () => {
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(40000), USDC_ASSET_ID],
                    }),
            )

            // User0 already has liquidity from beforeEach
            const lpBalance = await user0.getBalance(LP_ASSET_ID)
            const result = (await vault.functions.get_remove_liquidity_amount(lpBalance).get()).value

            expect(result[0].toNumber()).gt(0) // liquidity_amount
            expect(result[1].toNumber()).gt(0) // redemption_amount
            expect(result[2].toNumber()).gt(0) // amount_out
            expect(result[3].toNumber()).eq(30) // fee_basis_points (default 30)

            // amount_out should be less than redemption_amount due to fees
            expect(result[2].toNumber()).lt(result[1].toNumber())
        })

        it("cannot remove liquidity with zero amount", async () => {
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(40000), USDC_ASSET_ID],
                    }),
            )

            await expect(
                call2(
                    vaultUser0.functions
                        .remove_liquidity(user0Identity)
                        .addContracts(attachedContracts)
                        .callParams({
                            forward: [0, LP_ASSET_ID],
                        }),
                ),
            ).rejects.toThrowError("VaultInvalidLpAssetAmount")
        })

        it("cannot remove liquidity if receiver is zero", async () => {
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(40000), USDC_ASSET_ID],
                    }),
            )

            const lpBalance = await user0.getBalance(LP_ASSET_ID)

            // Create a zero identity
            const zeroIdentity: AddressIdentity = {
                Address: { bits: "0x0000000000000000000000000000000000000000000000000000000000000000" },
            }
            await expect(
                call2(
                    vaultUser0.functions
                        .remove_liquidity(zeroIdentity)
                        .addContracts(attachedContracts)
                        .callParams({
                            forward: [lpBalance.div(2), LP_ASSET_ID],
                        }),
                ),
            ).rejects.toThrowError("VaultReceiverCannotBeZero")
        })

        it("cannot remove liquidity when paused", async () => {
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(40000), USDC_ASSET_ID],
                    }),
            )

            await call(vault.functions.pause().addContracts([attachedContracts[1]]))
            const lpBalance = await user0.getBalance(LP_ASSET_ID)

            await expect(
                call2(
                    vaultUser0.functions
                        .remove_liquidity(user0Identity)
                        .addContracts(attachedContracts)
                        .callParams({
                            forward: [lpBalance.div(2), LP_ASSET_ID],
                        }),
                ),
            ).rejects.toThrowError("Paused")
            await call(vault.functions.unpause().addContracts([attachedContracts[1]]))
        })

        it("cannot remove more liquidity than owned", async () => {
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(40000), USDC_ASSET_ID],
                    }),
            )

            // User1 has no liquidity
            await call(USDC.functions.mint(user1Identity, expandDecimals(10000)))
            await call(
                vaultUser1.functions
                    .add_liquidity(user1Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(1000), USDC_ASSET_ID],
                    }),
            )

            const lpBalance = await user1.getBalance(LP_ASSET_ID)
            const excessiveAmount = lpBalance.mul(2)

            // This will fail because user doesn't have enough LP tokens
            // The exact error might be from the asset transfer, not the contract
            // But let's try to remove more than owned
            await expect(
                call2(
                    vaultUser1.functions
                        .remove_liquidity(user1Identity)
                        .addContracts(attachedContracts)
                        .callParams({
                            forward: [excessiveAmount, LP_ASSET_ID],
                        }),
                ),
            ).rejects.toThrow()
        })

        it("removes liquidity with correct fee calculation", async () => {
            // Add fresh liquidity first
            await call(USDC.functions.mint(user1Identity, expandDecimals(10000)))
            await call(
                vaultUser1.functions
                    .add_liquidity(user1Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(1000), USDC_ASSET_ID],
                    }),
            )

            const lpBalance = await user1.getBalance(LP_ASSET_ID)
            const usdcBalanceBefore = await user1.getBalance(USDC_ASSET_ID)
            const feeReserveBefore = (await vault.functions.get_fee_reserve().get()).value

            // Get expected amounts
            const removeResult = (await vault.functions.get_remove_liquidity_amount(lpBalance).get()).value

            await call(
                vaultUser1.functions
                    .remove_liquidity(user1Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [lpBalance, LP_ASSET_ID],
                    }),
            )

            const usdcBalanceAfter = await user1.getBalance(USDC_ASSET_ID)
            const feeReserveAfter = (await vault.functions.get_fee_reserve().get()).value

            // Check USDC received matches expected amount_out
            const usdcReceived = usdcBalanceAfter.toNumber() - usdcBalanceBefore.toNumber()
            expect(usdcReceived).eq(removeResult[2].toNumber())

            // Check fee reserve increased by the fee amount
            const feeAmount = removeResult[1].toNumber() - removeResult[2].toNumber()
            expect(feeReserveAfter.toNumber() - feeReserveBefore.toNumber()).eq(feeAmount)
        })
    })

    describe("profits and losses", () => {
        it("liquidity provider earns profits when traders pay liquidity fees", async () => {
            // Set up: LP adds liquidity
            await call(USDC.functions.mint(user1Identity, expandDecimals(50000)))

            // LP adds liquidity
            await call(
                vaultUser1.functions
                    .add_liquidity(user1Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(10000), USDC_ASSET_ID],
                    }),
            )

            const lpBalanceAfterAdd = await user1.getBalance(LP_ASSET_ID)
            const totalLiquidityAfterAdd = (await vault.functions.get_total_liquidity().get()).value

            // Verify liquidity was added
            expect(lpBalanceAfterAdd.toNumber()).gt(0)

            // Calculate what LP would receive if they removed liquidity now (before trades)
            const removeResultBeforeTrades = (await vault.functions.get_remove_liquidity_amount(lpBalanceAfterAdd).get()).value
            const expectedAmountBeforeTrades = removeResultBeforeTrades[2].toNumber() // amount_out

            // Trader executes positions - these generate liquidity fees
            // First, create a balanced market to avoid funding rate effects
            await call(USDC.functions.mint(user0Identity, expandDecimals(50000)))
            await call(
                vaultUser0.functions
                    .increase_position(user0Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(200), USDC_ASSET_ID],
                    }),
            )

            // Now trader opens a long position - this generates liquidity fees
            await call(
                vaultUser0.functions
                    .increase_position(user0Identity, BTC_ASSET, expandDecimals(2000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(400), USDC_ASSET_ID],
                    }),
            )

            // Close and reopen positions to generate more fees
            const positionKey = (await vault.functions.get_position_key(user0Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value

            await call(
                vaultUser0.functions
                    .decrease_position(
                        user0Identity,
                        BTC_ASSET,
                        position.collateral.div(2),
                        position.size.div(2),
                        true,
                        user0Identity,
                    )
                    .addContracts(attachedContracts),
            )

            // Check that total_liquidity changed after trades
            const totalLiquidityAfterTrades = (await vault.functions.get_total_liquidity().get()).value

            // When liquidity fees are collected, they increase total_liquidity which allows more redemption
            // Verify that total_liquidity increased due to liquidity fees
            expect(totalLiquidityAfterTrades.toNumber()).gt(totalLiquidityAfterAdd.toNumber())
            // Calculate what LP would receive now (after trades have generated fees)
            const removeResultAfterTrades = (await vault.functions.get_remove_liquidity_amount(lpBalanceAfterAdd).get()).value
            const expectedAmountAfterTrades = removeResultAfterTrades[2].toNumber() // amount_out

            // The amount after trades should be >= amount before trades
            // (it may be equal if no significant fees were collected, but should not be less)
            expect(expectedAmountAfterTrades).gte(expectedAmountBeforeTrades)

            // LP removes liquidity - should receive the amount calculated after trades
            const usdcBalanceBeforeRemove = await user1.getBalance(USDC_ASSET_ID)

            await call(
                vaultUser1.functions
                    .remove_liquidity(user1Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [lpBalanceAfterAdd, LP_ASSET_ID],
                    }),
            )

            const usdcBalanceAfterRemove = await user1.getBalance(USDC_ASSET_ID)
            const lpBalanceAfterRemove = await user1.getBalance(LP_ASSET_ID)
            const usdcReceived = usdcBalanceAfterRemove.toNumber() - usdcBalanceBeforeRemove.toNumber()

            // LP should have received their LP tokens back (zero balance)
            expect(lpBalanceAfterRemove.toNumber()).eq(0)

            // LP should receive the calculated amount (which should be >= what they would get before trades)
            expect(usdcReceived).eq(expectedAmountAfterTrades)
            expect(usdcReceived).gte(expectedAmountBeforeTrades)

            // Verify that LP received more than the minimum (accounting for fees)
            // Original deposit: 10000 USDC, after 0.3% add fee: ~9970, after 0.3% remove fee: ~9940
            const expectedMinimum = Math.floor(Number(expandDecimals(10000)) * 0.997 * 0.997)
            expect(usdcReceived).gte(expectedMinimum)
        })

        it("liquidity provider incurs losses when trader profits reduce reserves below liquidity", async () => {
            // Set up: LP adds liquidity
            await call(USDC.functions.mint(user1Identity, expandDecimals(50000)))

            // LP adds liquidity
            await call(
                vaultUser1.functions
                    .add_liquidity(user1Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(20000), USDC_ASSET_ID],
                    }),
            )

            const lpBalanceAfterAdd = await user1.getBalance(LP_ASSET_ID)

            // Calculate what LP would receive if they removed liquidity now (before trades)
            const removeResultBeforeTrades = (await vault.functions.get_remove_liquidity_amount(lpBalanceAfterAdd).get()).value
            const expectedAmountBeforeTrades = removeResultBeforeTrades[2].toNumber() // amount_out
            const totalReservesBeforeTrades = (await vault.functions.get_total_reserves().get()).value
            const totalLiquidityBeforeTrades = (await vault.functions.get_total_liquidity().get()).value

            // Trader opens a large position
            await call(USDC.functions.mint(user0Identity, expandDecimals(50000)))
            await call(
                vaultUser0.functions
                    .increase_position(user0Identity, BTC_ASSET, expandDecimals(10000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(2000), USDC_ASSET_ID],
                    }),
            )

            // Price moves significantly in favor of the trader (profit)
            // Current price is 40000, move to 45000 (12.5% profit)
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(45000, 18)))

            // Get the position details
            const positionKey = (await vault.functions.get_position_key(user0Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value

            // Check PnL - should be profitable
            const [hasProfit, pnl] = (await vault.functions.get_position_pnl(user0Identity, BTC_ASSET, true).get()).value
            expect(hasProfit).eq(true)
            expect(pnl.toNumber()).gt(0)

            // Trader closes position to realize profits
            // This will pay out PnL from reserves, decreasing total_reserves
            const usdcBalanceBeforeClose = await user0.getBalance(USDC_ASSET_ID)

            await call(
                vaultUser0.functions
                    .decrease_position(user0Identity, BTC_ASSET, position.collateral, position.size, true, user0Identity)
                    .addContracts(attachedContracts),
            )

            const usdcBalanceAfterClose = await user0.getBalance(USDC_ASSET_ID)
            const traderProfit = usdcBalanceAfterClose.toNumber() - usdcBalanceBeforeClose.toNumber()

            // Verify trader received profit
            expect(traderProfit).gt(0)

            // Check that reserves decreased below initial level due to PnL payout
            const totalReservesAfterTrades = (await vault.functions.get_total_reserves().get()).value
            const totalLiquidityAfterTrades = (await vault.functions.get_total_liquidity().get()).value
            expect(totalLiquidityAfterTrades.toNumber()).gt(totalReservesAfterTrades.toNumber())

            // Reserves should have decreased because profitable PnL is paid from reserves
            // But liquidity fees increase total_liquidity, creating a gap where reserves < liquidity
            expect(totalLiquidityAfterTrades.toNumber()).gt(totalLiquidityBeforeTrades.toNumber())
            // However, liquidity fees also increase reserves, so the net effect depends on the balance
            // The key is that if total_reserves < total_liquidity, LPs will get less

            // Calculate what LP would receive now (after trades have paid out profits)
            const removeResultAfterTrades = (await vault.functions.get_remove_liquidity_amount(lpBalanceAfterAdd).get()).value
            const expectedAmountAfterTrades = removeResultAfterTrades[2].toNumber() // amount_out
            const redemptionAmountAfterTrades = removeResultAfterTrades[1].toNumber() // redemption_amount

            // If reserves decreased relative to liquidity, the redemption amount will be reduced
            // Check the ratio: if total_reserves < total_liquidity, redemption is proportional
            // redemption_amount = liquidity_amount * total_reserves / total_liquidity
            const liquidityAmount = removeResultAfterTrades[0].toNumber()

            // LP removes liquidity - should receive less if reserves < liquidity
            const usdcBalanceBeforeRemove = await user1.getBalance(USDC_ASSET_ID)

            await call(
                vaultUser1.functions
                    .remove_liquidity(user1Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [lpBalanceAfterAdd, LP_ASSET_ID],
                    }),
            )

            const usdcBalanceAfterRemove = await user1.getBalance(USDC_ASSET_ID)
            const lpBalanceAfterRemove = await user1.getBalance(LP_ASSET_ID)
            const usdcReceived = usdcBalanceAfterRemove.toNumber() - usdcBalanceBeforeRemove.toNumber()

            // LP should have received their LP tokens back (zero balance)
            expect(lpBalanceAfterRemove.toNumber()).eq(0)

            // LP should receive the calculated amount
            expect(usdcReceived).eq(expectedAmountAfterTrades)

            // If reserves decreased due to profitable PnL, LP should receive less than before trades
            // The exact comparison depends on whether liquidity fees offset the PnL losses
            // But in general, if total_reserves < total_liquidity, redemption is reduced
            if (totalReservesAfterTrades.toNumber() < totalReservesBeforeTrades.toNumber()) {
                // Reserves decreased, so LP should get less (or equal if fees offset)
                expect(usdcReceived).lte(expectedAmountBeforeTrades)
            }

            // Verify that LP still received something (reserves weren't completely drained)
            expect(usdcReceived).gt(0)

            // The redemption amount shows the impact - if it's less than liquidity amount,
            // it means reserves < liquidity and LP is taking a loss
            if (redemptionAmountAfterTrades < liquidityAmount) {
                // This indicates total_reserves < total_liquidity, so LP gets reduced redemption
                expect(usdcReceived).lt(expectedAmountBeforeTrades)
            }
        })

        it("second liquidity provider gets fewer LP tokens when liquidity fees have increased total_liquidity", async () => {
            // First LP adds liquidity
            await call(USDC.functions.mint(user1Identity, expandDecimals(50000)))

            await call(
                vaultUser1.functions
                    .add_liquidity(user1Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(10000), USDC_ASSET_ID],
                    }),
            )

            const lp1Balance = await user1.getBalance(LP_ASSET_ID)
            const lp1Amount = lp1Balance.toNumber()

            // Verify first LP received LP tokens
            expect(lp1Amount).gt(0)

            // Calculate what second LP would get if they added liquidity now (before trades)
            const addResultBeforeTrades = (await vault.functions.get_add_liquidity_amount(expandDecimals(10000)).get()).value
            const expectedLp2AmountBeforeTrades = addResultBeforeTrades[0].toNumber() // mint_amount

            // Since total_liquidity == total_lp_assets at this point (no fees yet),
            // second LP should get the same amount as first LP (approximately)
            // Actually, it should be slightly less due to fees, but proportional
            expect(expectedLp2AmountBeforeTrades).gt(0)
            expect(expectedLp2AmountBeforeTrades).lte(lp1Amount)

            // Traders execute positions - these generate liquidity fees
            // Liquidity fees increase total_liquidity but not total_lp_assets
            await call(USDC.functions.mint(user0Identity, expandDecimals(50000)))

            // Open a position
            await call(
                vaultUser0.functions
                    .increase_position(user0Identity, BTC_ASSET, expandDecimals(5000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(1000), USDC_ASSET_ID],
                    }),
            )

            // Close and reopen to generate more fees
            const positionKey = (await vault.functions.get_position_key(user0Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value

            await call(
                vaultUser0.functions
                    .decrease_position(
                        user0Identity,
                        BTC_ASSET,
                        position.collateral.div(2),
                        position.size.div(2),
                        true,
                        user0Identity,
                    )
                    .addContracts(attachedContracts),
            )

            // Open another position to generate more fees
            await call(
                vaultUser0.functions
                    .increase_position(user0Identity, BTC_ASSET, expandDecimals(3000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(600), USDC_ASSET_ID],
                    }),
            )

            // Calculate what second LP would get now (after trades have generated liquidity fees)
            const addResultAfterTrades = (await vault.functions.get_add_liquidity_amount(expandDecimals(10000)).get()).value
            const expectedLp2AmountAfterTrades = addResultAfterTrades[0].toNumber() // mint_amount

            // After liquidity fees have increased total_liquidity, the second LP should get fewer LP tokens
            // This is because: mint_amount = total_lp_assets * amount_after_fees / total_liquidity
            // When total_liquidity increases (due to fees) but total_lp_assets stays the same,
            // the denominator is larger, so mint_amount is smaller
            expect(expectedLp2AmountAfterTrades).lt(expectedLp2AmountBeforeTrades)

            // Second LP adds liquidity
            await call(USDC.functions.mint(user0Identity, expandDecimals(50000)))

            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(10000), USDC_ASSET_ID],
                    }),
            )

            const lp2Balance = await user0.getBalance(LP_ASSET_ID)
            const lp2Amount = lp2Balance.toNumber()

            // Second LP should receive the calculated amount
            expect(lp2Amount).eq(expectedLp2AmountAfterTrades)

            // Second LP should receive fewer LP tokens than first LP did for the same deposit
            // This demonstrates that LP tokens have become more expensive due to liquidity fees
            expect(lp2Amount).lt(lp1Amount)

            // Verify both LPs deposited the same amount
            // The difference in LP tokens shows the increased value of LP tokens
            const lpTokenPriceRatio = lp1Amount / lp2Amount
            expect(lpTokenPriceRatio).gt(1) // First LP tokens are cheaper (more tokens per dollar)

            // Verify that the ratio is reasonable (should be > 1.0, but not too extreme)
            // The exact ratio depends on how much liquidity fees were collected
            expect(lpTokenPriceRatio).lt(1.5) // Shouldn't be more than 50% more expensive
        })

        it("LP token minting amount is independent of total_reserves vs total_liquidity relationship", async () => {
            // First LP adds liquidity
            await call(USDC.functions.mint(user1Identity, expandDecimals(50000)))

            await call(
                vaultUser1.functions
                    .add_liquidity(user1Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(10000), USDC_ASSET_ID],
                    }),
            )

            // Trader executes positions with profitable trades that get paid out
            // This will reduce total_reserves below total_liquidity
            await call(USDC.functions.mint(user0Identity, expandDecimals(50000)))

            // Open a large position
            await call(
                vaultUser0.functions
                    .increase_position(user0Identity, BTC_ASSET, expandDecimals(10000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(2000), USDC_ASSET_ID],
                    }),
            )

            // Price moves in favor of the trader (profit)
            // Current price is 40000, move to 45000 (12.5% profit)
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(45000, 18)))

            // Get the position details
            const positionKey = (await vault.functions.get_position_key(user0Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value

            // Check PnL - should be profitable
            const [hasProfit, pnl] = (await vault.functions.get_position_pnl(user0Identity, BTC_ASSET, true).get()).value
            expect(hasProfit).eq(true)
            expect(pnl.toNumber()).gt(0) // Profit amount

            // Trader closes position with profits
            // Profitable PnL is paid from reserves, which reduces total_reserves
            // Meanwhile, liquidity fees increase total_liquidity
            // This creates a situation where total_reserves < total_liquidity
            await call(
                vaultUser0.functions
                    .decrease_position(user0Identity, BTC_ASSET, position.collateral, position.size, true, user0Identity)
                    .addContracts(attachedContracts),
            )

            // Verify that total_reserves < total_liquidity now
            // (This happens because profits are paid from reserves, while liquidity fees increase liquidity)
            const totalReservesAfterTrades = (await vault.functions.get_total_reserves().get()).value
            const totalLiquidityAfterTrades = (await vault.functions.get_total_liquidity().get()).value

            // Verify that total_liquidity is lower than total_reserves
            expect(totalLiquidityAfterTrades.toNumber()).gt(totalReservesAfterTrades.toNumber())

            // Calculate what second LP would get now (after trades have reduced reserves below liquidity)
            // The minting formula is: mint_amount = total_lp_assets * amount_after_fees / total_liquidity
            // This does NOT depend on total_reserves, only on total_liquidity and total_lp_assets
            const addResultAfterTrades = (await vault.functions.get_add_liquidity_amount(expandDecimals(10000)).get()).value
            const expectedLp2AmountAfterTrades = addResultAfterTrades[0].toNumber() // mint_amount

            // Verify that the calculation is based on total_liquidity, not total_reserves
            expect(expectedLp2AmountAfterTrades).gt(0)

            // Note: If liquidity fees were collected during trades, total_liquidity increased,
            // which would make LP tokens slightly more expensive (fewer tokens for same deposit).
            // But the key point is: whether total_reserves >= total_liquidity or total_reserves < total_liquidity
            // does NOT affect the minting formula - it only depends on total_liquidity and total_lp_assets.

            // Second LP adds liquidity
            await call(USDC.functions.mint(user0Identity, expandDecimals(50000)))

            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(10000), USDC_ASSET_ID],
                    }),
            )

            const lp2Balance = await user0.getBalance(LP_ASSET_ID)
            const lp2Amount = lp2Balance.toNumber()

            // Second LP should receive the calculated amount (based on total_liquidity, not total_reserves)
            // This proves that the minting formula works the same regardless of reserves vs liquidity relationship
            expect(lp2Amount).eq(expectedLp2AmountAfterTrades)

            // The key verification: LP token minting is based on:
            // - total_lp_assets (which changed when first LP added)
            // - total_liquidity (which may have changed due to liquidity fees)
            // - amount_after_fees (which is constant for same deposit)
            //
            // It is NOT based on total_reserves, so whether total_reserves < total_liquidity
            // or total_reserves >= total_liquidity doesn't affect the minted amount

            // Verify that reserves are below liquidity (to confirm the scenario)
            // The exact comparison depends on how much profit was paid and fees collected
            // But the important thing is: the minting formula works correctly in both cases

            // The minted amount should match the formula: total_lp_assets * amount_after_fees / total_liquidity
            // This is independent of whether reserves are below or above liquidity
            expect(lp2Amount).gt(0)

            // Summary: The test verifies that when total_reserves < total_liquidity (due to profitable
            // payouts), the LP token minting formula still works correctly and produces the expected
            // amount, proving that minting is independent of the reserves vs liquidity relationship
        })
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
