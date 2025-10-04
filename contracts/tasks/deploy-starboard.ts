import { task } from "hardhat/config";
import { Provider, Wallet, WalletUnlocked } from "fuels"

task("deploy-starboard", "Deploy the starboard contracts")
  .addPositionalParam("url")
  .addPositionalParam("privK")
  .addPositionalParam("usdcAssetId")
  .addPositionalParam("usdcPricefeedId")
  .addPositionalParam("usdcDecimals")
  .addPositionalParam("storkContract")
  .setAction(async (taskArgs) => {
    const provider = new Provider(taskArgs.url)
    const deployer = Wallet.fromPrivateKey(taskArgs.privK, provider)

    const deployerIdendity = { Address: { bits: deployer.address.toHexString() } }
    const storkContract = { bits: taskArgs.storkContract }
    const usdcConfig = [
      taskArgs.usdcPricefeedId, // asset
      taskArgs.usdcDecimals, // asset_decimals
    ]

    const pricefeedWrapper = await deploy("PricefeedWrapper", deployer, { STORK_CONTRACT: storkContract })
    console.log(`PricefeedWrapper deployed to: ${pricefeedWrapper.id.toString()} ${pricefeedWrapper.id.toB256().toString()}`)

    const vault = await deploy("Vault", deployer, {
      COLLATERAL_ASSET_ID: { bits: taskArgs.usdcAssetId },
      COLLATERAL_ASSET: taskArgs.usdcPricefeedId,
      COLLATERAL_ASSET_DECIMALS: taskArgs.usdcDecimals,
      PRICEFEED_WRAPPER: { bits: pricefeedWrapper.id.toString() },
    })
    console.log(`Vault deployed to: ${vault.id.toString()} ${vault.id.toB256().toString()}`)
    await call(vault.functions.initialize(deployerIdendity))
    console.log("Vault initialized")

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

    return [vault.id.toString(), pricefeedWrapper.id.toString()]
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
