import { task } from "hardhat/config";
import { Provider, Wallet, WalletUnlocked } from "fuels"

task("deploy-testnet-token", "Deploy a token for the testnet")
  .addPositionalParam("url")
  .addPositionalParam("privK")
  .addPositionalParam("name")
  .addPositionalParam("symbol")
  .addPositionalParam("decimals")
  .setAction(async (taskArgs) => {
    const provider = new Provider(taskArgs.url)
    const deployer = Wallet.fromPrivateKey(taskArgs.privK, provider)

    console.log(`Deploying token named ${taskArgs.name} ${taskArgs.symbol} decimals: ${taskArgs.decimals}`)
    let tt = await deploy("TestnetToken", deployer, { NAME: taskArgs.name, SYMBOL: taskArgs.symbol, DECIMALS: taskArgs.decimals })
    const ttAssetId = (await tt.functions.get_asset_id().get()).value
    console.log(`Token deployed to: contractId: ${tt.id.toString()} assetId: ${ttAssetId.bits}`)
    await call(tt.functions.initialize())
    console.log("Token initialized")

    return [tt.id.toString(), ttAssetId.bits]
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
