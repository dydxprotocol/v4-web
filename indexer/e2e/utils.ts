import { DateTime, Provider, WalletUnlocked } from "fuels"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"

export const USDC_ASSET = "0x7416a56f222e196d0487dce8a1a8003936862e7a15092a91898d69fa8bce290c"
export const BNB_ASSET = "0x1bc6d6279e196b1fa7b94a792d57a47433858940c1b3500f2a5e69640cd12ef4"
export const BTC_ASSET = "0x7404e3d104ea7841c3d9e6fd20adfe99b4ad586bc08d8f3bd3afef894cf184de"
export const ETH_ASSET = "0x59102b37de83bdda9f38ac8254e596f0d9ac61d2035c07936675e87342817160"

export const BTC_MAX_LEVERAGE = 50 * 10_000
export const ETH_MAX_LEVERAGE = 50 * 10_000
export const BNB_MAX_LEVERAGE = 50 * 10_000

export const DEFAULT_SUB_ID = "0x0000000000000000000000000000000000000000000000000000000000000000"

export function getArgs(requiredArgs: string[]) {
    const argsObject = process.argv.reduce((args, arg) => {
        // long arg
        if (arg.slice(0, 2) === "--") {
            const longArg = arg.split("=")
            const longArgFlag = longArg[0].slice(2)
            const longArgValue = longArg.length > 1 ? longArg[1] : true
            args[longArgFlag] = longArgValue
        }
        // flags
        else if (arg[0] === "-") {
            const flags = arg.slice(1).split("")
            flags.forEach((flag) => {
                args[flag] = true
            })
        }
        return args
    }, {} as Record<string, string | boolean>)
    requiredArgs.forEach((arg) => {
        if (!argsObject[arg]) {
            throw new Error(`Required argument ${arg} not provided`)
        }
    })
    return argsObject
}

export async function call(fnCall: any) {
    const { gasUsed } = await fnCall.getTransactionCost()
    // console.log("gasUsed", gasUsed.toString())
    const gasLimit = gasUsed.mul("6").div("5").toString()

    const { waitForResult } = await fnCall.txParams({ gasLimit }).call()
    return waitForResult()
}

export function toPrice(value: number, decimals: number = 18): string {
    const v = BigInt(value) * BigInt(10) ** BigInt(decimals)
    return v.toString()
}

export async function moveBlockchainTime(providerWithCustomTimestamp: Provider, seconds: number, blocks: number = 3) {
    const latestBlock = await providerWithCustomTimestamp.getBlock("latest")
    if (!latestBlock) {
        throw new Error("No latest block")
    }
    const latestBlockTimestamp = DateTime.fromTai64(latestBlock.time).toUnixMilliseconds()

    // Produce 3 new blocks, setting the timestamp to latest + seconds * 1000ms
    await providerWithCustomTimestamp.produceBlocks(blocks, latestBlockTimestamp + seconds * 1000)
}

export type AddressIdentity = { Address: { bits: string } }

export function walletToAddressIdentity(wallet: WalletUnlocked): AddressIdentity {
    return { Address: { bits: wallet.address.toHexString() } }
}

export function expandDecimals(value: number, decimals: number = 6): string {
    const v = BigInt(value) * BigInt(10) ** BigInt(decimals)
    return v.toString()
}

export function getUsdcConfig(): [string, number] {
    return [
        USDC_ASSET,
        9, // asset_decimals
    ]
}

export function getBtcConfig(): [string, number] {
    return [
        BTC_ASSET,
        9, // asset_decimals
    ]
}

export function getEthConfig(): [string, number] {
    return [
        ETH_ASSET,
        9, // asset_decimals
    ]
}

export function getBnbConfig(): [string, number] {
    return [
        BNB_ASSET,
        9, // asset_decimals
    ]
}
