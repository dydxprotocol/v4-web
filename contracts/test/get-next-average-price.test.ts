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

describe("Vault.get_next_average_price", () => {
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
                10, // position_fee_basis_points
                10, // liquidation_fee_basis_points
            ),
        )

        await call(storkMock.functions.update_price(USDC_ASSET, expandDecimals(1, 18)))

        await call(vaultExpose.functions.set_asset_config(...getBtcConfig()))

        await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(40000, 18)))
    })

    describe("get_next_average_price", () => {
        // Constants from the contract
        const MAX_LEVERAGE = BigInt(1_000_000_000) // 10^9
        const PRICE_PRECISION = BigInt(10) ** BigInt(18) // 10^18

        it("long position with profit - new position", async () => {
            const indexAsset = BTC_ASSET
            const size = "0" // new position (size = 0)
            const averagePrice = expandDecimals(40000, 18)
            const nextPrice = expandDecimals(40000, 18) // $40,000 (same as average for simplicity)
            const sizeDelta = expandDecimals(1, 9) // 1 BTC (9 decimals for asset sizes)
            const isLong = true

            const nextAvgPrice = (
                await vaultExpose.functions
                    .get_next_average_price(indexAsset, size, averagePrice, isLong, nextPrice, sizeDelta)
                    .get()
            ).value

            // Harmonic average formula:
            // tokens = size * MAX_LEVERAGE * PRICE_PRECISION^2 / average_price = 0 (since size = 0)
            // tokens_delta = size_delta * MAX_LEVERAGE * PRICE_PRECISION^2 / next_price
            // tokens_delta = 1 * 10^9 * 10^36 / (40000 * 10^18) = 10^45 / (40000 * 10^18) = 10^27 / 40000
            // next_average_price = (size + size_delta) * MAX_LEVERAGE * PRICE_PRECISION^2 / (tokens + tokens_delta)
            // next_average_price = (1 * 10^9) * 10^45 / (10^27 / 40000) = 10^54 / (10^27 / 40000) = 40000 * 10^27 = 40000
            const sizeBigInt = BigInt(0)
            const sizeDeltaBigInt = BigInt(sizeDelta)
            const averagePriceBigInt = BigInt(averagePrice)
            const nextPriceBigInt = BigInt(nextPrice)

            const tokens = (sizeBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / averagePriceBigInt
            const tokensDelta = (sizeDeltaBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / nextPriceBigInt
            const expected =
                ((sizeBigInt + sizeDeltaBigInt) * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / (tokens + tokensDelta)

            expect(nextAvgPrice.toString()).toBe(expected.toString())
        })

        it("long position with profit - adding to winning position", async () => {
            const indexAsset = BTC_ASSET
            const size = expandDecimals(1, 9) // 1 BTC existing (9 decimals for asset sizes)
            const averagePrice = expandDecimals(40000, 18) // $40,000 entry price (18 decimals for prices)
            const nextPrice = expandDecimals(42000, 18) // $42,000 current price (profit) (18 decimals for prices)
            const sizeDelta = expandDecimals(1, 9) // adding 1 BTC more (9 decimals for asset sizes)
            const isLong = true

            const nextAvgPrice = (
                await vaultExpose.functions
                    .get_next_average_price(indexAsset, size, averagePrice, isLong, nextPrice, sizeDelta)
                    .get()
            ).value

            // Harmonic average formula:
            // tokens = size * MAX_LEVERAGE * PRICE_PRECISION^2 / average_price
            // tokens_delta = size_delta * MAX_LEVERAGE * PRICE_PRECISION^2 / next_price
            // next_average_price = (size + size_delta) * MAX_LEVERAGE * PRICE_PRECISION^2 / (tokens + tokens_delta)
            const sizeBigInt = BigInt(size)
            const sizeDeltaBigInt = BigInt(sizeDelta)
            const averagePriceBigInt = BigInt(averagePrice)
            const nextPriceBigInt = BigInt(nextPrice)

            const tokens = (sizeBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / averagePriceBigInt
            const tokensDelta = (sizeDeltaBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / nextPriceBigInt
            const expected =
                ((sizeBigInt + sizeDeltaBigInt) * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / (tokens + tokensDelta)

            expect(nextAvgPrice.toString()).toBe(expected.toString())
        })

        it("long position with loss - adding to losing position", async () => {
            const indexAsset = BTC_ASSET
            const size = expandDecimals(1, 9) // 1 BTC existing (9 decimals for asset sizes)
            const averagePrice = expandDecimals(40000, 18) // $40,000 entry price (18 decimals for prices)
            const nextPrice = expandDecimals(38000, 18) // $38,000 current price (loss) (18 decimals for prices)
            const sizeDelta = expandDecimals(1, 9) // adding 1 BTC more (9 decimals for asset sizes)
            const isLong = true

            const nextAvgPrice = (
                await vaultExpose.functions
                    .get_next_average_price(indexAsset, size, averagePrice, isLong, nextPrice, sizeDelta)
                    .get()
            ).value

            // Harmonic average formula:
            // tokens = size * MAX_LEVERAGE * PRICE_PRECISION^2 / average_price
            // tokens_delta = size_delta * MAX_LEVERAGE * PRICE_PRECISION^2 / next_price
            // next_average_price = (size + size_delta) * MAX_LEVERAGE * PRICE_PRECISION^2 / (tokens + tokens_delta)
            const sizeBigInt = BigInt(size)
            const sizeDeltaBigInt = BigInt(sizeDelta)
            const averagePriceBigInt = BigInt(averagePrice)
            const nextPriceBigInt = BigInt(nextPrice)

            const tokens = (sizeBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / averagePriceBigInt
            const tokensDelta = (sizeDeltaBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / nextPriceBigInt
            const expected =
                ((sizeBigInt + sizeDeltaBigInt) * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / (tokens + tokensDelta)

            expect(nextAvgPrice.toString()).toBe(expected.toString())
        })

        it("short position with profit - adding to winning position", async () => {
            const indexAsset = BTC_ASSET
            const size = expandDecimals(1, 9) // 1 BTC existing (9 decimals for asset sizes)
            const averagePrice = expandDecimals(40000, 18) // $40,000 entry price (18 decimals for prices)
            const nextPrice = expandDecimals(38000, 18) // $38,000 current price (profit for short) (18 decimals for prices)
            const sizeDelta = expandDecimals(1, 9) // adding 1 BTC more (9 decimals for asset sizes)
            const isLong = false

            const nextAvgPrice = (
                await vaultExpose.functions
                    .get_next_average_price(indexAsset, size, averagePrice, isLong, nextPrice, sizeDelta)
                    .get()
            ).value

            // Harmonic average formula (same for long and short positions):
            // tokens = size * MAX_LEVERAGE * PRICE_PRECISION^2 / average_price
            // tokens_delta = size_delta * MAX_LEVERAGE * PRICE_PRECISION^2 / next_price
            // next_average_price = (size + size_delta) * MAX_LEVERAGE * PRICE_PRECISION^2 / (tokens + tokens_delta)
            const sizeBigInt = BigInt(size)
            const sizeDeltaBigInt = BigInt(sizeDelta)
            const averagePriceBigInt = BigInt(averagePrice)
            const nextPriceBigInt = BigInt(nextPrice)

            const tokens = (sizeBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / averagePriceBigInt
            const tokensDelta = (sizeDeltaBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / nextPriceBigInt
            const expected =
                ((sizeBigInt + sizeDeltaBigInt) * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / (tokens + tokensDelta)

            expect(nextAvgPrice.toString()).toBe(expected.toString())
        })

        it("short position with loss - adding to losing position", async () => {
            const indexAsset = BTC_ASSET
            const size = expandDecimals(1, 9) // 1 BTC existing (9 decimals for asset sizes)
            const averagePrice = expandDecimals(40000, 18) // $40,000 entry price (18 decimals for prices)
            const nextPrice = expandDecimals(42000, 18) // $42,000 current price (loss for short) (18 decimals for prices)
            const sizeDelta = expandDecimals(1, 9) // adding 1 BTC more (9 decimals for asset sizes)
            const isLong = false

            const nextAvgPrice = (
                await vaultExpose.functions
                    .get_next_average_price(indexAsset, size, averagePrice, isLong, nextPrice, sizeDelta)
                    .get()
            ).value

            // Harmonic average formula (same for long and short positions):
            // tokens = size * MAX_LEVERAGE * PRICE_PRECISION^2 / average_price
            // tokens_delta = size_delta * MAX_LEVERAGE * PRICE_PRECISION^2 / next_price
            // next_average_price = (size + size_delta) * MAX_LEVERAGE * PRICE_PRECISION^2 / (tokens + tokens_delta)
            const sizeBigInt = BigInt(size)
            const sizeDeltaBigInt = BigInt(sizeDelta)
            const averagePriceBigInt = BigInt(averagePrice)
            const nextPriceBigInt = BigInt(nextPrice)

            const tokens = (sizeBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / averagePriceBigInt
            const tokensDelta = (sizeDeltaBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / nextPriceBigInt
            const expected =
                ((sizeBigInt + sizeDeltaBigInt) * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / (tokens + tokensDelta)

            expect(nextAvgPrice.toString()).toBe(expected.toString())
        })

        it("long position with same price - no profit or loss", async () => {
            const indexAsset = BTC_ASSET
            const size = expandDecimals(1, 9) // 1 BTC existing (9 decimals for asset sizes)
            const averagePrice = expandDecimals(40000, 18) // $40,000 entry price (18 decimals for prices)
            const nextPrice = expandDecimals(40000, 18) // $40,000 current price (same) (18 decimals for prices)
            const sizeDelta = expandDecimals(1, 9) // adding 1 BTC more (9 decimals for asset sizes)
            const isLong = true

            const nextAvgPrice = (
                await vaultExpose.functions
                    .get_next_average_price(indexAsset, size, averagePrice, isLong, nextPrice, sizeDelta)
                    .get()
            ).value

            // Harmonic average formula (when prices are equal, result should be the same price):
            // tokens = size * MAX_LEVERAGE * PRICE_PRECISION^2 / average_price
            // tokens_delta = size_delta * MAX_LEVERAGE * PRICE_PRECISION^2 / next_price
            // next_average_price = (size + size_delta) * MAX_LEVERAGE * PRICE_PRECISION^2 / (tokens + tokens_delta)
            // Since average_price == next_price, tokens = size * K / price and tokens_delta = size_delta * K / price
            // So tokens + tokens_delta = (size + size_delta) * K / price
            // Therefore next_average_price = (size + size_delta) * K / ((size + size_delta) * K / price) = price
            const sizeBigInt = BigInt(size)
            const sizeDeltaBigInt = BigInt(sizeDelta)
            const averagePriceBigInt = BigInt(averagePrice)
            const nextPriceBigInt = BigInt(nextPrice)

            const tokens = (sizeBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / averagePriceBigInt
            const tokensDelta = (sizeDeltaBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / nextPriceBigInt
            const expected =
                ((sizeBigInt + sizeDeltaBigInt) * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / (tokens + tokensDelta)

            expect(nextAvgPrice.toString()).toBe(expected.toString())
        })

        it("long position with zero size delta - no position change", async () => {
            const indexAsset = BTC_ASSET
            const size = expandDecimals(1, 9) // 1 BTC existing (9 decimals for asset sizes)
            const averagePrice = expandDecimals(40000, 18) // $40,000 entry price (18 decimals for prices)
            const nextPrice = expandDecimals(42000, 18) // $42,000 current price (18 decimals for prices)
            const sizeDelta = "0" // zero size delta (no position change)
            const isLong = true

            const nextAvgPrice = (
                await vaultExpose.functions
                    .get_next_average_price(indexAsset, size, averagePrice, isLong, nextPrice, sizeDelta)
                    .get()
            ).value

            // Harmonic average formula with size_delta = 0:
            // tokens = size * MAX_LEVERAGE * PRICE_PRECISION^2 / average_price
            // tokens_delta = 0 * MAX_LEVERAGE * PRICE_PRECISION^2 / next_price = 0
            // next_average_price = (size + 0) * MAX_LEVERAGE * PRICE_PRECISION^2 / (tokens + 0)
            // next_average_price = size * MAX_LEVERAGE * PRICE_PRECISION^2 / tokens
            // But tokens = size * MAX_LEVERAGE * PRICE_PRECISION^2 / average_price
            // So next_average_price = size * MAX_LEVERAGE * PRICE_PRECISION^2 / (size * MAX_LEVERAGE * PRICE_PRECISION^2 / average_price)
            // = average_price
            // When size_delta is zero, the average price should remain unchanged
            const sizeBigInt = BigInt(size)
            const sizeDeltaBigInt = BigInt(sizeDelta)
            const averagePriceBigInt = BigInt(averagePrice)
            const nextPriceBigInt = BigInt(nextPrice)

            const tokens = (sizeBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / averagePriceBigInt
            const tokensDelta = (sizeDeltaBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / nextPriceBigInt
            const expected =
                ((sizeBigInt + sizeDeltaBigInt) * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / (tokens + tokensDelta)

            expect(nextAvgPrice.toString()).toBe(expected.toString())
            expect(nextAvgPrice.toString()).toBe(averagePrice) // Should equal the original average price
        })

        it("long position with large size delta", async () => {
            const indexAsset = BTC_ASSET
            const size = expandDecimals(1, 9) // 1 BTC existing (9 decimals for asset sizes)
            const averagePrice = expandDecimals(40000, 18) // $40,000 entry price (18 decimals for prices)
            const nextPrice = expandDecimals(42000, 18) // $42,000 current price (profit) (18 decimals for prices)
            const sizeDelta = expandDecimals(4, 9) // adding 4 BTC more (5x increase) (9 decimals for asset sizes)
            const isLong = true

            const nextAvgPrice = (
                await vaultExpose.functions
                    .get_next_average_price(indexAsset, size, averagePrice, isLong, nextPrice, sizeDelta)
                    .get()
            ).value

            // Harmonic average formula:
            // tokens = size * MAX_LEVERAGE * PRICE_PRECISION^2 / average_price
            // tokens_delta = size_delta * MAX_LEVERAGE * PRICE_PRECISION^2 / next_price
            // next_average_price = (size + size_delta) * MAX_LEVERAGE * PRICE_PRECISION^2 / (tokens + tokens_delta)
            const sizeBigInt = BigInt(size)
            const sizeDeltaBigInt = BigInt(sizeDelta)
            const averagePriceBigInt = BigInt(averagePrice)
            const nextPriceBigInt = BigInt(nextPrice)

            const tokens = (sizeBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / averagePriceBigInt
            const tokensDelta = (sizeDeltaBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / nextPriceBigInt
            const expected =
                ((sizeBigInt + sizeDeltaBigInt) * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / (tokens + tokensDelta)

            expect(nextAvgPrice.toString()).toBe(expected.toString())
        })

        it("short position with significant price movement", async () => {
            const indexAsset = BTC_ASSET
            const size = expandDecimals(2, 9) // 2 BTC existing (9 decimals for asset sizes)
            const averagePrice = expandDecimals(30000, 18) // $30,000 entry price (18 decimals for prices)
            const nextPrice = expandDecimals(45000, 18) // $45,000 current price (large loss for short) (18 decimals for prices)
            const sizeDelta = expandDecimals(1, 9) // adding 1 BTC more (9 decimals for asset sizes)
            const isLong = false

            const nextAvgPrice = (
                await vaultExpose.functions
                    .get_next_average_price(indexAsset, size, averagePrice, isLong, nextPrice, sizeDelta)
                    .get()
            ).value

            // Harmonic average formula (same for long and short positions):
            // tokens = size * MAX_LEVERAGE * PRICE_PRECISION^2 / average_price
            // tokens_delta = size_delta * MAX_LEVERAGE * PRICE_PRECISION^2 / next_price
            // next_average_price = (size + size_delta) * MAX_LEVERAGE * PRICE_PRECISION^2 / (tokens + tokens_delta)
            const sizeBigInt = BigInt(size)
            const sizeDeltaBigInt = BigInt(sizeDelta)
            const averagePriceBigInt = BigInt(averagePrice)
            const nextPriceBigInt = BigInt(nextPrice)

            const tokens = (sizeBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / averagePriceBigInt
            const tokensDelta = (sizeDeltaBigInt * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / nextPriceBigInt
            const expected =
                ((sizeBigInt + sizeDeltaBigInt) * MAX_LEVERAGE * PRICE_PRECISION * PRICE_PRECISION) / (tokens + tokensDelta)

            expect(nextAvgPrice.toString()).toBe(expected.toString())
        })
    })

    afterAll(async () => {
        launchedNode.cleanup()
    })
})
