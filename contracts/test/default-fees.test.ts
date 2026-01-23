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

describe("Vault.default_fees", () => {
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

        vaultUser0 = new Vault(vault.id.toAddress(), user0)
        vaultUser1 = new Vault(vault.id.toAddress(), user1)

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

    describe("validate default fees", () => {
        it("check if default fees are set correctly", async () => {
            const liquidationFee = (await vault.functions.get_liquidation_fee_basis_points().get()).value
            const liquidityFee = (await vault.functions.get_liquidity_fee_basis_points().get()).value
            const increasePositionFee = (await vault.functions.get_increase_position_fee_basis_points().get()).value
            const decreasePositionFee = (await vault.functions.get_decrease_position_fee_basis_points().get()).value

            expect(liquidationFee.toString()).eq("10")
            expect(liquidityFee.toString()).eq("30")
            expect(increasePositionFee.toString()).eq("10")
            expect(decreasePositionFee.toString()).eq("0")
        })
    })

    describe("validate SetFees event", () => {
        it("validate SetFees event", async () => {
            const tx = await call(
                vault.functions
                    .set_fees(
                        40, // liquidity_fee_basis_points
                        20, // increase_position_fee_basis_points
                        20, // decrease_position_fee_basis_points
                        20, // liquidation_fee_basis_points
                    )
                    .addContracts(attachedContracts),
            )

            const liquidationFee = (await vault.functions.get_liquidation_fee_basis_points().get()).value
            const liquidityFee = (await vault.functions.get_liquidity_fee_basis_points().get()).value
            const increasePositionFee = (await vault.functions.get_increase_position_fee_basis_points().get()).value
            const decreasePositionFee = (await vault.functions.get_decrease_position_fee_basis_points().get()).value

            expect(liquidationFee.toString()).eq("20")
            expect(liquidityFee.toString()).eq("40")
            expect(increasePositionFee.toString()).eq("20")
            expect(decreasePositionFee.toString()).eq("20")

            // Find the SetFees event
            const setFeesLog = tx.logs.find((log) => log.liquidity_fee_basis_points !== undefined)
            expect(setFeesLog).toBeDefined()

            if (setFeesLog) {
                expect(setFeesLog.liquidity_fee_basis_points.toString()).eq("40")
                expect(setFeesLog.increase_position_fee_basis_points.toString()).eq("20")
                expect(setFeesLog.decrease_position_fee_basis_points.toString()).eq("20")
                expect(setFeesLog.liquidation_fee_basis_points.toString()).eq("20")
            }
        })
    })

    describe("validate position fees", () => {
        it("increase position fee", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))

            const feeReserveBefore = (await vault.functions.get_fee_reserve().get()).value

            const sizeDelta = expandDecimals(1000)
            const increasePositionFeeBasisPoints = (await vault.functions.get_increase_position_fee_basis_points().get()).value
            // position_fee = size_delta * fee_basis_points / 10000
            // Split 50/50: liquidity_fee = position_fee / 2, protocol_fee = position_fee - liquidity_fee
            const positionFee = (BigInt(sizeDelta) * BigInt(increasePositionFeeBasisPoints.toString())) / BigInt(10000)
            const expectedProtocolFee = positionFee / BigInt(2)
            const expectedLiquidityFee = positionFee - expectedProtocolFee

            const tx = await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, sizeDelta, true)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )

            const feeReserveAfter = (await vault.functions.get_fee_reserve().get()).value

            // Find the IncreasePosition event
            const increasePositionLog = tx.logs.find(
                (log) => log.out_liquidity_fee !== undefined && log.out_protocol_fee !== undefined,
            )
            expect(increasePositionLog).toBeDefined()

            if (increasePositionLog) {
                expect(increasePositionLog.out_liquidity_fee.toString()).eq(expectedLiquidityFee.toString())
                expect(increasePositionLog.out_protocol_fee.toString()).eq(expectedProtocolFee.toString())
            }

            expect(feeReserveAfter.toString()).eq((BigInt(feeReserveBefore.toString()) + expectedProtocolFee).toString())
        })

        it("decrease position fee", async () => {
            await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
            await call(
                vaultUser1.functions
                    .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    })
                    .addContracts(attachedContracts),
            )

            const feeReserveBefore = (await vault.functions.get_fee_reserve().get()).value

            const sizeDelta = expandDecimals(1000)
            const decreasePositionFeeBasisPoints = (await vault.functions.get_decrease_position_fee_basis_points().get()).value
            // position_fee = size_delta * fee_basis_points / 10000
            // Split 50/50: liquidity_fee = position_fee / 2, protocol_fee = position_fee - liquidity_fee
            const positionFee = (BigInt(sizeDelta) * BigInt(decreasePositionFeeBasisPoints.toString())) / BigInt(10000)
            const expectedProtocolFee = positionFee / BigInt(2)
            const expectedLiquidityFee = positionFee - expectedProtocolFee

            const tx = await call(
                vaultUser1.functions
                    .decrease_position(user1Identity, BTC_ASSET, 0, sizeDelta, true, user1Identity)
                    .addContracts(attachedContracts),
            )

            const feeReserveAfter = (await vault.functions.get_fee_reserve().get()).value

            // Find the DecreasePosition event
            const decreasePositionLog = tx.logs.find(
                (log) => log.out_liquidity_fee !== undefined && log.out_protocol_fee !== undefined,
            )
            expect(decreasePositionLog).toBeDefined()

            if (decreasePositionLog) {
                expect(decreasePositionLog.out_liquidity_fee.toString()).eq(expectedLiquidityFee.toString())
                expect(decreasePositionLog.out_protocol_fee.toString()).eq(expectedProtocolFee.toString())
            }

            expect(feeReserveAfter.toString()).eq((BigInt(feeReserveBefore.toString()) + expectedProtocolFee).toString())
        })
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
