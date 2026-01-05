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
