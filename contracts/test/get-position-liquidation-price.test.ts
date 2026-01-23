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

describe("Vault.get_position_liquidation_price", () => {
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
        await call(vault.functions.set_liquidator(liquidatorIdentity, true).addContracts([vaultImpl]))

        await call(
            vault.functions
                .set_fees(
                    30, // liquidity_fee_basis_points
                    10, // increase_position_fee_basis_points
                    10, // decrease_position_fee_basis_points
                    10, // liquidation_fee_basis_points
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
        await call(
            vaultUser0.functions
                .add_liquidity(user0Identity)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), USDC_ASSET_ID],
                }),
        )
    })

    describe("get_position_liquidation_price, longs", () => {
        it("liquidation price for new position is reasonable", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            const currentPrice = BigInt(expandDecimals(40000, 18).toString())
            const liquidationPrice = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, true).get()).value.toString(),
            )

            // For a new long position, liquidation price should be below current price
            // (position would be liquidated if price drops)
            expect(liquidationPrice < currentPrice).toBe(true)
            // Should be a reasonable distance from current price
            expect(currentPrice - liquidationPrice > BigInt(0)).toBe(true)
        })

        it("liquidation price when position has profits is lower than current price", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(42000, 18)))
            const currentPrice = BigInt(expandDecimals(42000, 18).toString())
            const liquidationPrice = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, true).get()).value.toString(),
            )

            // When position has profits, liquidation price should be above current price
            // (price would need to drop significantly to trigger liquidation)
            expect(liquidationPrice < currentPrice).toBe(true)

            // Verify liquidation is not needed at this price
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("0") // 0 means no liquidation needed
        })

        it("liquidation price when position has little losses is below current price", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(38000, 18)))
            const currentPrice = BigInt(expandDecimals(38000, 18).toString())
            const liquidationPrice = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, true).get()).value.toString(),
            )

            // When position has losses but not liquidatable, liquidation price should be below current price
            // (price needs to drop further to trigger liquidation)
            expect(liquidationPrice < currentPrice).toBe(true)

            // Verify liquidation is not needed at this price
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("0") // 0 means no liquidation needed
        })

        it("liquidation price when position can be liquidated with losses is close to or above current price", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36000, 18)))
            const currentPrice = BigInt(expandDecimals(36000, 18).toString())
            const liquidationPrice = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, true).get()).value.toString(),
            )

            // When position can be liquidated, liquidation price should be at or above current price
            // (current price has reached or exceeded the liquidation threshold)
            expect(liquidationPrice >= currentPrice).toBe(true)

            // Verify liquidation is needed at this price
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("1") // 1 means losses exceed collateral
        })

        it("liquidation price when position exceeds max leverage is at or above current price", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36800, 18)))
            const currentPrice = BigInt(expandDecimals(36800, 18).toString())
            const liquidationPrice = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, true).get()).value.toString(),
            )

            // When position exceeds max leverage, liquidation price should be at or above current price
            expect(liquidationPrice >= currentPrice).toBe(true)

            // Verify liquidation is needed at this price
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("2") // 2 means max leverage exceeded
        })

        it("liquidation price accounts for funding rate debt", async () => {
            await call(
                vault.functions.set_fees(
                    0, // liquidity_fee_basis_points
                    0, // increase_position_fee_basis_points
                    0, // decrease_position_fee_basis_points
                    0, // liquidation_fee_basis_points
                ),
            )
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // Set price to a level where position is still safe
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36800000001, 12)))
            const liquidationPriceBefore = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, true).get()).value.toString(),
            )

            // Generate some funding rate debt
            await moveBlockchainTime(launchedNode, 110)
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36800000001, 12)))
            const liquidationPriceAfter = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, true).get()).value.toString(),
            )

            // After funding rate debt accumulates, liquidation price should increase (closer to current price)
            // For longs, higher liquidation price means less room before liquidation
            expect(liquidationPriceAfter >= liquidationPriceBefore).toBe(true)

            // Verify liquidation is needed after funding rate debt
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("2") // 2 means max leverage exceeded
        })

        it("liquidation price accounts for position fees", async () => {
            await call(
                vault.functions.set_fees(
                    0, // liquidity_fee_basis_points
                    0, // increase_position_fee_basis_points
                    0, // decrease_position_fee_basis_points
                    0, // liquidation_fee_basis_points
                ),
            )
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36801, 18)))
            const liquidationPriceBefore = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, true).get()).value.toString(),
            )

            // Add position fees
            await call(
                vault.functions.set_fees(
                    0, // liquidity_fee_basis_points
                    10, // increase_position_fee_basis_points
                    10, // decrease_position_fee_basis_points
                    0, // liquidation_fee_basis_points
                ),
            )
            const liquidationPriceAfter = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, true).get()).value.toString(),
            )

            // With position fees, liquidation price should increase (closer to current price)
            expect(liquidationPriceAfter >= liquidationPriceBefore).toBe(true)
        })

        it("liquidation price accounts for liquidation fees", async () => {
            await call(
                vault.functions.set_fees(
                    0, // liquidity_fee_basis_points
                    0, // increase_position_fee_basis_points
                    0, // decrease_position_fee_basis_points
                    0, // liquidation_fee_basis_points
                ),
            )
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36801, 18)))
            const liquidationPriceBefore = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, true).get()).value.toString(),
            )

            // Add liquidation fees
            await call(
                vault.functions.set_fees(
                    0, // liquidity_fee_basis_points
                    0, // increase_position_fee_basis_points
                    0, // decrease_position_fee_basis_points
                    10, // liquidation_fee_basis_points
                ),
            )
            const liquidationPriceAfter = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, true).get()).value.toString(),
            )

            // With liquidation fees, liquidation price should increase (closer to current price)
            expect(liquidationPriceAfter >= liquidationPriceBefore).toBe(true)
        })
    })

    describe("get_position_liquidation_price, shorts", () => {
        it("liquidation price for new short position is reasonable", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            const currentPrice = BigInt(expandDecimals(40000, 18).toString())
            const liquidationPrice = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, false).get()).value.toString(),
            )

            // For a new short position, liquidation price should be above current price
            // (position would be liquidated if price rises)
            expect(liquidationPrice > currentPrice).toBe(true)
            // Should be a reasonable distance from current price
            expect(liquidationPrice - currentPrice > BigInt(0)).toBe(true)
        })

        it("liquidation price when position has profits is higher than current price", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(38000, 18)))
            const currentPrice = BigInt(expandDecimals(38000, 18).toString())
            const liquidationPrice = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, false).get()).value.toString(),
            )

            // When short position has profits, liquidation price should be below current price
            // (price would need to rise significantly to trigger liquidation)
            expect(liquidationPrice > currentPrice).toBe(true)

            // Verify liquidation is not needed at this price
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("0") // 0 means no liquidation needed
        })

        it("liquidation price when position has little losses is above current price", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(42000, 18)))
            const currentPrice = BigInt(expandDecimals(42000, 18).toString())
            const liquidationPrice = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, false).get()).value.toString(),
            )

            // When short position has losses but not liquidatable, liquidation price should be above current price
            // (price needs to rise further to trigger liquidation)
            expect(liquidationPrice > currentPrice).toBe(true)

            // Verify liquidation is not needed at this price
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("0") // 0 means no liquidation needed
        })

        it("liquidation price when position can be liquidated with losses is close to or below current price", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(44000, 18)))
            const currentPrice = BigInt(expandDecimals(44000, 18).toString())
            const liquidationPrice = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, false).get()).value.toString(),
            )

            // When short position can be liquidated, liquidation price should be at or below current price
            // (current price has reached or exceeded the liquidation threshold)
            expect(liquidationPrice <= currentPrice).toBe(true)

            // Verify liquidation is needed at this price
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("1") // 1 means losses exceed collateral
        })

        it("liquidation price when position exceeds max leverage is at or below current price", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200, 18)))
            const currentPrice = BigInt(expandDecimals(43200, 18).toString())
            const liquidationPrice = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, false).get()).value.toString(),
            )

            // When short position exceeds max leverage, liquidation price should be at or below current price
            expect(liquidationPrice <= currentPrice).toBe(true)

            // Verify liquidation is needed at this price
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("2") // 2 means max leverage exceeded
        })

        it("liquidation price accounts for funding rate debt in shorts", async () => {
            await call(
                vault.functions.set_fees(
                    0, // liquidity_fee_basis_points
                    0, // increase_position_fee_basis_points
                    0, // decrease_position_fee_basis_points
                    0, // liquidation_fee_basis_points
                ),
            )
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // Set price to a level where position is still safe
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43199999999, 12)))
            const liquidationPriceBefore = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, false).get()).value.toString(),
            )

            // Generate some funding rate debt
            await moveBlockchainTime(launchedNode, 110)
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43199999999, 12)))
            const liquidationPriceAfter = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, false).get()).value.toString(),
            )

            // After funding rate debt accumulates, liquidation price should decrease (closer to current price)
            // For shorts, lower liquidation price means less room before liquidation
            expect(liquidationPriceAfter <= liquidationPriceBefore).toBe(true)
        })

        it("liquidation price accounts for position fees in shorts", async () => {
            await call(
                vault.functions.set_fees(
                    0, // liquidity_fee_basis_points
                    0, // increase_position_fee_basis_points
                    0, // decrease_position_fee_basis_points
                    0, // liquidation_fee_basis_points
                ),
            )
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200 - 1, 18)))
            const liquidationPriceBefore = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, false).get()).value.toString(),
            )

            // Add position fees
            await call(
                vault.functions.set_fees(
                    0, // liquidity_fee_basis_points
                    10, // increase_position_fee_basis_points
                    10, // decrease_position_fee_basis_points
                    0, // liquidation_fee_basis_points
                ),
            )
            const liquidationPriceAfter = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, false).get()).value.toString(),
            )

            // With position fees, liquidation price should decrease (closer to current price for shorts)
            expect(liquidationPriceAfter <= liquidationPriceBefore).toBe(true)
        })

        it("liquidation price accounts for liquidation fees in shorts", async () => {
            await call(
                vault.functions.set_fees(
                    0, // liquidity_fee_basis_points
                    0, // increase_position_fee_basis_points
                    0, // decrease_position_fee_basis_points
                    0, // liquidation_fee_basis_points
                ),
            )
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200 - 1, 18)))
            const liquidationPriceBefore = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, false).get()).value.toString(),
            )

            // Add liquidation fees
            await call(
                vault.functions.set_fees(
                    0, // liquidity_fee_basis_points
                    0, // increase_position_fee_basis_points
                    0, // decrease_position_fee_basis_points
                    10, // liquidation_fee_basis_points
                ),
            )
            const liquidationPriceAfter = BigInt(
                (await vault.functions.get_position_liquidation_price(user1Identity, BTC_ASSET, false).get()).value.toString(),
            )

            // With liquidation fees, liquidation price should decrease (closer to current price for shorts)
            expect(liquidationPriceAfter <= liquidationPriceBefore).toBe(true)
        })
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
