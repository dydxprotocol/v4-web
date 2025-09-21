import { task } from "hardhat/config";
import { Provider, Wallet, WalletUnlocked } from "fuels"

task("deploy-starboard", "Deploy the starboard contracts")
  .addPositionalParam("url")
  .addPositionalParam("privK")
  .addPositionalParam("priceSigner")
  .addPositionalParam("usdcAssetId")
  .addPositionalParam("usdcDecimals")
  .setAction(async (taskArgs) => {
    const provider = new Provider(taskArgs.url)
    const deployer = Wallet.fromPrivateKey(taskArgs.privK, provider)

    const deployerIdendity = { Address: { bits: deployer.address.toHexString() } }
    const priceSignerAddress = { bits: taskArgs.priceSigner }
    const usdcAsset = { bits: taskArgs.usdcAssetId }
    const usdcConfig = [
      usdcAsset, // asset
      taskArgs.usdcDecimals, // asset_decimals
      10000, // asset_weight
      75, // min_profit_bps
      0, // max_rusd_amount
    ]

    const vault = await deploy("Vault", deployer, { COLLATERAL_ASSET: usdcAsset })
    console.log(`Vault deployed to: ${vault.id.toString()} ${vault.id.toB256().toString()}`)
    await call(vault.functions.initialize(deployerIdendity))
    console.log("Vault initialized")

    const vaultPricefeed = await deploy("VaultPricefeed", deployer)
    console.log(`VaultPricefeed deployed to: ${vaultPricefeed.id.toString()} ${vaultPricefeed.id.toB256().toString()}`)
    await call(vaultPricefeed.functions.initialize(deployerIdendity, priceSignerAddress))
    console.log("VaultPricefeed initialized")

    const usdcPricefeedId = "0x41283d3f78ccb459a24e5f1f1b9f5a72a415a26ff9ce0391a6878f4cda6b477b"
    await call(vaultPricefeed.functions.set_asset_config(usdcAsset, usdcPricefeedId, taskArgs.usdcDecimals))
    const vaultPricefeedContract = { bits: vaultPricefeed.id.toHexString() }
    await call(vault.functions.set_pricefeed_provider(vaultPricefeedContract))
    await call(vault.functions.set_liquidator(deployerIdendity, true))
    await call(
      vault.functions.set_funding_rate(
          8 * 3600, // funding_interval (8 hours)
          600, // fundingRateFactor
          600, // stableFundingRateFactor
      ),
    )
    await call(vault.functions.set_asset_config(...usdcConfig))
    console.log("Deployment done")

    return [vault.id.toString(), vaultPricefeed.id.toString()]
});

async function deploy(contract: string, wallet: WalletUnlocked, configurables: any = undefined) {
  const factory = require(`../types/${contract}Factory`)[`${contract}Factory`]
  if (!factory) {
      throw new Error(`Could not find factory for contract ${contract}`)
  }

  const { waitForResult } = await factory.deploy(wallet, configurables ? { configurableConstants: configurables } : undefined)
  const result = await waitForResult()
  const { contract: contr } = result

  return contr
}

async function call(fnCall: any) {
  const { gasUsed } = await fnCall.getTransactionCost()
  // console.log("gasUsed", gasUsed.toString())
  const gasLimit = gasUsed.mul("6").div("5").toString()

  const { waitForResult } = await fnCall.txParams({ gasLimit }).call()
  return await waitForResult()
}
