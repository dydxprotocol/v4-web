import { task } from "hardhat/config";
import { Provider, Wallet, WalletUnlocked } from "fuels"
import { TestnetTokenFactory } from "../types/TestnetTokenFactory"

const NETWORK = "https://testnet.fuel.network/v1/graphql" //testnet
// const NETWORK = "http://127.0.0.1:4000/v1/graphql"  // local
const PRIVATE_KEY = "" // testnet
// const PRIVATE_KEY = "0x72dd6103daeaed398609a2ec3905f07ae4b5188a698fd1472306488b9e48245d"  // local

task("deploy-testnet-token", "Deploy a token for the testnet")
  .addPositionalParam("name")
  .addPositionalParam("symbol")
  .setAction(async (taskArgs) => {
    console.log(`Params: name: ${taskArgs.name} symbol: ${taskArgs.symbol}`);

    const provider = await Provider.create(NETWORK)
    const deployer = Wallet.fromPrivateKey(PRIVATE_KEY, provider)

    let tt = await deploy("TestnetToken", deployer, { NAME: taskArgs.name, SYMBOL: taskArgs.symbol })
    console.log(`Token deployed to: ${tt.id.toString()} ${tt.id.toB256().toString()}`)
    await call(tt.functions.initialize())
    console.log("Token initialized")
}
);

async function deploy(contract: string, wallet: WalletUnlocked, configurables: any = undefined) {
  const factory = require(`../types/${contract}Factory.ts`)[`${contract}Factory`]
  if (!factory) {
      throw new Error(`Could not find factory for contract ${contract}`)
  }

  const { waitForResult } = await factory.deploy(wallet, configurables ? { configurableConstants: configurables } : undefined)
  const { contract: contr } = await waitForResult()

  return contr
}

async function call(fnCall: any) {
  const { gasUsed } = await fnCall.getTransactionCost()
  // console.log("gasUsed", gasUsed.toString())
  const gasLimit = gasUsed.mul("6").div("5").toString()

  const { waitForResult } = await fnCall.txParams({ gasLimit }).call()
  return await waitForResult()
}
