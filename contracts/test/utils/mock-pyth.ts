import { BigNumberCoder, hexlify, sha256, Signer, StructCoder } from "fuels"
import { AssetId } from "./types"
import { VaultPricefeed, PriceMessage as PriceMessageType } from "../../types"

export const USDC_PRICEFEED_ID = "0x0000000000000000000000000000000000000000000000000000000000000069"
export const DAI_PRICEFEED_ID = "0x000000000000000000000000000000000000000000000000000000000000006a"
export const BTC_PRICEFEED_ID = "0x000000000000000000000000000000000000000000000000000000000000006b"
export const ETH_PRICEFEED_ID = "0x000000000000000000000000000000000000000000000000000000000000006c"
export const BNB_PRICEFEED_ID = "0x000000000000000000000000000000000000000000000000000000000000006d"

const structCoder = new StructCoder("PriceMessage", {
    asset: new StructCoder("Asset", {
        bits: new BigNumberCoder("u256"),
    }),
    price: new BigNumberCoder("u64"),
    timestamp: new BigNumberCoder("u64"),
})

export function getUpdatePriceDataCall(asset: AssetId, price: string, vaultPricefeed: VaultPricefeed, signer: Signer) {
    const priceMessage: PriceMessageType = {
        asset,
        price: parseInt(price),
        timestamp: Math.floor(Date.now()/1000),
    }
    const encodedStruct: Uint8Array = structCoder.encode(priceMessage)
    const message = hexlify(sha256(encodedStruct))
    const signature = signer.sign(message)

    return vaultPricefeed.functions.update_price(priceMessage, signature)
}
