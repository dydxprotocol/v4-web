import { WalletUnlocked, DateTime } from "fuels"
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
    CUMULATIVE_FUNDING_RATE_NEUTRAL,
    calculateTotalFundingRateDelta,
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
    VaultExpose,
    VaultExposeFactory,
    SimpleProxyFactory,
} from "../types/index.js"

const NEUTRAL_CUMULATIVE_FUNDING_RATE = "57896044618658097711785492504343953926634992332820282019728792003956564819968" // 2 ** 255
const FUNDING_RATE_PRECISION = BigInt("1000000000000000000")
const FUNDING_RATE_FACTOR_BASE = BigInt(1_000_000_000)
const FUNDING_RATE_FACTOR = BigInt(23) // 23 / 1_000_000_000 gives 2 promiles a day

describe("Vault.funding_rate", () => {
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

    beforeEach(async () => {
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

    describe("funding rate", () => {
        it("right after a long increasing position", async () => {
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, expandDecimals(1, 8), true))
            const fundingRateResponse = (
                await vaultExpose.functions
                    .calculate_funding_rate(BTC_ASSET, expandDecimals(1, 8), true, NEUTRAL_CUMULATIVE_FUNDING_RATE)
                    .get()
            ).value
            const fundingRate = fundingRateResponse[0].toString()
            expect(fundingRate).toBe("0")
        })

        it("right after a short increasing position", async () => {
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, expandDecimals(1, 8), false))
            const fundingRateResponse = (
                await vaultExpose.functions
                    .calculate_funding_rate(BTC_ASSET, expandDecimals(1, 8), false, NEUTRAL_CUMULATIVE_FUNDING_RATE)
                    .get()
            ).value
            const fundingRate = fundingRateResponse[0].toString()
            expect(fundingRate).toBe("0")
        })

        it("a day after a long increasing position", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await moveBlockchainTime(launchedNode, 86400)
            const fundingRateResponse = (
                await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, size, true, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()
            ).value
            const fundingRate = fundingRateResponse[0].toString()
            const isProfit = fundingRateResponse[1]
            const expectedFundingRate =
                (BigInt(size) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(FUNDING_RATE_FACTOR)) /
                BigInt(FUNDING_RATE_FACTOR_BASE) /
                BigInt(FUNDING_RATE_PRECISION)
            expect(fundingRate).toBe(expectedFundingRate.toString())
            expect(isProfit).toBe(false)
        })

        it("a day after a short increasing position", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await moveBlockchainTime(launchedNode, 86400)
            const fundingRateResponse = (
                await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, size, false, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()
            ).value
            const fundingRate = fundingRateResponse[0].toString()
            const isProfit = fundingRateResponse[1]
            const expectedFundingRate =
                (BigInt(size) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(FUNDING_RATE_FACTOR)) /
                BigInt(FUNDING_RATE_FACTOR_BASE) /
                BigInt(FUNDING_RATE_PRECISION)
            expect(fundingRate).toBe(expectedFundingRate.toString())
            expect(isProfit).toBe(false)
        })

        it("two days, two long increasing positions", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await moveBlockchainTime(launchedNode, 86400)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            const midFundingInfo = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            await moveBlockchainTime(launchedNode, 86400)

            const fundingRateResponse1 = (
                await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, size, true, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()
            ).value
            const fundingRate1 = fundingRateResponse1[0].toString()
            const isProfit1 = fundingRateResponse1[1]
            const fundingRateResponse2 = (
                await vaultExpose.functions
                    .calculate_funding_rate(BTC_ASSET, size, true, midFundingInfo.long_cumulative_funding_rate)
                    .get()
            ).value
            const fundingRate2 = fundingRateResponse2[0].toString()
            const isProfit2 = fundingRateResponse2[1]

            const expectedFundingRate1 =
                (BigInt(size) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(2) * BigInt(FUNDING_RATE_FACTOR)) /
                BigInt(FUNDING_RATE_FACTOR_BASE) /
                BigInt(FUNDING_RATE_PRECISION)
            const expectedFundingRate2 =
                (BigInt(size) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(FUNDING_RATE_FACTOR)) /
                BigInt(FUNDING_RATE_FACTOR_BASE) /
                BigInt(FUNDING_RATE_PRECISION)
            expect(fundingRate1).toBe(expectedFundingRate1.toString())
            expect(fundingRate2).toBe(expectedFundingRate2.toString())
            expect(isProfit1).toBe(false)
            expect(isProfit2).toBe(false)
        })

        it("two days, two short increasing positions", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await moveBlockchainTime(launchedNode, 86400)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            const midFundingInfo = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            await moveBlockchainTime(launchedNode, 86400)

            const fundingRateResponse1 = (
                await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, size, false, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()
            ).value
            const fundingRate1 = fundingRateResponse1[0].toString()
            const isProfit1 = fundingRateResponse1[1]
            const fundingRateResponse2 = (
                await vaultExpose.functions
                    .calculate_funding_rate(BTC_ASSET, size, false, midFundingInfo.short_cumulative_funding_rate)
                    .get()
            ).value
            const fundingRate2 = fundingRateResponse2[0].toString()
            const isProfit2 = fundingRateResponse2[1]

            const expectedFundingRate1 =
                (BigInt(size) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(2) * BigInt(FUNDING_RATE_FACTOR)) /
                BigInt(FUNDING_RATE_FACTOR_BASE) /
                BigInt(FUNDING_RATE_PRECISION)
            const expectedFundingRate2 =
                (BigInt(size) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(FUNDING_RATE_FACTOR)) /
                BigInt(FUNDING_RATE_FACTOR_BASE) /
                BigInt(FUNDING_RATE_PRECISION)
            expect(fundingRate1).toBe(expectedFundingRate1.toString())
            expect(fundingRate2).toBe(expectedFundingRate2.toString())
            expect(isProfit1).toBe(false)
            expect(isProfit2).toBe(false)
        })

        it("one day, with long majority", async () => {
            const sizeLong = expandDecimals(2, 8)
            const sizeLongHalf = expandDecimals(1, 8)
            const sizeShort = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, sizeLong, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, sizeShort, false))
            await moveBlockchainTime(launchedNode, 86400)

            // for long, we use the half of the size to calculate the funding rate
            const longFundingRateResponse = (
                await vaultExpose.functions
                    .calculate_funding_rate(BTC_ASSET, sizeLongHalf, true, NEUTRAL_CUMULATIVE_FUNDING_RATE)
                    .get()
            ).value
            const shortFundingRateResponse = (
                await vaultExpose.functions
                    .calculate_funding_rate(BTC_ASSET, sizeShort, false, NEUTRAL_CUMULATIVE_FUNDING_RATE)
                    .get()
            ).value
            const longFundingRate = longFundingRateResponse[0].toNumber()
            const shortFundingRate = shortFundingRateResponse[0].toNumber()
            const isProfitLong = longFundingRateResponse[1]
            const isProfitShort = shortFundingRateResponse[1]

            const expectedFundingRateLong = Number(
                ((BigInt(sizeLongHalf) / BigInt(2)) *
                    BigInt(FUNDING_RATE_PRECISION) *
                    BigInt(86400) *
                    BigInt(FUNDING_RATE_FACTOR)) /
                    BigInt(FUNDING_RATE_FACTOR_BASE) /
                    BigInt(FUNDING_RATE_PRECISION),
            )
            const expectedFundingRateShort = Number(
                (BigInt(sizeShort) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(FUNDING_RATE_FACTOR)) /
                    BigInt(FUNDING_RATE_FACTOR_BASE) /
                    BigInt(FUNDING_RATE_PRECISION),
            )
            // it may be that a second elapses between two calls and the result is not exactly equal
            expect(longFundingRate).gt(expectedFundingRateLong - 20)
            expect(longFundingRate).lt(expectedFundingRateLong + 20)
            expect(shortFundingRate).gt(expectedFundingRateShort - 20)
            expect(shortFundingRate).lt(expectedFundingRateShort + 20)
            expect(isProfitLong).toBe(false)
            expect(isProfitShort).toBe(true)
        })

        it("one day, with short majority", async () => {
            const sizeShort = expandDecimals(2, 8)
            const sizeShortHalf = expandDecimals(1, 8)
            const sizeLong = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, sizeLong, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, sizeShort, false))
            await moveBlockchainTime(launchedNode, 86400)

            // for short, we use the half of the size to calculate the funding rate
            const shortFundingRateResponse = (
                await vaultExpose.functions
                    .calculate_funding_rate(BTC_ASSET, sizeShortHalf, false, NEUTRAL_CUMULATIVE_FUNDING_RATE)
                    .get()
            ).value
            const longFundingRateResponse = (
                await vaultExpose.functions
                    .calculate_funding_rate(BTC_ASSET, sizeLong, true, NEUTRAL_CUMULATIVE_FUNDING_RATE)
                    .get()
            ).value
            const longFundingRate = longFundingRateResponse[0].toNumber()
            const shortFundingRate = shortFundingRateResponse[0].toNumber()
            const isProfitLong = longFundingRateResponse[1]
            const isProfitShort = shortFundingRateResponse[1]

            const expectedFundingRateShort = Number(
                ((BigInt(sizeShortHalf) / BigInt(2)) *
                    BigInt(FUNDING_RATE_PRECISION) *
                    BigInt(86400) *
                    BigInt(FUNDING_RATE_FACTOR)) /
                    BigInt(FUNDING_RATE_FACTOR_BASE) /
                    BigInt(FUNDING_RATE_PRECISION),
            )
            const expectedFundingRateLong = Number(
                (BigInt(sizeLong) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(FUNDING_RATE_FACTOR)) /
                    BigInt(FUNDING_RATE_FACTOR_BASE) /
                    BigInt(FUNDING_RATE_PRECISION),
            )
            // it may be that a second elapses between two calls and the result is not exactly equal
            expect(longFundingRate).gt(expectedFundingRateLong - 20)
            expect(longFundingRate).lt(expectedFundingRateLong + 20)
            expect(shortFundingRate).gt(expectedFundingRateShort - 20)
            expect(shortFundingRate).lt(expectedFundingRateShort + 20)
            expect(isProfitLong).toBe(true)
            expect(isProfitShort).toBe(false)
        })

        it("no funding when open interest is balanced", async () => {
            const size = expandDecimals(5, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await moveBlockchainTime(launchedNode, 86400)
            const longRes = (
                await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, size, true, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()
            ).value
            const shortRes = (
                await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, size, false, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()
            ).value
            // it may be that a second elapses between two calls and the result is not exactly 0
            expect(longRes[0].toNumber()).lt(20)
            expect(shortRes[0].toNumber()).lt(20)
        })

        it("no funding for longs when open interest is balanced in aggregation", async () => {
            const size = expandDecimals(5, 8)
            const sizeTest = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await moveBlockchainTime(launchedNode, 86400)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await moveBlockchainTime(launchedNode, 86400)
            const longRes = (
                await vaultExpose.functions
                    .calculate_funding_rate(BTC_ASSET, sizeTest, true, NEUTRAL_CUMULATIVE_FUNDING_RATE)
                    .get()
            ).value
            // it may be that a second elapses between two calls and the result is not exactly 0
            expect(longRes[0].toNumber()).lt(20)
        })

        it("no funding for shorts when open interest is balanced in aggregation", async () => {
            const size = expandDecimals(5, 8)
            const sizeTest = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await moveBlockchainTime(launchedNode, 86400)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await moveBlockchainTime(launchedNode, 86400)
            const shortRes = (
                await vaultExpose.functions
                    .calculate_funding_rate(BTC_ASSET, sizeTest, false, NEUTRAL_CUMULATIVE_FUNDING_RATE)
                    .get()
            ).value
            // it may be that a second elapses between two calls and the result is not exactly 0
            expect(shortRes[0].toNumber()).lt(20)
        })
    })

    describe("funding info updates", () => {
        it("update_funding_info works on an emmpty pool", async () => {
            await call(vaultExpose.functions.update_funding_info(BTC_ASSET))
            const fundingInfo = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            expect(fundingInfo.long_cumulative_funding_rate.toString()).toBe(NEUTRAL_CUMULATIVE_FUNDING_RATE.toString())
            expect(fundingInfo.short_cumulative_funding_rate.toString()).toBe(NEUTRAL_CUMULATIVE_FUNDING_RATE.toString())
            expect(fundingInfo.total_long_sizes.toString()).toBe("0")
            expect(fundingInfo.total_short_sizes.toString()).toBe("0")
            expect(fundingInfo.last_funding_time.toString()).not.toBe("0")
        })

        it("update_funding_info moves cumulative rates over time without size changes (longs majority)", async () => {
            const size = expandDecimals(2, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await moveBlockchainTime(launchedNode, 3600)
            const preFundingInfo = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            await call(vaultExpose.functions.update_funding_info(BTC_ASSET))
            const fundingInfo = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value

            const expectedDelta =
                (BigInt(FUNDING_RATE_PRECISION) * BigInt(3600) * BigInt(FUNDING_RATE_FACTOR)) / BigInt(FUNDING_RATE_FACTOR_BASE)
            const expectedLongCumulativeFundingRate =
                BigInt(preFundingInfo.long_cumulative_funding_rate.toString()) + expectedDelta
            expect(fundingInfo.long_cumulative_funding_rate.toString()).toBe(expectedLongCumulativeFundingRate.toString())
        })

        it("update_funding_info moves cumulative rates over time without size changes (shots majority)", async () => {
            const size = expandDecimals(2, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await moveBlockchainTime(launchedNode, 3600)
            const preFundingInfo = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            await call(vaultExpose.functions.update_funding_info(BTC_ASSET))
            const fundingInfo = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value

            const expectedDelta =
                (BigInt(FUNDING_RATE_PRECISION) * BigInt(3600) * BigInt(FUNDING_RATE_FACTOR)) / BigInt(FUNDING_RATE_FACTOR_BASE)
            const expectedShortCumulativeFundingRate =
                BigInt(preFundingInfo.short_cumulative_funding_rate.toString()) + expectedDelta
            expect(fundingInfo.short_cumulative_funding_rate.toString()).toBe(expectedShortCumulativeFundingRate.toString())
        })
    })

    describe("extreme values", () => {
        it("should work with empty pool", async () => {
            const fundingRateResponse = (
                await vaultExpose.functions
                    .calculate_funding_rate(BTC_ASSET, expandDecimals(1, 8), true, NEUTRAL_CUMULATIVE_FUNDING_RATE)
                    .get()
            ).value
            const fundingRate = fundingRateResponse[0].toString()
            expect(fundingRate).toBe("0")
        })

        it("should work with emptied pool", async () => {
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, expandDecimals(1, 8), true))
            await call(vaultExpose.functions.decrease_and_update_funding_info(BTC_ASSET, expandDecimals(1, 8), true))
            const fundingRateResponse = (
                await vaultExpose.functions
                    .calculate_funding_rate(BTC_ASSET, expandDecimals(1, 8), true, NEUTRAL_CUMULATIVE_FUNDING_RATE)
                    .get()
            ).value
            const fundingRate = fundingRateResponse[0].toNumber()
            // it may be that a second elapses between two calls and the result is not exactly 0
            expect(fundingRate).lt(20)
        })
    })

    describe("get_funding_info", () => {
        it("default funding info", async () => {
            const fundingInfo = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            expect(fundingInfo.long_cumulative_funding_rate.toString()).toBe(NEUTRAL_CUMULATIVE_FUNDING_RATE.toString())
            expect(fundingInfo.short_cumulative_funding_rate.toString()).toBe(NEUTRAL_CUMULATIVE_FUNDING_RATE.toString())
            expect(fundingInfo.last_funding_time.toString()).toBe("0")
            expect(fundingInfo.total_long_sizes.toString()).toBe("0")
            expect(fundingInfo.total_short_sizes.toString()).toBe("0")
        })

        it("funding info after increasing long position", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            const fundingInfo = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            expect(fundingInfo.total_long_sizes.toString()).toBe(size)
            expect(fundingInfo.total_short_sizes.toString()).toBe("0")
        })

        it("funding info after increasing short position", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            const fundingInfo = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            expect(fundingInfo.total_long_sizes.toString()).toBe("0")
            expect(fundingInfo.total_short_sizes.toString()).toBe(size)
        })

        it("funding info after decreasing long position", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await call(vaultExpose.functions.decrease_and_update_funding_info(BTC_ASSET, size, true))
            const fundingInfo = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            expect(fundingInfo.total_long_sizes.toString()).toBe(size)
            expect(fundingInfo.total_short_sizes.toString()).toBe("0")
        })

        it("funding info after decreasing short position", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await call(vaultExpose.functions.decrease_and_update_funding_info(BTC_ASSET, size, false))
            const fundingInfo = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            expect(fundingInfo.total_long_sizes.toString()).toBe("0")
            expect(fundingInfo.total_short_sizes.toString()).toBe(size)
        })

        it("funding info after mixed operations", async () => {
            const longSize = expandDecimals(2, 8)
            const shortSize = expandDecimals(3, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, longSize, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, shortSize, false))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, longSize, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, shortSize, false))
            await call(vaultExpose.functions.decrease_and_update_funding_info(BTC_ASSET, longSize, true))
            await call(vaultExpose.functions.decrease_and_update_funding_info(BTC_ASSET, shortSize, false))
            const fundingInfo = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            expect(fundingInfo.total_long_sizes.toString()).toBe(longSize)
            expect(fundingInfo.total_short_sizes.toString()).toBe(shortSize)
        })
    })

    describe("calculate_cumulative_funding_rate", () => {
        async function testCalculateCumulativeFundingRate(totalShortSizes: string, totalLongSizes: string, timeDelta: bigint) {
            const now = BigInt(DateTime.fromUnixMilliseconds(DateTime.now()).toTai64())
            const fundingInfo = {
                total_short_sizes: totalShortSizes,
                total_long_sizes: totalLongSizes,
                long_cumulative_funding_rate: CUMULATIVE_FUNDING_RATE_NEUTRAL,
                short_cumulative_funding_rate: CUMULATIVE_FUNDING_RATE_NEUTRAL,
                last_funding_time: (now - timeDelta).toString(),
            }
            const {
                longCumulativeFundingRateDelta: expectedLongCumulativeFundingRateDelta,
                shortCumulativeFundingRateDelta: expectedShortCumulativeFundingRateDelta,
            } = calculateTotalFundingRateDelta(BigInt(totalLongSizes), BigInt(totalShortSizes), timeDelta)
            const response = (await vaultExpose.functions.calculate_cumulative_funding_rate(fundingInfo, now.toString()).get())
                .value
            const longCumulativeFundingRateDelta = BigInt(response[0].toString()) - BigInt(CUMULATIVE_FUNDING_RATE_NEUTRAL)
            const shortCumulativeFundingRateDelta = BigInt(response[1].toString()) - BigInt(CUMULATIVE_FUNDING_RATE_NEUTRAL)

            expect(longCumulativeFundingRateDelta.toString()).toBe(expectedLongCumulativeFundingRateDelta.toString())
            expect(shortCumulativeFundingRateDelta.toString()).toBe(expectedShortCumulativeFundingRateDelta.toString())
        }

        it("compare to javascript implementation", async () => {
            // short sizes, long sizes, time delta in seconds
            await testCalculateCumulativeFundingRate("0", "0", BigInt(0))
            await testCalculateCumulativeFundingRate("0", "0", BigInt(3600))
            await testCalculateCumulativeFundingRate("10000000000", "0", BigInt(3600))
            await testCalculateCumulativeFundingRate("0", "10000000000", BigInt(3600))
            await testCalculateCumulativeFundingRate("10000000000", "20000000000", BigInt(0))
            await testCalculateCumulativeFundingRate("20000000000", "10000000000", BigInt(0))

            await testCalculateCumulativeFundingRate("10000000000", "10000000000", BigInt(1))
            await testCalculateCumulativeFundingRate("20000000000", "10000000000", BigInt(1))
            await testCalculateCumulativeFundingRate("10000000000", "20000000000", BigInt(1))

            await testCalculateCumulativeFundingRate("10000000000", "10000000000", BigInt(3600))
            await testCalculateCumulativeFundingRate("20000000000", "10000000000", BigInt(3600))
            await testCalculateCumulativeFundingRate("10000000000", "20000000000", BigInt(3600))

            await testCalculateCumulativeFundingRate("1000000000000000000", "1000000000000000000", BigInt(3600))
            await testCalculateCumulativeFundingRate("2000000000000000000", "1000000000000000000", BigInt(3600))
            await testCalculateCumulativeFundingRate("1000000000000000000", "2000000000000000000", BigInt(3600))
        })
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
