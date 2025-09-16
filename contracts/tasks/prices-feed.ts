import { task } from "hardhat/config";
import { Provider, Wallet } from "fuels"
import { BigNumberCoder, hexlify, sha256, Signer, StructCoder } from "fuels"
import { VaultPricefeed,  } from "../types/VaultPricefeed";
import { PriceMessage as PriceMessageType } from "../types";

task("prices-feed", "Fetch prices and feed to vault pricefeed")
  .addPositionalParam("url")
  .addPositionalParam("priceSignerPrivK")
  .addPositionalParam("vaultPricefeedAddress")
  .setAction(async (taskArgs) => {
    const provider = new Provider(taskArgs.url)
    const wallet = Wallet.fromPrivateKey(taskArgs.priceSignerPrivK, provider)
    const vaultPricefeed = new VaultPricefeed(taskArgs.vaultPricefeedAddress, wallet)

    const query = "https://hermes.pyth.network/v2/updates/price/latest?&ids[]=0x41283d3f78ccb459a24e5f1f1b9f5a72a415a26ff9ce0391a6878f4cda6b477b&ids[]=0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43&ids[]=0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f&ids[]=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
    const pricesResponse = await fetch(query).then(function(response) {
      return response.json()
    }).then(function(jsonResponse) {
      return jsonResponse
    });

    const structCoder = new StructCoder("PriceMessage", {
      asset: new StructCoder("Asset", {
        bits: new BigNumberCoder("u256"),
      }),
      price: new BigNumberCoder("u64"),
      timestamp: new BigNumberCoder("u64"),
    })

    for (const priceData of pricesResponse.parsed) {
      const pricefeedId = priceData.id
      console.log(`Pricefeed ID: ${pricefeedId}`)
      const price = priceData.price.price
      const exponent = priceData.price.expo
      const timestamp = priceData.price.publish_time
      let { value: assetId } = await vaultPricefeed.functions.get_asset('0x' + pricefeedId).get()
      let { value: decimals } = await vaultPricefeed.functions.get_decimals(assetId).get()
      const priceInput = Math.floor(price * 10 **(decimals + exponent))
      const priceMessage: PriceMessageType = {
        asset: assetId,
        price: priceInput,
        timestamp: timestamp
      }
      const encodedStruct: Uint8Array = structCoder.encode(priceMessage)
      const message = hexlify(sha256(encodedStruct))
      const signature = wallet.signer().sign(message)
      await call(vaultPricefeed.functions.update_price(priceMessage, signature))
      console.log(`Updated price for ${pricefeedId} at timestamp ${timestamp}`)
    }

    console.log(`Prices fetched`)
  }
);

async function call(fnCall: any) {
  const { gasUsed } = await fnCall.getTransactionCost()
  const gasLimit = gasUsed.mul("6").div("5").toString()

  const { waitForResult } = await fnCall.txParams({ gasLimit }).call()
  return await waitForResult()
}
