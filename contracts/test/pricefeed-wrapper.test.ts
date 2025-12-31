import { BN, DateTime, WalletUnlocked } from "fuels"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { PricefeedWrapper, PricefeedWrapperFactory, StorkMock, StorkMockFactory } from "../types/index.js"
import { getNodeWallets, launchNode } from "./node.js"
import { BTC_ASSET, call, ETH_ASSET, USDC_ASSET } from "./utils.js"

function toPrice(value: number, decimals: number = 9): string {
    const v = BigInt(value) * BigInt(10) ** BigInt(decimals)
    return v.toString()
}

describe("PricefeedWrapper", () => {
    let launchedNode: LaunchTestNodeReturn<DeployContractConfig[]>
    let deployer: WalletUnlocked
    let storkMock: StorkMock
    let pricefeedWrapper: PricefeedWrapper

    beforeEach(async () => {
        launchedNode = await launchNode()
        ;[deployer, ,] = getNodeWallets(launchedNode)

        // Deploy StorkMock contract first
        const { waitForResult: waitForResultStorkMock } = await StorkMockFactory.deploy(deployer)
        const { contract: storkMockDeployed } = await waitForResultStorkMock()
        storkMock = storkMockDeployed

        // Deploy PricefeedWrapper with StorkMock as dependency
        const { waitForResult: waitForResultPricefeedWrapper } = await PricefeedWrapperFactory.deploy(deployer, {
            configurableConstants: {
                STORK_CONTRACT: { bits: storkMock.id.b256Address },
            },
        })
        const { contract: pricefeedWrapperDeployed } = await waitForResultPricefeedWrapper()
        pricefeedWrapper = pricefeedWrapperDeployed
    })

    describe("mock", () => {
        it("should return correct positive price", async () => {
            const btcPrice = toPrice(45000, 18) // 45000 USD with 18 decimals

            // Update price in StorkMock
            await call(storkMock.functions.update_price(BTC_ASSET, btcPrice))

            // Get price through PricefeedWrapper
            const checkPrice = (await storkMock.functions.get_temporal_numeric_value_unchecked_v1(BTC_ASSET).get()).value
            const { provider } = launchedNode
            const block = await provider.getBlock("latest")
            if (!block) {
                throw new Error("No latest block")
            }
            const { time: timeLastBlockProduced } = block
            const latestBlockUTCTimestamp = DateTime.fromTai64(timeLastBlockProduced).toUnixMilliseconds()
            const priceTimestamp = checkPrice.timestamp_ns.div(1000000) // convert nanoseconds to milliseconds
            expect(priceTimestamp.toString()).to.equal(latestBlockUTCTimestamp.toString())
            const quantizedValue = checkPrice.quantized_value
            const underlying = quantizedValue.underlying
            // 2 ** 64 = 18446744073709551616
            // 2 ** 127 = 170141183460469231731687303715884105728
            // 2 ** 127 is zero for i128
            const calculatedBtcPrice = underlying.upper
                .mul(new BN("18446744073709551616"))
                .add(underlying.lower)
                .sub(new BN("170141183460469231731687303715884105728"))
            expect(calculatedBtcPrice.toString()).to.equal(btcPrice.toString())
        })

        it("should return correct negative price", async () => {
            const btcPrice = toPrice(45000, 18) // 45000 USD with 18 decimals

            // Update price in StorkMock
            await call(storkMock.functions.update_negative_price(BTC_ASSET, btcPrice))

            // Get price through PricefeedWrapper
            const checkPrice = (await storkMock.functions.get_temporal_numeric_value_unchecked_v1(BTC_ASSET).get()).value
            const { provider } = launchedNode
            const block = await provider.getBlock("latest")
            if (!block) {
                throw new Error("No latest block")
            }
            const { time: timeLastBlockProduced } = block
            const latestBlockUTCTimestamp = DateTime.fromTai64(timeLastBlockProduced).toUnixMilliseconds()
            const priceTimestamp = checkPrice.timestamp_ns.div(1000000) // convert nanoseconds to milliseconds
            expect(priceTimestamp.toString()).to.equal(latestBlockUTCTimestamp.toString())
            const quantizedValue = checkPrice.quantized_value
            const underlying = quantizedValue.underlying
            // 2 ** 64 = 18446744073709551616
            // 2 ** 127 = 170141183460469231731687303715884105728
            // 2 ** 127 is zero for i128
            const calculatedBtcPrice = new BN("170141183460469231731687303715884105728").sub(
                underlying.upper.mul(new BN("18446744073709551616")).add(underlying.lower),
            )
            expect(calculatedBtcPrice.toString()).to.equal(btcPrice.toString())
        })
    })

    describe("price function", () => {
        it("should return correct price for BTC", async () => {
            const btcPrice = toPrice(45000, 18) // 45000 USD with 18 decimals

            // Update price in StorkMock
            await call(storkMock.functions.update_price(BTC_ASSET, btcPrice))

            // Get price through PricefeedWrapper
            const result = (await pricefeedWrapper.functions.price(BTC_ASSET).get()).value

            expect(result.toString()).to.equal(btcPrice.toString())
        })

        it("should handle zero price", async () => {
            const zeroPrice = toPrice(0, 18)

            // Update price in StorkMock
            await call(storkMock.functions.update_price(BTC_ASSET, zeroPrice))

            // Get price through PricefeedWrapper
            const result = (await pricefeedWrapper.functions.price(BTC_ASSET).get()).value

            expect(result.toString()).to.equal(zeroPrice.toString())
        })

        it("should handle very large prices", async () => {
            const largePrice = toPrice(1000000000, 18) // 1 bilion USD with 18 decimals

            // Update price in StorkMock
            await call(storkMock.functions.update_price(BTC_ASSET, largePrice))

            // Get price through PricefeedWrapper
            const result = (await pricefeedWrapper.functions.price(BTC_ASSET).get()).value

            expect(result.toString()).to.equal(largePrice.toString())
        })

        it("should handle very small prices", async () => {
            const smallPrice = 1 // Very small price with 18 decimals

            // Update price in StorkMock
            await call(storkMock.functions.update_price(BTC_ASSET, smallPrice))

            // Get price through PricefeedWrapper
            const result = (await pricefeedWrapper.functions.price(BTC_ASSET).get()).value

            expect(result.toString()).to.equal(smallPrice.toString())
        })

        it("should handle multiple different assets", async () => {
            const btcPrice = toPrice(45000, 18)
            const usdcPrice = toPrice(1, 18)
            const ethPrice = toPrice(3000, 18)

            // Update prices for different assets
            await call(storkMock.functions.update_price(BTC_ASSET, btcPrice))
            await call(storkMock.functions.update_price(USDC_ASSET, usdcPrice))
            await call(storkMock.functions.update_price(ETH_ASSET, ethPrice))

            // Get prices for each asset
            const btcResult = (await pricefeedWrapper.functions.price(BTC_ASSET).get()).value
            const usdcResult = (await pricefeedWrapper.functions.price(USDC_ASSET).get()).value
            const ethResult = (await pricefeedWrapper.functions.price(ETH_ASSET).get()).value

            expect(btcResult.toString()).to.equal(btcPrice.toString())
            expect(usdcResult.toString()).to.equal(usdcPrice.toString())
            expect(ethResult.toString()).to.equal(ethPrice.toString())
        })

        it("should handle price updates", async () => {
            const initialPrice = toPrice(40000, 18)
            const updatedPrice = toPrice(50000, 18)

            // Set initial price
            await call(storkMock.functions.update_price(BTC_ASSET, initialPrice))
            let result = (await pricefeedWrapper.functions.price(BTC_ASSET).get()).value
            expect(result.toString()).to.equal(initialPrice.toString())

            // Update price
            await call(storkMock.functions.update_price(BTC_ASSET, updatedPrice))
            result = (await pricefeedWrapper.functions.price(BTC_ASSET).get()).value
            expect(result.toString()).to.equal(updatedPrice.toString())
        })

        it("should handle negative prices (absolute value)", async () => {
            // Note: The PricefeedWrapper uses absolute value of the price
            // This tests the price conversion logic for negative values
            const btcPrice = toPrice(45000, 18) // Negative price

            // Update price in StorkMock
            await call(storkMock.functions.update_negative_price(BTC_ASSET, btcPrice))

            // Get price through PricefeedWrapper - should return absolute value
            const result = (await pricefeedWrapper.functions.price(BTC_ASSET).get()).value

            expect(result.toString()).to.equal(btcPrice.toString())
        })

        it("should handle edge case price values (1)", async () => {
            // Test with maximum i128 value
            const maxPrice = "170141183460469231731687303715884105727"

            // Update price in StorkMock
            await call(storkMock.functions.update_price(BTC_ASSET, maxPrice))

            // Get price through PricefeedWrapper
            const result = (await pricefeedWrapper.functions.price(BTC_ASSET).get()).value

            expect(result.toString()).to.equal(maxPrice)
        })

        it("should handle edge case price values (2)", async () => {
            // Test with minimum i128 value
            const maxPrice = "170141183460469231731687303715884105728"

            // Update price in StorkMock
            await call(storkMock.functions.update_negative_price(BTC_ASSET, maxPrice))

            // Get price through PricefeedWrapper
            const result = (await pricefeedWrapper.functions.price(BTC_ASSET).get()).value

            expect(result.toString()).to.equal(maxPrice)
        })

        it("should work with different decimal precisions", async () => {
            const price6Decimals = toPrice(1, 6) // 1 with 6 decimals
            const price8Decimals = toPrice(1, 8) // 1 with 8 decimals
            const price18Decimals = toPrice(1, 18) // 1 with 18 decimals

            // Test 6 decimals
            await call(storkMock.functions.update_price(BTC_ASSET, price6Decimals))
            let result = (await pricefeedWrapper.functions.price(BTC_ASSET).get()).value
            expect(result.toString()).to.equal(price6Decimals.toString())

            // Test 8 decimals
            await call(storkMock.functions.update_price(BTC_ASSET, price8Decimals))
            result = (await pricefeedWrapper.functions.price(BTC_ASSET).get()).value
            expect(result.toString()).to.equal(price8Decimals.toString())

            // Test 18 decimals
            await call(storkMock.functions.update_price(BTC_ASSET, price18Decimals))
            result = (await pricefeedWrapper.functions.price(BTC_ASSET).get()).value
            expect(result.toString()).to.equal(price18Decimals.toString())
        })
    })

    describe("error handling", () => {
        it("should revert when trying to get price for non-existent feed", async () => {
            // this test depends on the mock
            const nonExistentFeed = "0x1234567890123456789012345678901234567890123456789012345678901234"

            // "" for panic error
            await expect(pricefeedWrapper.functions.price(nonExistentFeed).get()).rejects.toThrowError(
                "The transaction reverted with reason",
            )
        })

        it("should revert when price is too stale", async () => {
            // This test would require manipulating the timestamp to make it stale
            // For now, we'll set up a price and then simulate staleness by waiting
            // or manipulating the StorkMock to return an old timestamp
            const btcPrice = toPrice(45000, 18)

            // Update price in StorkMock
            await call(storkMock.functions.update_price(BTC_ASSET, btcPrice))

            const { provider: providerWithCustomTimestamp } = launchedNode

            const latestBlock = await providerWithCustomTimestamp.getBlock("latest")
            if (!latestBlock) {
                throw new Error("No latest block")
            }
            const latestBlockTimestamp = DateTime.fromTai64(latestBlock.time).toUnixMilliseconds()

            // Produce 3 new blocks, setting the timestamp to latest + 150 * 1000ms
            await providerWithCustomTimestamp.produceBlocks(3, latestBlockTimestamp + 150 * 1000)

            await expect(pricefeedWrapper.functions.price(BTC_ASSET).get()).rejects.toThrowError("PricefeedWrapperStaledPrice")
        })
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
