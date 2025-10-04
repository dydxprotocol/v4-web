import { task } from "hardhat/config";
import { Provider, Wallet, WalletUnlocked } from "fuels"

task("deploy-stork-mock", "Deploy a stork mock")
  .addPositionalParam("url")
  .addPositionalParam("privK")
  .setAction(async (taskArgs) => {
    const provider = new Provider(taskArgs.url)
    const deployer = Wallet.fromPrivateKey(taskArgs.privK, provider)

    console.log(`Deploying mocked stork contract`)
    let mockStorkContract = await deploy("StorkMock", deployer)
    console.log(`Mocked Stork deployed to: contractId: ${mockStorkContract.id.toString()}`)

    return [mockStorkContract.id.toString()]
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
