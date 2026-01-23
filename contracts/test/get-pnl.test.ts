import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { WalletUnlocked } from "fuels"
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
import {
    FungibleFactory,
    PricefeedWrapperFactory,
    StorkMockFactory,
    VaultExposeFactory,
    SimpleProxyFactory,
    Fungible,
    VaultExpose,
    StorkMock,
    PricefeedWrapper,
} from "../types/index.js"

describe("Vault.get_pnl", () => {
    let launchedNode: LaunchTestNodeReturn<DeployContractConfig[]>
    let deployer: WalletUnlocked
    let liquidator: WalletUnlocked
    let deployerIdentity: AddressIdentity
    let liquidatorIdentity: AddressIdentity
    let USDC: Fungible
    let USDC_ASSET_ID: string
    let storkMock: StorkMock
    let pricefeedWrapper: PricefeedWrapper
    let vaultExpose: VaultExpose

    // the tests do not modify the state, so beforeAll is more effective
    beforeAll(async () => {
        launchedNode = await launchNode()
        ;[deployer, , , , liquidator] = getNodeWallets(launchedNode)

        deployerIdentity = walletToAddressIdentity(deployer)
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
        vaultExpose = new VaultExpose(simpleProxy.id.toAddress(), deployer)

        await call(vaultExpose.functions.initialize(deployerIdentity))
        await call(vaultExpose.functions.set_liquidator(liquidatorIdentity, true))

        await call(
            vaultExpose.functions.set_fees(
                30, // liquidity_fee_basis_points
                10, // increase_position_fee_basis_points
                10, // decrease_position_fee_basis_points
                10, // liquidation_fee_basis_points
            ),
        )

        await call(storkMock.functions.update_price(USDC_ASSET, expandDecimals(1, 18)))

        await call(vaultExpose.functions.set_asset_config(...getBtcConfig()))

        await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(40000, 18)))
    })

    describe("get_pnl", () => {
        it("long position with profit", async () => {
            const indexAsset = BTC_ASSET
            const size = expandDecimals(1, 18) // 1 BTC
            const averagePrice = expandDecimals(40000, 18) // $40,000 entry price
            const currentPrice = expandDecimals(42000, 18) // $42,000 current price
            const isLong = true

            const pnlResponse = (
                await vaultExpose.functions.calculate_pnl(indexAsset, size, currentPrice, averagePrice, isLong).get()
            ).value

            expect(pnlResponse[0]).toBe(true) // has_profit = true
            // delta = size * (price - average_price) / average_price
            // delta = 1 * (42000 - 40000) / 40000 = 0.05 BTC = 50000000000000000 (with 18 decimals)
            // 0.05 * 10^18 = 5 * 10^16 = 50000000000000000
            const expectedPnl = (BigInt(5) * BigInt(10) ** BigInt(16)).toString()
            expect(pnlResponse[1].toString()).toBe(expectedPnl)
        })

        it("long position with loss", async () => {
            const indexAsset = BTC_ASSET
            const size = expandDecimals(1, 18) // 1 BTC
            const averagePrice = expandDecimals(40000, 18) // $40,000 entry price
            const currentPrice = expandDecimals(38000, 18) // $38,000 current price
            const isLong = true

            const pnlResponse = (
                await vaultExpose.functions.calculate_pnl(indexAsset, size, currentPrice, averagePrice, isLong).get()
            ).value

            expect(pnlResponse[0]).toBe(false) // has_profit = false (loss)
            // delta = size * (average_price - price) / average_price
            // delta = 1 * (40000 - 38000) / 40000 = 0.05 BTC = 50000000000000000 (with 18 decimals)
            // 0.05 * 10^18 = 5 * 10^16 = 50000000000000000
            const expectedPnl = (BigInt(5) * BigInt(10) ** BigInt(16)).toString()
            expect(pnlResponse[1].toString()).toBe(expectedPnl)
        })

        it("short position with profit", async () => {
            const indexAsset = BTC_ASSET
            const size = expandDecimals(1, 18) // 1 BTC
            const averagePrice = expandDecimals(40000, 18) // $40,000 entry price
            const currentPrice = expandDecimals(38000, 18) // $38,000 current price
            const isLong = false

            const pnlResponse = (
                await vaultExpose.functions.calculate_pnl(indexAsset, size, currentPrice, averagePrice, isLong).get()
            ).value

            expect(pnlResponse[0]).toBe(true) // has_profit = true (short gains when price drops)
            // delta = size * (average_price - price) / average_price
            // delta = 1 * (40000 - 38000) / 40000 = 0.05 BTC = 50000000000000000 (with 18 decimals)
            // 0.05 * 10^18 = 5 * 10^16 = 50000000000000000
            const expectedPnl = (BigInt(5) * BigInt(10) ** BigInt(16)).toString()
            expect(pnlResponse[1].toString()).toBe(expectedPnl)
        })

        it("short position with loss", async () => {
            const indexAsset = BTC_ASSET
            const size = expandDecimals(1, 18) // 1 BTC
            const averagePrice = expandDecimals(40000, 18) // $40,000 entry price
            const currentPrice = expandDecimals(42000, 18) // $42,000 current price
            const isLong = false

            const pnlResponse = (
                await vaultExpose.functions.calculate_pnl(indexAsset, size, currentPrice, averagePrice, isLong).get()
            ).value

            expect(pnlResponse[0]).toBe(false) // has_profit = false (short loses when price rises)
            // delta = size * (price - average_price) / average_price
            // delta = 1 * (42000 - 40000) / 40000 = 0.05 BTC = 50000000000000000 (with 18 decimals)
            // 0.05 * 10^18 = 5 * 10^16 = 50000000000000000
            const expectedPnl = (BigInt(5) * BigInt(10) ** BigInt(16)).toString()
            expect(pnlResponse[1].toString()).toBe(expectedPnl)
        })

        it("zero pnl when price equals average price", async () => {
            const indexAsset = BTC_ASSET
            const size = expandDecimals(1, 18) // 1 BTC
            const averagePrice = expandDecimals(40000, 18) // $40,000 entry price
            const currentPrice = expandDecimals(40000, 18) // $40,000 current price (same as entry)
            const isLong = true

            const pnlResponse = (
                await vaultExpose.functions.calculate_pnl(indexAsset, size, currentPrice, averagePrice, isLong).get()
            ).value

            expect(pnlResponse[0]).toBe(false) // has_profit = false (no profit, but treated as loss for consistency)
            expect(pnlResponse[1].toString()).toBe("0") // no PnL delta
        })

        it("large position size with small price difference", async () => {
            const indexAsset = BTC_ASSET
            const size = expandDecimals(100, 18) // 100 BTC
            const averagePrice = expandDecimals(40000, 18) // $40,000 entry price
            const currentPrice = expandDecimals(40010, 18) // $40,010 current price (small increase)
            const isLong = true

            const pnlResponse = (
                await vaultExpose.functions.calculate_pnl(indexAsset, size, currentPrice, averagePrice, isLong).get()
            ).value

            expect(pnlResponse[0]).toBe(true) // has_profit = true
            // delta = 100 * (40010 - 40000) / 40000 = 100 * 10 / 40000 = 0.025 BTC
            // 0.025 * 10^18 = 25 * 10^15 = 25000000000000000
            const expectedPnl = (BigInt(25) * BigInt(10) ** BigInt(15)).toString()
            expect(pnlResponse[1].toString()).toBe(expectedPnl)
        })

        it("small position size with large price difference", async () => {
            const indexAsset = BTC_ASSET
            const size = (BigInt(1) * BigInt(10) ** BigInt(17)).toString() // 0.1 BTC = 100000000000000000
            const averagePrice = expandDecimals(40000, 18) // $40,000 entry price
            const currentPrice = expandDecimals(50000, 18) // $50,000 current price (25% increase)
            const isLong = true

            const pnlResponse = (
                await vaultExpose.functions.calculate_pnl(indexAsset, size, currentPrice, averagePrice, isLong).get()
            ).value

            expect(pnlResponse[0]).toBe(true) // has_profit = true
            // delta = 0.1 * (50000 - 40000) / 40000 = 0.1 * 10000 / 40000 = 0.025 BTC
            // 0.025 * 10^18 = 25 * 10^15 = 25000000000000000
            const expectedPnl = (BigInt(25) * BigInt(10) ** BigInt(15)).toString()
            expect(pnlResponse[1].toString()).toBe(expectedPnl)
        })

        it("short position with significant loss", async () => {
            const indexAsset = BTC_ASSET
            const size = expandDecimals(2, 18) // 2 BTC
            const averagePrice = expandDecimals(30000, 18) // $30,000 entry price
            const currentPrice = expandDecimals(45000, 18) // $45,000 current price (50% increase)
            const isLong = false

            const pnlResponse = (
                await vaultExpose.functions.calculate_pnl(indexAsset, size, currentPrice, averagePrice, isLong).get()
            ).value

            expect(pnlResponse[0]).toBe(false) // has_profit = false (short loses when price rises)
            // delta = 2 * (45000 - 30000) / 30000 = 2 * 15000 / 30000 = 1 BTC
            const expectedPnl = expandDecimals(1, 18) // 50% loss on 2 BTC position = 1 BTC
            expect(pnlResponse[1].toString()).toBe(expectedPnl)
        })
    })

    afterAll(async () => {
        launchedNode.cleanup()
    })
})
