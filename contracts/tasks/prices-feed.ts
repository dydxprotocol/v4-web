import { Provider, Wallet } from "fuels"
import { StorkMock } from "../types/StorkMock"
import { call, getArgs } from "./utils"

if (require.main === module) {
    pricesFeed(getArgs(["url", "priceSignerPrivK", "mockPricefeedAddress"]))
        .then(() => {
            process.exit(0)
        })
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

// pyth pricefeed id -> stork asset
// USDC 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a
// BTC 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
// BNB 0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f
// ETH 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace
const assetMapping = {
    "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a":
        "0x7416a56f222e196d0487dce8a1a8003936862e7a15092a91898d69fa8bce290c",
    "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43":
        "0x7404e3d104ea7841c3d9e6fd20adfe99b4ad586bc08d8f3bd3afef894cf184de",
    "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f":
        "0x1bc6d6279e196b1fa7b94a792d57a47433858940c1b3500f2a5e69640cd12ef4",
    "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace":
        "0x59102b37de83bdda9f38ac8254e596f0d9ac61d2035c07936675e87342817160",
}

async function pricesFeed(taskArgs: any) {
    console.log("Fetch prices and feed to vault pricefeed")

    const provider = new Provider(taskArgs.url)
    const wallet = Wallet.fromPrivateKey(taskArgs.priceSignerPrivK, provider)
    const storkMock = new StorkMock(taskArgs.mockPricefeedAddress, wallet)

    const query =
        "https://hermes.pyth.network/v2/updates/price/latest?&ids[]=0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a&ids[]=0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43&ids[]=0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f&ids[]=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
    const pricesResponse = await fetch(query)
        .then((response) => response.json())
        .then((jsonResponse) => jsonResponse)

    for (const priceData of pricesResponse.parsed) {
        const pricefeedId = priceData.id
        const asset = assetMapping[`0x${pricefeedId}`]
        if (!asset) {
            throw new Error(`Asset not found for ${pricefeedId}`)
        }
        const price = priceData.price.price
        const exponent = priceData.price.expo
        const timestamp = priceData.price.publish_time
        const priceInput = BigInt(price) * BigInt(10) ** BigInt(18 + exponent)

        await call(storkMock.functions.update_price(asset, priceInput.toString()))

        console.log(`Updated price for ${pricefeedId} at timestamp ${timestamp}`)
    }

    console.log(`Prices fetched`)
}
