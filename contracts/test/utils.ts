import { getMintedAssetId, WalletUnlocked, DateTime } from "fuels"
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

export const COLLATERAL_ASSET = "0x7416a56f222e196d0487dce8a1a8003936862e7a15092a91898d69fa8bce290c"
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
    return await waitForResult()
}

export type AddressIdentity = {
    Address: { bits: string }
}

export function walletToAddressIdentity(wallet: WalletUnlocked): AddressIdentity {
    return { Address: { bits: wallet.address.toHexString() } }
}

export function expandDecimals(value: number, decimals: number = 9): string {
    const v = BigInt(value) * (BigInt(10) ** BigInt(decimals))
    return v.toString()
}

export function getUsdcConfig(): [string, number] {
    return [
        "0x7416a56f222e196d0487dce8a1a8003936862e7a15092a91898d69fa8bce290c", // asset
        9, // asset_decimals
    ]
}

// https://cumsum.wordpress.com/2021/08/28/typescript-a-spread-argument-must-either-have-a-tuple-type-or-be-passed-to-a-rest-parameter/
export function getDaiConfig(): [string, number] {
    return [
        "0xf31e0ed7d2f9d8fe977679f2b18841571a064b9b072cf7daa755a526fe9579ec", // asset
        9, // asset_decimals
    ]
}

export function getBtcConfig(): [string, number] {
    return [
        "0x7404e3d104ea7841c3d9e6fd20adfe99b4ad586bc08d8f3bd3afef894cf184de", // asset
        9, // asset_decimals
    ]
}

export function getEthConfig(): [string, number] {
    return [
        "0x59102b37de83bdda9f38ac8254e596f0d9ac61d2035c07936675e87342817160", // asset
        9, // asset_decimals
    ]
}

export function getBnbConfig(): [string, number] {
    return [
        "0x1bc6d6279e196b1fa7b94a792d57a47433858940c1b3500f2a5e69640cd12ef4", // asset
        9, // asset_decimals
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
    const { provider: providerWithCustomTimestamp } = launchedNode;

    const latestBlock = await providerWithCustomTimestamp.getBlock('latest');
    if (!latestBlock) {
      throw new Error('No latest block');
    }
    const latestBlockTimestamp = DateTime.fromTai64(
      latestBlock.time
    ).toUnixMilliseconds();
    
    // Produce 3 new blocks, setting the timestamp to latest + seconds * 1000ms
    const newBlockHeight = await providerWithCustomTimestamp.produceBlocks(
      3,
      latestBlockTimestamp + seconds * 1000
    );      

}