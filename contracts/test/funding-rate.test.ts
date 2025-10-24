import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AbstractContract, WalletUnlocked, BN } from "fuels"
import { launchNode, getNodeWallets } from "./node"
import { 
    call, AddressIdentity, walletToAddressIdentity, expandDecimals,
    COLLATERAL_ASSET, USDC_ASSET, BTC_ASSET,
    BTC_MAX_LEVERAGE, getBtcConfig, getUsdcConfig,
    getAssetId,
    moveBlockchainTime,
} from "./utils"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import { FungibleFactory, PricefeedWrapperFactory, StorkMockFactory, VaultExposeFactory } from '../types';
import { Fungible, VaultExpose, StorkMock, PricefeedWrapper } from "../types"
import { FundingInfoInput } from "../types/VaultExpose"

const NEUTRAL_CUMULATIVE_FUNDING_RATE = "57896044618658097711785492504343953926634992332820282019728792003956564819968"; // 2 ** 255
const FUNDING_RATE_PRECISION = BigInt("1000000000000000000");
const FUNDING_RATE_FACTOR_BASE = BigInt(1_000_000_000);
const FUNDING_RATE_INTERVAL = BigInt(1); // 1 second
const FUNDING_RATE_FACTOR = BigInt(23); // 23 / 1_000_000_000 gives 2 promiles a day

