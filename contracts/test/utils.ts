import { getMintedAssetId, WalletUnlocked, DateTime, BN } from "fuels"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"

// export async function deploy(contract: string, wallet: WalletUnlocked, configurables: any = undefined) {
//     const factory = require(`../types/${contract}Factory.ts`)[`${contract}Factory`]
//     if (!factory) {
//         throw new Error(`Could not find factory for contract ${contract}`)
//     }

//     const txParams = {
//         gasLimit: 5000000,
//     };

//     const deployResult = await factory.deploy(wallet, configurables ? { configurableConstants: configurables } : undefined, txParams)
//     const { waitForResult } = deployResult
//     const deployedResult = await waitForResult()
//     const { contract: contr } = deployedResult

//     return contr
// }

export const BASE_ASSET = "0x7416a56f222e196d0487dce8a1a8003936862e7a15092a91898d69fa8bce290c"
export const USDC_ASSET = "0x7416a56f222e196d0487dce8a1a8003936862e7a15092a91898d69fa8bce290c"
export const BNB_ASSET = "0x1bc6d6279e196b1fa7b94a792d57a47433858940c1b3500f2a5e69640cd12ef4"
export const BTC_ASSET = "0x7404e3d104ea7841c3d9e6fd20adfe99b4ad586bc08d8f3bd3afef894cf184de"
export const ETH_ASSET = "0x59102b37de83bdda9f38ac8254e596f0d9ac61d2035c07936675e87342817160"

export const BTC_MAX_LEVERAGE = 50 * 10_000
export const ETH_MAX_LEVERAGE = 50 * 10_000
export const BNB_MAX_LEVERAGE = 50 * 10_000

export async function call(fnCall: any) {
    const { gasUsed } = await fnCall.getTransactionCost()
    // console.log("gasUsed", gasUsed.toString())
    const gasLimit = gasUsed.mul("6").div("5").toString()

    const { waitForResult } = await fnCall.txParams({ gasLimit }).call()
    return waitForResult()
}

export type AddressIdentity = { Address: { bits: string } }

// this form is good for vitest, because it allows to await the promise
export async function call2(fnCall: any) {
    return fnCall.getTransactionCost().then(({ gasUsed }: { gasUsed: BN }) => {
        const gasLimit = gasUsed.mul("6").div("5").toString()
        return fnCall
            .txParams({ gasLimit })
            .call()
            .then(({ waitForResult }: { waitForResult: any }) => {
                return waitForResult()
            })
    })
}

export function walletToAddressIdentity(wallet: WalletUnlocked): AddressIdentity {
    return { Address: { bits: wallet.address.toHexString() } }
}

export function expandDecimals(value: number, decimals: number = 9): string {
    const v = BigInt(value) * BigInt(10) ** BigInt(decimals)
    return v.toString()
}

export function getBtcConfig(): [string, number] {
    return [
        BTC_ASSET, // asset
        BTC_MAX_LEVERAGE, // max_leverage
    ]
}

export function getEthConfig(): [string, number] {
    return [
        ETH_ASSET, // asset
        ETH_MAX_LEVERAGE, // max_leverage
    ]
}

export function getBnbConfig(): [string, number] {
    return [
        BNB_ASSET, // asset
        BNB_MAX_LEVERAGE, // max_leverage
    ]
}

export function getAssetId(
    fungibleContract: any,
    sub_id: string = "0x0000000000000000000000000000000000000000000000000000000000000000",
): string {
    const id = typeof fungibleContract === "string" ? fungibleContract : fungibleContract.id.toHexString()
    return getMintedAssetId(id, sub_id)
}

export async function moveBlockchainTime(launchedNode: LaunchTestNodeReturn<DeployContractConfig[]>, seconds: number) {
    const { provider: providerWithCustomTimestamp } = launchedNode

    const latestBlock = await providerWithCustomTimestamp.getBlock("latest")
    if (!latestBlock) {
        throw new Error("No latest block")
    }
    const latestBlockTimestamp = DateTime.fromTai64(latestBlock.time).toUnixMilliseconds()

    // Produce 3 new blocks, setting the timestamp to latest + seconds * 1000ms
    await providerWithCustomTimestamp.produceBlocks(3, latestBlockTimestamp + seconds * 1000)
}

const FUNDING_RATE_FACTOR_BASE: bigint = BigInt("1000000000")
export const FUNDING_RATE_PRECISION: bigint = FUNDING_RATE_FACTOR_BASE * FUNDING_RATE_FACTOR_BASE
const FUNDING_RATE_INTERVAL: bigint = BigInt(1) // 1 second
const FUNDING_RATE_FACTOR: bigint = BigInt(23) // 23 / 1_000_000_000 gives 2 promiles a day
export const CUMULATIVE_FUNDING_RATE_NEUTRAL = "57896044618658097711785492504343953926634992332820282019728792003956564819968" // 2 ** 255

// typescript implementation of _calculate_cumulative_funding_rate
// returns deltas instead of aggregated values
// all returned values are in FUNDING_RATE_PRECISION precision
// totalFundingRateDelta is the total flow in timeDelta
// positive means that longs are in excess and pay shorts
// negative means that shorts are in excess and pay longs
// longCumulativeFundingRateDelta is the rate per 1 asset amount
// positive means that longs pay, negative means that longs receive
// shortCumulativeFundingRateDelta is the rate per 1 asset amount
// positive means that shorts pay, negative means that shorts receive
// the special case: if a side, longs or shorts, has no size, the rate of this side is 0
export function calculateTotalFundingRateDelta(totalLongSizes: bigint, totalShortSizes: bigint, timeDelta: bigint) {
    const intervals = timeDelta / FUNDING_RATE_INTERVAL
    const sizeDelta = totalLongSizes - totalShortSizes
    const totalFundingRateDelta =
        (intervals * sizeDelta * FUNDING_RATE_PRECISION * FUNDING_RATE_FACTOR) / FUNDING_RATE_FACTOR_BASE
    const longCumulativeFundingRateDelta = totalLongSizes === BigInt(0) ? BigInt(0) : totalFundingRateDelta / totalLongSizes
    const shortCumulativeFundingRateDelta = totalShortSizes === BigInt(0) ? BigInt(0) : -totalFundingRateDelta / totalShortSizes
    return {
        totalFundingRateDelta,
        longCumulativeFundingRateDelta,
        shortCumulativeFundingRateDelta,
    }
}
