import { Provider, Wallet } from "fuels"
import { call, getArgs } from "./utils";
import { PricefeedWrapperFactory, VaultFactory } from "../types";

if (require.main === module) {
  deployStarboard(getArgs(["url", "privK", "usdcAssetId", "usdcPricefeedId", "usdcDecimals", "storkContract"]))
}

export async function deployStarboard(taskArgs: any) {
    const provider = new Provider(taskArgs.url)
    const deployer = Wallet.fromPrivateKey(taskArgs.privK, provider)

    const deployerIdendity = { Address: { bits: deployer.address.toHexString() } }
    const storkContract = { bits: taskArgs.storkContract }
    const usdcConfig = [
      taskArgs.usdcPricefeedId, // asset
      taskArgs.usdcDecimals, // asset_decimals
    ]

    const { waitForResult: waitForResultPricefeedWrapper } = await PricefeedWrapperFactory.deploy(deployer, { configurableConstants: { 
        STORK_CONTRACT: storkContract,
    }})
    const { contract: pricefeedWrapper } = await waitForResultPricefeedWrapper()
    console.log(`PricefeedWrapper deployed to: ${pricefeedWrapper.id.toString()} ${pricefeedWrapper.id.toB256().toString()}`)

    const { waitForResult: waitForResultVault } = await VaultFactory.deploy(deployer, { configurableConstants: { 
        COLLATERAL_ASSET_ID: { bits: taskArgs.usdcAssetId },
        COLLATERAL_ASSET: taskArgs.usdcPricefeedId,
        COLLATERAL_ASSET_DECIMALS: taskArgs.usdcDecimals,
        PRICEFEED_WRAPPER: { bits: pricefeedWrapper.id.toString() },
      }})
    const { contract: vault } = await waitForResultVault()
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
    await call(vault.functions.set_asset_config(taskArgs.usdcPricefeedId, taskArgs.usdcDecimals))
    console.log("Deployment done")

    return [vault.id.toString(), pricefeedWrapper.id.toString()]
}