describe("Vault.funding_rate", () => {
    let attachedContracts: AbstractContract[]
    let launchedNode: LaunchTestNodeReturn<DeployContractConfig[]>
    let deployer: WalletUnlocked
    let user0: WalletUnlocked
    let user1: WalletUnlocked
    let user2: WalletUnlocked
    let liquidator: WalletUnlocked
    let deployerIdentity: AddressIdentity
    let user0Identity: AddressIdentity
    let user1Identity: AddressIdentity
    let user2Identity: AddressIdentity
    let liquidatorIdentity: AddressIdentity
    let BNB: Fungible
    let USDC: Fungible
    let BTC: Fungible
    let USDC_ASSET_ID: string
    let LP_ASSET_ID: string
    let storkMock: StorkMock
    let pricefeedWrapper: PricefeedWrapper
    let vaultExpose: VaultExpose
    let vaultExpose_user0: VaultExpose
    let vaultExpose_user1: VaultExpose

    beforeEach(async () => {
        launchedNode = await launchNode()
        ;[ deployer, user0, user1, user2, liquidator ] = getNodeWallets(launchedNode)

        deployerIdentity = walletToAddressIdentity(deployer)
        user0Identity = walletToAddressIdentity(user0)
        user1Identity = walletToAddressIdentity(user1)
        user2Identity = walletToAddressIdentity(user2)
        liquidatorIdentity = walletToAddressIdentity(liquidator)

          
        /*
            NativeAsset + Pricefeed
        */
        const { waitForResult: waitForResultBNB } = await FungibleFactory.deploy(deployer)
        const { contract: _BNB } = await waitForResultBNB()
        BNB = _BNB
        const { waitForResult: waitForResultUSDC } = await FungibleFactory.deploy(deployer)
        const { contract: _USDC } = await waitForResultUSDC()
        USDC = _USDC
        const { waitForResult: waitForResultBTC } = await FungibleFactory.deploy(deployer)
        const { contract: _BTC } = await waitForResultBTC()
        BTC = _BTC

        USDC_ASSET_ID = getAssetId(USDC)

        const { waitForResult: waitForResultStorkMock } = await StorkMockFactory.deploy(deployer)
        const { contract: _storkMock } = await waitForResultStorkMock()
        storkMock = _storkMock
        const { waitForResult: waitForResultPricefeedWrapper } = await PricefeedWrapperFactory.deploy(deployer, { configurableConstants: { 
            STORK_CONTRACT: { bits: storkMock.id.b256Address },
        }})
        const { contract: _pricefeedWrapper } = await waitForResultPricefeedWrapper()
        pricefeedWrapper = _pricefeedWrapper

        const { waitForResult: waitForResultVault } = await VaultExposeFactory.deploy(deployer, { configurableConstants: {
            COLLATERAL_ASSET_ID: { bits: USDC_ASSET_ID },
            COLLATERAL_ASSET: COLLATERAL_ASSET,
            COLLATERAL_ASSET_DECIMALS: 9,
            PRICEFEED_WRAPPER: { bits: pricefeedWrapper.id.b256Address },
        }})
        const { contract: _vaultExpose } = await waitForResultVault()
        vaultExpose = _vaultExpose
        
        attachedContracts = [vaultExpose, storkMock, pricefeedWrapper]
        LP_ASSET_ID = (await vaultExpose.functions.get_lp_asset().get()).value.bits.toString()

        await call(vaultExpose.functions.initialize(deployerIdentity))
        await call(vaultExpose.functions.set_liquidator(liquidatorIdentity, true))

        await call(
            vaultExpose.functions.set_fees(
                30, // mint_burn_fee_basis_points
                10, // margin_fee_basis_points
                expandDecimals(5), // liquidation_fee_usd
            ),
        )

        vaultExpose_user0 = new VaultExpose(vaultExpose.id.toAddress(), user0)
        vaultExpose_user1 = new VaultExpose(vaultExpose.id.toAddress(), user1)

        await call(storkMock.functions.update_price(USDC_ASSET, expandDecimals(1, 18)))

        await call(vaultExpose.functions.set_asset_config(...getUsdcConfig()))
        await call(vaultExpose.functions.set_asset_config(...getBtcConfig()))
        await call(vaultExpose.functions.set_max_leverage(BTC_ASSET, BTC_MAX_LEVERAGE))

        await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(40000, 18)))
    })

    describe("funding rate", () => {
        it("right after a long increasing position", async () => {
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, expandDecimals(1, 8), true))
            const funding_rate_response = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, expandDecimals(1, 8), true, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            const funding_rate = funding_rate_response[0].toString()
            const is_profit = funding_rate_response[1]
            expect(funding_rate).toBe("0")
        })

        it("right after a short increasing position", async () => {
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, expandDecimals(1, 8), false))
            const funding_rate_response = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, expandDecimals(1, 8), false, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            const funding_rate = funding_rate_response[0].toString()
            const is_profit = funding_rate_response[1]
            expect(funding_rate).toBe("0")
        })

        it("a day after a long increasing position", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await moveBlockchainTime(launchedNode, 86400)
            const funding_rate_response = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, size, true, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            const funding_rate = funding_rate_response[0].toString()
            const is_profit = funding_rate_response[1]
            const expected_funding_rate = BigInt(size) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(FUNDING_RATE_FACTOR) / BigInt(FUNDING_RATE_FACTOR_BASE) / BigInt(FUNDING_RATE_PRECISION)
            expect(funding_rate).toBe(expected_funding_rate.toString())
            expect(is_profit).toBe(false)
        })

        it("a day after a short increasing position", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await moveBlockchainTime(launchedNode, 86400)
            const funding_rate_response = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, size, false, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            const funding_rate = funding_rate_response[0].toString()
            const is_profit = funding_rate_response[1]
            const expected_funding_rate = BigInt(size) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(FUNDING_RATE_FACTOR) / BigInt(FUNDING_RATE_FACTOR_BASE) / BigInt(FUNDING_RATE_PRECISION)
            expect(funding_rate).toBe(expected_funding_rate.toString())
            expect(is_profit).toBe(false)
        })

        it("two days, two long increasing positions", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await moveBlockchainTime(launchedNode, 86400)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            const midFundingInfo = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            await moveBlockchainTime(launchedNode, 86400)

            const funding_rate_response_1 = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, size, true, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            const funding_rate_1 = funding_rate_response_1[0].toString()
            const is_profit_1 = funding_rate_response_1[1]
            const funding_rate_response_2 = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, size, true, midFundingInfo.long_cumulative_funding_rate).get()).value
            const funding_rate_2 = funding_rate_response_2[0].toString()
            const is_profit_2 = funding_rate_response_2[1]

            const expected_funding_rate_1 = BigInt(size) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(2) * BigInt(FUNDING_RATE_FACTOR) / BigInt(FUNDING_RATE_FACTOR_BASE) / BigInt(FUNDING_RATE_PRECISION)
            const expected_funding_rate_2 = BigInt(size) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(FUNDING_RATE_FACTOR) / BigInt(FUNDING_RATE_FACTOR_BASE) / BigInt(FUNDING_RATE_PRECISION)
            expect(funding_rate_1).toBe(expected_funding_rate_1.toString())
            expect(funding_rate_2).toBe(expected_funding_rate_2.toString())
            expect(is_profit_1).toBe(false)
            expect(is_profit_2).toBe(false)
        })

        it("two days, two short increasing positions", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await moveBlockchainTime(launchedNode, 86400)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            const midFundingInfo = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            await moveBlockchainTime(launchedNode, 86400)

            const funding_rate_response_1 = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, size, false, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            const funding_rate_1 = funding_rate_response_1[0].toString()
            const is_profit_1 = funding_rate_response_1[1]
            const funding_rate_response_2 = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, size, false, midFundingInfo.short_cumulative_funding_rate).get()).value
            const funding_rate_2 = funding_rate_response_2[0].toString()
            const is_profit_2 = funding_rate_response_2[1]

            const expected_funding_rate_1 = BigInt(size) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(2) * BigInt(FUNDING_RATE_FACTOR) / BigInt(FUNDING_RATE_FACTOR_BASE) / BigInt(FUNDING_RATE_PRECISION)
            const expected_funding_rate_2 = BigInt(size) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(FUNDING_RATE_FACTOR) / BigInt(FUNDING_RATE_FACTOR_BASE) / BigInt(FUNDING_RATE_PRECISION)
            expect(funding_rate_1).toBe(expected_funding_rate_1.toString())
            expect(funding_rate_2).toBe(expected_funding_rate_2.toString())
            expect(is_profit_1).toBe(false)
            expect(is_profit_2).toBe(false)
        })

        it("one day, with long majority", async () => {
            const sizeLong = expandDecimals(2, 8)
            const sizeLongHalf = expandDecimals(1, 8)
            const sizeShort = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, sizeLong, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, sizeShort, false))
            await moveBlockchainTime(launchedNode, 86400)

            // for long, we use the half of the size to calculate the funding rate
            const long_funding_rate_response = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, sizeLongHalf, true, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            const short_funding_rate_response = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, sizeShort, false, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            const long_funding_rate = long_funding_rate_response[0].toNumber()
            const short_funding_rate = short_funding_rate_response[0].toNumber()
            const is_profit_long = long_funding_rate_response[1]
            const is_profit_short = short_funding_rate_response[1]

            const expected_funding_rate_long = Number(BigInt(sizeLongHalf) / BigInt(2) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(FUNDING_RATE_FACTOR) / BigInt(FUNDING_RATE_FACTOR_BASE) / BigInt(FUNDING_RATE_PRECISION))
            const expected_funding_rate_short = Number(BigInt(sizeShort) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(FUNDING_RATE_FACTOR) / BigInt(FUNDING_RATE_FACTOR_BASE) / BigInt(FUNDING_RATE_PRECISION))
            // it may be that a second elapses between two calls and the result is not exactly equal
            expect(long_funding_rate).gt(expected_funding_rate_long - 20)
            expect(long_funding_rate).lt(expected_funding_rate_long + 20)
            expect(short_funding_rate).gt(expected_funding_rate_short - 20)
            expect(short_funding_rate).lt(expected_funding_rate_short + 20)
            expect(is_profit_long).toBe(false)
            expect(is_profit_short).toBe(true)
        })

        it("one day, with short majority", async () => {
            const sizeShort = expandDecimals(2, 8)
            const sizeShortHalf = expandDecimals(1, 8)
            const sizeLong = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, sizeLong, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, sizeShort, false))
            await moveBlockchainTime(launchedNode, 86400)

            // for short, we use the half of the size to calculate the funding rate
            const short_funding_rate_response = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, sizeShortHalf, false, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            const long_funding_rate_response = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, sizeLong, true, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            const long_funding_rate = long_funding_rate_response[0].toNumber()
            const short_funding_rate = short_funding_rate_response[0].toNumber()
            const is_profit_long = long_funding_rate_response[1]
            const is_profit_short = short_funding_rate_response[1]

            const expected_funding_rate_short = Number(BigInt(sizeShortHalf) / BigInt(2) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(FUNDING_RATE_FACTOR) / BigInt(FUNDING_RATE_FACTOR_BASE) / BigInt(FUNDING_RATE_PRECISION))
            const expected_funding_rate_long = Number(BigInt(sizeLong) * BigInt(FUNDING_RATE_PRECISION) * BigInt(86400) * BigInt(FUNDING_RATE_FACTOR) / BigInt(FUNDING_RATE_FACTOR_BASE) / BigInt(FUNDING_RATE_PRECISION))
            // it may be that a second elapses between two calls and the result is not exactly equal
            expect(long_funding_rate).gt(expected_funding_rate_long - 20)
            expect(long_funding_rate).lt(expected_funding_rate_long + 20)
            expect(short_funding_rate).gt(expected_funding_rate_short - 20)
            expect(short_funding_rate).lt(expected_funding_rate_short + 20)
            expect(is_profit_long).toBe(true)
            expect(is_profit_short).toBe(false)
        })

        it("no funding when open interest is balanced", async () => {
            const size = expandDecimals(5, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await moveBlockchainTime(launchedNode, 86400)
            const longRes = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, size, true, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            const shortRes = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, size, false, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            // it may be that a second elapses between two calls and the result is not exactly 0
            expect(longRes[0].toNumber()).lt(20)
            expect(shortRes[0].toNumber()).lt(20)
        })

        it("no funding for long when open interest is balanced in aggregation", async () => {
            const size = expandDecimals(5, 8)
            const sizeTest = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await moveBlockchainTime(launchedNode, 86400)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await moveBlockchainTime(launchedNode, 86400)
            const longRes = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, sizeTest, true, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            // it may be that a second elapses between two calls and the result is not exactly 0
            expect(longRes[0].toNumber()).lt(20)
        })

        it("no funding for short when open interest is balanced in aggregation", async () => {
            const size = expandDecimals(5, 8)
            const sizeTest = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await moveBlockchainTime(launchedNode, 86400)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await moveBlockchainTime(launchedNode, 86400)
            const shortRes = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, sizeTest, false, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            // it may be that a second elapses between two calls and the result is not exactly 0
            expect(shortRes[0].toNumber()).lt(20)
        })
    })

    describe("funding info updates", () => {
        it("update_funding_info works on an emmpty pool", async () => {
            await call(vaultExpose.functions.update_funding_info(BTC_ASSET))
            const funding_info = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            expect(funding_info.long_cumulative_funding_rate.toString()).toBe(NEUTRAL_CUMULATIVE_FUNDING_RATE.toString())
            expect(funding_info.short_cumulative_funding_rate.toString()).toBe(NEUTRAL_CUMULATIVE_FUNDING_RATE.toString())
            expect(funding_info.total_long_sizes.toString()).toBe("0")
            expect(funding_info.total_short_sizes.toString()).toBe("0")
            expect(funding_info.last_funding_time.toString()).not.toBe("0")
        })

        it("update_funding_info moves cumulative rates over time without size changes (longs majority)", async () => {
            const size = expandDecimals(2, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await moveBlockchainTime(launchedNode, 3600)
            const pre_funding_info = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            await call(vaultExpose.functions.update_funding_info(BTC_ASSET))
            const funding_info = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value

            const expected_delta = BigInt(FUNDING_RATE_PRECISION) * BigInt(3600) * BigInt(FUNDING_RATE_FACTOR) / BigInt(FUNDING_RATE_FACTOR_BASE)
            const expected_long_cumulative_funding_rate = BigInt(pre_funding_info.long_cumulative_funding_rate.toString()) + expected_delta
            expect(funding_info.long_cumulative_funding_rate.toString()).toBe(expected_long_cumulative_funding_rate.toString())
        })

        it("update_funding_info moves cumulative rates over time without size changes (shots majority)", async () => {
            const size = expandDecimals(2, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await moveBlockchainTime(launchedNode, 3600)
            const pre_funding_info = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            await call(vaultExpose.functions.update_funding_info(BTC_ASSET))
            const funding_info = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value

            const expected_delta = BigInt(FUNDING_RATE_PRECISION) * BigInt(3600) * BigInt(FUNDING_RATE_FACTOR) / BigInt(FUNDING_RATE_FACTOR_BASE)
            const expected_short_cumulative_funding_rate = BigInt(pre_funding_info.short_cumulative_funding_rate.toString()) + expected_delta
            expect(funding_info.short_cumulative_funding_rate.toString()).toBe(expected_short_cumulative_funding_rate.toString())
        })
    })

    describe("extreme values", () => {
        it("should work with empty pool", async () => {
            const funding_rate_response = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, expandDecimals(1, 8), true, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            const funding_rate = funding_rate_response[0].toString()
            expect(funding_rate).toBe("0")
        })

        it("should work with emptied pool", async () => {
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, expandDecimals(1, 8), true))
            await call(vaultExpose.functions.decrease_and_update_funding_info(BTC_ASSET, expandDecimals(1, 8), true))
            const funding_rate_response = (await vaultExpose.functions.calculate_funding_rate(BTC_ASSET, expandDecimals(1, 8), true, NEUTRAL_CUMULATIVE_FUNDING_RATE).get()).value
            const funding_rate = funding_rate_response[0].toNumber()
            // it may be that a second elapses between two calls and the result is not exactly 0
            expect(funding_rate).lt(20)
        })
    })

    describe("get_funding_info", () => {
        it("default funding info", async () => {
            const funding_info = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            expect(funding_info.long_cumulative_funding_rate.toString()).toBe(NEUTRAL_CUMULATIVE_FUNDING_RATE.toString())
            expect(funding_info.short_cumulative_funding_rate.toString()).toBe(NEUTRAL_CUMULATIVE_FUNDING_RATE.toString())
            expect(funding_info.last_funding_time.toString()).toBe("0")
            expect(funding_info.total_long_sizes.toString()).toBe("0")
            expect(funding_info.total_short_sizes.toString()).toBe("0")
        })

        it("funding info after increasing long position", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            const funding_info = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            expect(funding_info.total_long_sizes.toString()).toBe(size)
            expect(funding_info.total_short_sizes.toString()).toBe("0")
        })

        it("funding info after increasing short position", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            const funding_info = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            expect(funding_info.total_long_sizes.toString()).toBe("0")
            expect(funding_info.total_short_sizes.toString()).toBe(size)
        })

        it("funding info after decreasing long position", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, true))
            await call(vaultExpose.functions.decrease_and_update_funding_info(BTC_ASSET, size, true))
            const funding_info = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            expect(funding_info.total_long_sizes.toString()).toBe(size)
            expect(funding_info.total_short_sizes.toString()).toBe("0")
        })

        it("funding info after decreasing short position", async () => {
            const size = expandDecimals(1, 8)
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await call(vaultExpose.functions.increase_and_update_funding_info(BTC_ASSET, size, false))
            await call(vaultExpose.functions.decrease_and_update_funding_info(BTC_ASSET, size, false))
            const funding_info = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            expect(funding_info.total_long_sizes.toString()).toBe("0")
            expect(funding_info.total_short_sizes.toString()).toBe(size)
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
            const funding_info = (await vaultExpose.functions.get_funding_info(BTC_ASSET).get()).value
            expect(funding_info.total_long_sizes.toString()).toBe(longSize)
            expect(funding_info.total_short_sizes.toString()).toBe(shortSize)
        })
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})

