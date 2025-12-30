import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { AbstractContract, WalletUnlocked } from "fuels"
import { launchNode, getNodeWallets } from "./node"
import {
    call,
    call2,
    AddressIdentity,
    walletToAddressIdentity,
    expandDecimals,
    COLLATERAL_ASSET,
    USDC_ASSET,
    BTC_ASSET,
    BTC_MAX_LEVERAGE,
    getBtcConfig,
    getUsdcConfig,
    getAssetId,
    moveBlockchainTime,
} from "./utils"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import {
    FungibleFactory,
    PricefeedWrapperFactory,
    StorkMockFactory,
    VaultExposeFactory,
    SimpleProxyFactory,
    Fungible,
    StorkMock,
    PricefeedWrapper,
    Vault,
} from "../types"

describe("Vault.funding_rate", () => {
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
                COLLATERAL_ASSET_ID: { bits: USDC_ASSET_ID },
                COLLATERAL_ASSET,
                COLLATERAL_ASSET_DECIMALS: 9,
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

        await call(vault.functions.initialize(deployerIdentity))
        await call(vault.functions.set_liquidator(liquidatorIdentity, true))

        await call(
            vault.functions.set_fees(
                30, // mint_burn_fee_basis_points
                10, // margin_fee_basis_points
                expandDecimals(5), // liquidation_fee_usd
            ),
        )

        vaultUser0 = new Vault(vault.id.toAddress(), user0)
        vaultUser1 = new Vault(vault.id.toAddress(), user1)
        vaultLiquidator = new Vault(vault.id.toAddress(), liquidator)

        await call(storkMock.functions.update_price(USDC_ASSET, expandDecimals(1, 18)))

        await call(vault.functions.set_asset_config(...getUsdcConfig()))
        await call(vault.functions.set_asset_config(...getBtcConfig()))
        await call(vault.functions.set_max_leverage(BTC_ASSET, BTC_MAX_LEVERAGE))

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

    describe("validate liquidation, longs", () => {
        it("cannot liquidate new position", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("0") // 0 means no liquidation needed
        })

        it("cannot liquidate a position with profits", async () => {
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
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("0") // 0 means no liquidation needed
        })

        it("cannot liquidate a position with little losses", async () => {
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
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("0") // 0 means no liquidation needed
        })

        it("cannot liquidate a position with extactly max leverage", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // create a short position just to balance the long position below so that the funding rate is zero
            await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
            await call(
                vaultUser0.functions
                    .increase_position(user0Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // the actual long position
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
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("0") // 0 means no liquidation needed
        })

        it("can liquidate a position with losses", async () => {
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
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("1") // 1 means losses exceed collateral
        })

        it("can liquidate a position exceeding max leverage", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36800, 18))) // this is exactly max_leverage, but also must be paid
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("2") // 2 means max leverage exceeded
        })

        it("can liquidate a position with large funding rate debt", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // still ok
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36800000001, 12)))
            const liquidationState1 = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState1[0].toString()).eq("0") // 0 means no liquidation needed
            // generate some funding rate debt
            await moveBlockchainTime(launchedNode, 110)
            // refresh the timestamp in stork mock
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36800000001, 12)))
            // TODO something wrong here
            const liquidationState2 = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState2[0].toString()).eq("2") // 2 means max leverage exceeded
        })

        it("can liquidate a position with insufficient collateral for fees", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // still ok
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36801, 18)))
            const liquidationState1 = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState1[0].toString()).eq("0") // 0 means no liquidation needed
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    10, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            const liquidationState2 = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState2[0].toString()).eq("2") // 2 means max leverage exceeded
        })

        it("can liquidate a position with insufficient collateral for the liquidation fee", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // still ok
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36801, 18)))
            const liquidationState1 = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState1[0].toString()).eq("0") // 0 means no liquidation needed
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    expandDecimals(5), // liquidation_fee_usd
                ),
            )
            const liquidationState2 = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState2[0].toString()).eq("2") // 2 means max leverage exceeded
        })

        it("can liquidate a position with insufficient collateral", async () => {
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // generate some funding rate debt
            await moveBlockchainTime(launchedNode, 100)
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36100, 18)))
            await call(
                vault.functions.set_fees(
                    30, // mint_burn_fee_basis_points
                    100, // margin_fee_basis_points
                    expandDecimals(5), // liquidation_fee_usd
                ),
            )
            const liquidationState2 = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get()
            ).value
            expect(liquidationState2[0].toString()).eq("1") // 1 means losses exceeded a collateral
        })
    })

    describe("validate liquidation, shorts", () => {
        it("cannot liquidate new position", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("0") // 0 means no liquidation needed
        })

        it("cannot liquidate a position with profits", async () => {
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
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("0") // 0 means no liquidation needed
        })

        it("cannot liquidate a position with little losses", async () => {
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
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("0") // 0 means no liquidation needed
        })

        it("cannot liquidate a position with extactly max leverage", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // create a short position just to balance the long position below so that the funding rate is zero
            await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
            await call(
                vaultUser0.functions
                    .increase_position(user0Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // the actual long position
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
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("0") // 0 means no liquidation needed
        })

        it("can liquidate a position with losses", async () => {
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
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("1") // 1 means losses exceed collateral
        })

        it("can liquidate a position exceeding max leverage", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200, 18))) // this is exactly max_leverage, but also must be paid
            const liquidationState = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState[0].toString()).eq("2") // 2 means max leverage exceeded
        })

        it("can liquidate a position with large funding rate debt", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // still ok
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43199999999, 12)))
            const liquidationState1 = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState1[0].toString()).eq("0") // 0 means no liquidation needed
            // generate some funding rate debt
            await moveBlockchainTime(launchedNode, 110)
            // refresh the timestamp in stork mock
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43199999999, 12)))
            // TODO something wrong here
            const liquidationState2 = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState2[0].toString()).eq("2") // 2 means max leverage exceeded
        })

        it("can liquidate a position with insufficient collateral for fees", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // still ok
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200 - 1, 18)))
            const liquidationState1 = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState1[0].toString()).eq("0") // 0 means no liquidation needed
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    10, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            const liquidationState2 = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState2[0].toString()).eq("2") // 2 means max leverage exceeded
        })

        it("can liquidate a position with insufficient collateral for the liquidation fee", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // still ok
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200 - 1, 18)))
            const liquidationState1 = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState1[0].toString()).eq("0") // 0 means no liquidation needed
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    expandDecimals(5), // liquidation_fee_usd
                ),
            )
            const liquidationState2 = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState2[0].toString()).eq("2") // 2 means max leverage exceeded
        })

        it("can liquidate a position with insufficient collateral", async () => {
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // generate some funding rate debt
            await moveBlockchainTime(launchedNode, 100)
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43900, 18)))
            await call(
                vault.functions.set_fees(
                    30, // mint_burn_fee_basis_points
                    100, // margin_fee_basis_points
                    expandDecimals(5), // liquidation_fee_usd
                ),
            )
            const liquidationState2 = (
                await vaultLiquidator.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get()
            ).value
            expect(liquidationState2[0].toString()).eq("1") // 1 means losses exceeded a collateral
        })
    })

    describe("liquidate position, longs", () => {
        it("cannot liquidate new position", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await expect(
                call2(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity)),
            ).rejects.toThrowError("VaultCannotBeLiquidated")
        })

        it("cannot liquidate a position with profits", async () => {
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
            await expect(
                call2(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity)),
            ).rejects.toThrowError("VaultCannotBeLiquidated")
        })

        it("cannot liquidate a position with little losses", async () => {
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
            await expect(
                call2(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity)),
            ).rejects.toThrowError("VaultCannotBeLiquidated")
        })

        it("cannot liquidate a position with extactly max leverage", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // create a short position just to balance the long position below so that the funding rate is zero
            await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
            await call(
                vaultUser0.functions
                    .increase_position(user0Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // the actual long position
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
            await expect(
                call2(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity)),
            ).rejects.toThrowError("VaultCannotBeLiquidated")
        })

        it("can liquidate a position with losses", async () => {
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
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity))
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value
            expect(position.size.toString()).eq("0")
        })

        it("can liquidate a position exceeding max leverage", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36800, 18))) // this is exactly max_leverage, but also must be paid
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity))
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value
            expect(position.size.toString()).eq("0")
        })

        it("can liquidate a position exceeding max leverage, check the fee", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            const feeReserveBefore = (await vault.functions.get_fee_reserve().get()).value
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36800, 18))) // this is exactly max_leverage, but also must be paid
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity))
            const feeReserveAfter = (await vault.functions.get_fee_reserve().get()).value
            expect(feeReserveAfter.toNumber()).gt(feeReserveBefore.toNumber())
        })

        it("can liquidate a position exceeding max leverage, check the liquidator fee", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            const balanceBefore = await liquidator.getBalance(USDC_ASSET_ID)
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36800, 18))) // this is exactly max_leverage, but also must be paid
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity))
            const balanceAfter = await liquidator.getBalance(USDC_ASSET_ID)
            expect(balanceAfter.toNumber()).gt(balanceBefore.toNumber())
        })

        it("can liquidate a position exceeding max leverage, check pnl", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36800, 18))) // this is exactly max_leverage, but also must be paid
            const tx = await call(
                vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity),
            )
            const liquidatePositionLog = tx.logs[tx.logs.length - 1]
            expect(liquidatePositionLog.pnl_delta_has_profit).eq(false)
            expect(liquidatePositionLog.pnl_delta.toString()).eq(expandDecimals(80))
        })

        it("can liquidate a position exceeding max leverage, check the funding rate", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
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
            // still ok
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36800, 18)))
            // generate some funding rate debt
            await moveBlockchainTime(launchedNode, 110)
            // refresh the timestamp in stork mock
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36800, 18))) // this is exactly max_leverage, but also must be paid
            const tx = await call(
                vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity),
            )
            // LiquidatePosition is the last log in the transaction
            const liquidatePositionLog = tx.logs[tx.logs.length - 1]
            expect(liquidatePositionLog.funding_rate.toNumber()).gt(0)
            expect(liquidatePositionLog.funding_rate_has_profit).eq(false)
            // other fields are not checked here
        })

        it("can liquidate a position exceeding max leverage, emits the event", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36800, 18))) // this is exactly max_leverage, but also must be paid
            const tx = await call(
                vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity),
            )
            // LiquidatePosition is the last log in the transaction
            const liquidatePositionLog = tx.logs[tx.logs.length - 1]
            expect(liquidatePositionLog.key).eq(positionKey)
            expect(liquidatePositionLog.account.Address.bits).eq(user1Identity.Address.bits)
            expect(liquidatePositionLog.index_asset).eq(BTC_ASSET)
            expect(liquidatePositionLog.is_long).eq(true)
            expect(liquidatePositionLog.collateral.toString()).eq(position.collateral.toString())
            expect(liquidatePositionLog.size.toString()).eq(position.size.toString())
            expect(liquidatePositionLog.mark_price.toString()).eq(expandDecimals(36800, 18).toString())
            // position fee and funding rate are not checked here
        })

        it("can liquidate a position with large funding rate debt", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // still ok
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36800000001, 12)))
            // generate some funding rate debt
            await moveBlockchainTime(launchedNode, 110)
            // refresh the timestamp in stork mock
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36800000001, 12)))
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity))
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value
            expect(position.size.toString()).eq("0")
        })

        it("can liquidate a position with insufficient collateral for fees", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // still ok
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36801, 18)))
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    10, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity))
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value
            expect(position.size.toString()).eq("0")
        })

        it("can liquidate a position with insufficient collateral for the liquidation fee", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // still ok
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36801, 18)))
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    expandDecimals(5), // liquidation_fee_usd
                ),
            )
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity))
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value
            expect(position.size.toString()).eq("0")
        })

        it("can liquidate a position with insufficient collateral", async () => {
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // generate some funding rate debt
            await moveBlockchainTime(launchedNode, 100)
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(36100, 18)))
            await call(
                vault.functions.set_fees(
                    30, // mint_burn_fee_basis_points
                    100, // margin_fee_basis_points
                    expandDecimals(5), // liquidation_fee_usd
                ),
            )
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity))
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value
            expect(position.size.toString()).eq("0")
        })
    })

    describe("liquidate position, shorts", () => {
        it("cannot liquidate new position", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await expect(
                call2(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity)),
            ).rejects.toThrowError("VaultCannotBeLiquidated")
        })

        it("cannot liquidate a position with profits", async () => {
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
            await expect(
                call2(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity)),
            ).rejects.toThrowError("VaultCannotBeLiquidated")
        })

        it("cannot liquidate a position with little losses", async () => {
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
            await expect(
                call2(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity)),
            ).rejects.toThrowError("VaultCannotBeLiquidated")
        })

        it("cannot liquidate a position with extactly max leverage", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // create a long position just to balance the short position below so that the funding rate is zero
            await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
            await call(
                vaultUser0.functions
                    .increase_position(user0Identity, BTC_ASSET, expandDecimals(1000), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // the actual short position
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
            await expect(
                call2(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity)),
            ).rejects.toThrowError("VaultCannotBeLiquidated")
        })

        it("can liquidate a position with losses", async () => {
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
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity))
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, false).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value
            expect(position.size.toString()).eq("0")
        })

        it("can liquidate a position exceeding max leverage", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200, 18))) // this is exactly max_leverage, but also must be paid
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity))
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, false).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value
            expect(position.size.toString()).eq("0")
        })

        it("can liquidate a position exceeding max leverage, check the fee", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            const feeReserveBefore = (await vault.functions.get_fee_reserve().get()).value
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200, 18))) // this is exactly max_leverage, but also must be paid
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity))
            const feeReserveAfter = (await vault.functions.get_fee_reserve().get()).value
            expect(feeReserveAfter.toNumber()).gt(feeReserveBefore.toNumber())
        })

        it("can liquidate a position exceeding max leverage, check the liquidator fee", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            const balanceBefore = await liquidator.getBalance(USDC_ASSET_ID)
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200, 18))) // this is exactly max_leverage, but also must be paid
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity))
            const balanceAfter = await liquidator.getBalance(USDC_ASSET_ID)
            expect(balanceAfter.toNumber()).gt(balanceBefore.toNumber())
        })

        it("can liquidate a position exceeding max leverage, check pnl", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200, 18))) // this is exactly max_leverage, but also must be paid
            const tx = await call(
                vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity),
            )
            const liquidatePositionLog = tx.logs[tx.logs.length - 1]
            expect(liquidatePositionLog.pnl_delta_has_profit).eq(false)
            expect(liquidatePositionLog.pnl_delta.toString()).eq(expandDecimals(80))
        })

        it("can liquidate a position exceeding max leverage, check the funding rate", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
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
            // still ok
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200, 18)))
            // generate some funding rate debt
            await moveBlockchainTime(launchedNode, 110)
            // refresh the timestamp in stork mock
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200, 18))) // this is exactly max_leverage, but also must be paid
            const tx = await call(
                vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity),
            )
            // LiquidatePosition is the last log in the transaction
            const liquidatePositionLog = tx.logs[tx.logs.length - 1]
            expect(liquidatePositionLog.funding_rate.toNumber()).gt(0)
            expect(liquidatePositionLog.funding_rate_has_profit).eq(false)
            // other fields are not checked here
        })

        it("can liquidate a position exceeding max leverage, emits the event", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, false).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200, 18))) // this is exactly max_leverage, but also must be paid
            const tx = await call(
                vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity),
            )
            // LiquidatePosition is the last log in the transaction
            const liquidatePositionLog = tx.logs[tx.logs.length - 1]
            expect(liquidatePositionLog.key).eq(positionKey)
            expect(liquidatePositionLog.account.Address.bits).eq(user1Identity.Address.bits)
            expect(liquidatePositionLog.index_asset).eq(BTC_ASSET)
            expect(liquidatePositionLog.is_long).eq(false)
            expect(liquidatePositionLog.collateral.toString()).eq(position.collateral.toString())
            expect(liquidatePositionLog.size.toString()).eq(position.size.toString())
            expect(liquidatePositionLog.mark_price.toString()).eq(expandDecimals(43200, 18).toString())
            // position fee and funding rate are not checked here
        })

        it("can liquidate a position with large funding rate debt", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // still ok
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200000001, 12)))
            // generate some funding rate debt
            await moveBlockchainTime(launchedNode, 110)
            // refresh the timestamp in stork mock
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200000001, 12)))
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity))
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, false).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value
            expect(position.size.toString()).eq("0")
        })

        it("can liquidate a position with insufficient collateral for fees", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // still ok
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200 - 1, 18)))
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    10, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity))
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, false).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value
            expect(position.size.toString()).eq("0")
        })

        it("can liquidate a position with insufficient collateral for the liquidation fee", async () => {
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    0, // liquidation_fee_usd
                ),
            )
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // still ok
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43200 - 1, 18)))
            await call(
                vault.functions.set_fees(
                    0, // mint_burn_fee_basis_points
                    0, // margin_fee_basis_points
                    expandDecimals(5), // liquidation_fee_usd
                ),
            )
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity))
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, false).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value
            expect(position.size.toString()).eq("0")
        })

        it("can liquidate a position with insufficient collateral", async () => {
            // the actual long position
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )
            // generate some funding rate debt
            await moveBlockchainTime(launchedNode, 100)
            await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(43900, 18)))
            await call(
                vault.functions.set_fees(
                    30, // mint_burn_fee_basis_points
                    100, // margin_fee_basis_points
                    expandDecimals(5), // liquidation_fee_usd
                ),
            )
            await call(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity))
            const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, false).get()).value
            const position = (await vault.functions.get_position_by_key(positionKey).get()).value
            expect(position.size.toString()).eq("0")
        })
    })

    describe("liquidators", () => {
        it("the owner can set the liquidator", async () => {
            expect((await vault.functions.is_liquidator(user0Identity).get()).value).eq(false)
            const tx = await call(vault.functions.set_liquidator(user0Identity, true))
            expect((await vault.functions.is_liquidator(user0Identity).get()).value).eq(true)
            const log = tx.logs[tx.logs.length - 1]
            expect(log.liquidator.Address.bits).eq(user0Identity.Address.bits)
            expect(log.is_active).eq(true)
        })

        it("the owner can unset the liquidator", async () => {
            expect((await vault.functions.is_liquidator(liquidatorIdentity).get()).value).eq(true)
            const tx = await call(vault.functions.set_liquidator(liquidatorIdentity, false))
            expect((await vault.functions.is_liquidator(liquidatorIdentity).get()).value).eq(false)
            const log = tx.logs[tx.logs.length - 1]
            expect(log.liquidator.Address.bits).eq(liquidatorIdentity.Address.bits)
            expect(log.is_active).eq(false)
        })

        it("non owner cannot set the liquidator", async () => {
            await expect(call2(vaultUser0.functions.set_liquidator(user0Identity, true))).rejects.toThrowError("NotOwner")
        })

        it("non liquidator cannot liquidate a position", async () => {
            await call(vault.functions.set_liquidator(liquidatorIdentity, false))

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
            await expect(
                call2(vaultLiquidator.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity)),
            ).rejects.toThrowError("VaultInvalidLiquidator")
        })

        it("the liquidator can liquidate a position", async () => {
            await call(vault.functions.set_liquidator(user0Identity, true))

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
            await call(vaultUser0.functions.liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity))
        })
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
