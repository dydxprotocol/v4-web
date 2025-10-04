import { task } from "hardhat/config";
import { Provider, Wallet, WalletUnlocked } from "fuels"
import { Vault as VaultContract } from "../types/Vault"

task("setup-testnet", "Setup asset configuration for the testnet")
  .addPositionalParam("url")
  .addPositionalParam("privK")
  .addPositionalParam("storkContractAddress")
  .setAction(async (taskArgs, hre) => {

    const usdcPricefeedId = "0x0000000000000000000000000000000000000000000000000000000000000069"
    const btcPricefeedId = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"
    const bnbPricefeedId = "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f"
    const ethPricefeedId = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"

    const provider = new Provider(taskArgs.url)
    const deployer = Wallet.fromPrivateKey(taskArgs.privK, provider)

    const [USDCAddress, USDCAssetId] = await hre.run("deploy-testnet-token", {
      url: taskArgs.url, 
      privK: taskArgs.privK, 
      name: "mckUSDC", 
      symbol: "sUSDC", 
      decimals: "6"
    })

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

    const [vaultAddress, pricefeedWrapperAddress] = await hre.run("deploy-starboard", {
      url: taskArgs.url, 
      privK: taskArgs.privK,
      usdcAssetId: USDCAssetId,
      usdcPricefeedId: usdcPricefeedId,
      usdcDecimals: "6",
      storkContract: taskArgs.storkContractAddress,
    })
    const vault = new VaultContract(vaultAddress, deployer)

    await call(vault.functions.set_asset_config(btcPricefeedId, 9))
    await call(vault.functions.set_asset_config(bnbPricefeedId, 9))
    await call(vault.functions.set_asset_config(ethPricefeedId, 9))

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
