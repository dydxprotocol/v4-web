import { BigNumber } from "ethers"
import { Fungible, Vault } from "../../types"
import { toContract } from "./account"
import { toAsset } from "./asset"
import { Provider } from "fuels"

export async function validateVaultBalance(expect: any, vault: Vault, token: Fungible, offset: number | string = 0) {
    // const provider = await Provider.create("http://127.0.0.1:4000/v1/graphql")

    const poolAmount = (await vault.functions.get_pool_amounts(toAsset(token)).get()).value
    const feeReserve = (await vault.functions.get_fee_reserve().get()).value
    // const balance = (await provider.getContractBalance(toContract(vault).bits, toAsset(token).bits)).toString()
    const balance = (await vault.getBalance(toAsset(token).bits)).toString()
    // let amount = poolAmount.add(feeReserve)
    // console.log("Balance:", balance)
    expect(BigNumber.from(balance).gt(0)).to.be.true
    expect(poolAmount.add(feeReserve).add(offset).toString()).eq(balance)
}

export const USDC_MAX_LEVERAGE = 0 // 50 * 10_000
export const DAI_MAX_LEVERAGE = 0 // 50 * 10_000
export const BTC_MAX_LEVERAGE = 50 * 10_000
export const ETH_MAX_LEVERAGE = 50 * 10_000
export const BNB_MAX_LEVERAGE = 50 * 10_000

export function getUsdcConfig(): [string, number, number, number] {
    return [
        "0x7416a56f222e196d0487dce8a1a8003936862e7a15092a91898d69fa8bce290c", // asset
        9, // asset_decimals
        10000, // asset_weight
        75, // min_profit_bps
    ]
}

// https://cumsum.wordpress.com/2021/08/28/typescript-a-spread-argument-must-either-have-a-tuple-type-or-be-passed-to-a-rest-parameter/
export function getDaiConfig(): [string, number, number, number] {
    return [
        "0xf31e0ed7d2f9d8fe977679f2b18841571a064b9b072cf7daa755a526fe9579ec", // asset
        9, // asset_decimals
        10000, // asset_weight
        75, // min_profit_bps
    ]
}

export function getBtcConfig(): [string, number, number, number] {
    return [
        "0x7404e3d104ea7841c3d9e6fd20adfe99b4ad586bc08d8f3bd3afef894cf184de", // asset
        9, // asset_decimals
        10000, // asset_weight
        75, // min_profit_bps
    ]
}

export function getEthConfig(): [string, number, number, number] {
    return [
        "0x59102b37de83bdda9f38ac8254e596f0d9ac61d2035c07936675e87342817160", // asset
        9, // asset_decimals
        10000, // asset_weight
        75, // min_profit_bps
    ]
}

export function getBnbConfig(): [string, number, number, number] {
    return [
        "0x1bc6d6279e196b1fa7b94a792d57a47433858940c1b3500f2a5e69640cd12ef4", // asset
        9, // asset_decimals
        10000, // asset_weight
        75, // min_profit_bps
    ]
}
