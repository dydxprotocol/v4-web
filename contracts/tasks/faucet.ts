import { task } from "hardhat/config";
import { Provider, Wallet } from "fuels"
import { TestnetToken } from "../types/TestnetToken"

const NETWORK = "https://testnet.fuel.network/v1/graphql" //testnet
// const NETWORK = "http://127.0.0.1:4000/v1/graphql"  // local
const PRIVATE_KEY = "" // testnet
// const PRIVATE_KEY = "0x72dd6103daeaed398609a2ec3905f07ae4b5188a698fd1472306488b9e48245d"  // local

task("faucet", "Call faucet")
  .addPositionalParam("token")
  .setAction(async (taskArgs) => {
    console.log(`Params: token: ${taskArgs.token}`);

    const provider = await Provider.create(NETWORK)
    const wallet = Wallet.fromPrivateKey(PRIVATE_KEY, provider)
    const token = new TestnetToken(taskArgs.token, wallet)

    let { value: assetId } = await token.functions.get_asset_id().get()
    console.log(`Asset ID: ${assetId.bits.toString()}`)
    let beforeBalance = await wallet.getBalance(assetId.bits.toString())
    console.log(`Before Balance: ${beforeBalance.toString()}`)
    await call(token.functions.faucet())
    let afterBalance = await wallet.getBalance(assetId.bits.toString())
    console.log(`After Balance: ${afterBalance.toString()}`)

    console.log(`Faucet called`)
  }
);

async function call(fnCall: any) {
  const { gasUsed } = await fnCall.getTransactionCost()
  const gasLimit = gasUsed.mul("6").div("5").toString()

  const { waitForResult } = await fnCall.txParams({ gasLimit }).call()
  return await waitForResult()
}
