import { task } from "hardhat/config";
import { Provider, Wallet } from "fuels"
import { TestnetToken } from "../types/TestnetToken"

task("faucet", "Call faucet")
  .addPositionalParam("url")
  .addPositionalParam("privK")
  .addPositionalParam("token")
  .setAction(async (taskArgs) => {
    const provider = new Provider(taskArgs.url)
    const wallet = Wallet.fromPrivateKey(taskArgs.privK, provider)
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
