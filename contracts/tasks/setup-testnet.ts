import { task } from "hardhat/config";
import { Provider, Wallet, WalletUnlocked } from "fuels"
import { VaultPricefeed } from "../types/VaultPricefeed"
import { Vault as VaultContract } from "../types/Vault"

task("setup-testnet", "Setup asset configuration for the testnet")
  .addPositionalParam("url")
  .addPositionalParam("privK")
  .addPositionalParam("priceSignerAddress")
  .setAction(async (taskArgs, hre) => {
    const provider = new Provider(taskArgs.url)
    const deployer = Wallet.fromPrivateKey(taskArgs.privK, provider)

    const [USDCAddress, USDCAssetId] = await hre.run("deploy-testnet-token", {
      url: taskArgs.url, 
      privK: taskArgs.privK, 
      name: "mckUSDC", 
      symbol: "sUSDC", 
      decimals: "6"
    })

    const [vaultAddress, vaultPricefeedAddress] = await hre.run("deploy-starboard", {
      url: taskArgs.url, 
      privK: taskArgs.privK, 
      priceSigner: taskArgs.priceSignerAddress, 
      usdcAssetId: USDCAssetId, 
      usdcDecimals: "6"
    })
    const vaultPricefeed = new VaultPricefeed(vaultPricefeedAddress, deployer)
    const vault = new VaultContract(vaultAddress, deployer)

    const [BTCAddress, BTCAssetId] = await hre.run("deploy-testnet-token", {
      url: taskArgs.url, 
      privK: taskArgs.privK, 
      name: "mockBTC", 
      symbol: "sbBTC", 
      decimals: "9"
    })
    const [BNBAddress, BNBAssetId] = await hre.run("deploy-testnet-token", {
      url: taskArgs.url, 
      privK: taskArgs.privK, 
      name: "mockBNB", 
      symbol: "sbBNB", 
      decimals: "9"
    })
    const [ETHAddress, ETHAssetId] = await hre.run("deploy-testnet-token", {
      url: taskArgs.url, 
      privK: taskArgs.privK, 
      name: "mockETH", 
      symbol: "sbETH", 
      decimals: "9"
    })

    const btcPricefeedId = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"
    const bnbPricefeedId = "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f"
    const ethPricefeedId = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"

    const btcAsset = {bits: BTCAssetId}
    const bnbAsset = {bits: BNBAssetId}
    const ethAsset = {bits: ETHAssetId}

    await call(vaultPricefeed.functions.set_asset_config(btcAsset, btcPricefeedId, 9))
    await call(vaultPricefeed.functions.set_asset_config(bnbAsset, bnbPricefeedId, 9))
    await call(vaultPricefeed.functions.set_asset_config(ethAsset, ethPricefeedId, 9))

    const btcConfig = [
      btcAsset, // asset
      9, // asset_decimals,
      10000, // asset_weight
      75, // min_profit_bps
      0, // max_rusd_amount
    ]

    const bnbConfig = [
      bnbAsset, // asset
      9, // asset_decimals
      10000, // asset_weight
      75, // min_profit_bps
      0, // max_rusd_amount
    ]

    const ethConfig = [
      ethAsset, // asset
      9, // asset_decimals
      10000, // asset_weight
      75, // min_profit_bps
      0, // max_rusd_amount
    ]

    await call(vault.functions.set_asset_config(...btcConfig))
    await call(vault.functions.set_asset_config(...bnbConfig))
    await call(vault.functions.set_asset_config(...ethConfig))

    console.log("Setup complete")
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
