import { Provider, Wallet } from "fuels"
import { TestnetToken } from "../types/TestnetToken"
import { call, getArgs } from "./utils"

if (require.main === module) {
    faucet(getArgs(["url", "privK", "token"]))
        .then(() => {
            process.exit(0)
        })
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

async function faucet(taskArgs: any) {
    console.log("Call faucet")

    const provider = new Provider(taskArgs.url)
    const wallet = Wallet.fromPrivateKey(taskArgs.privK, provider)
    const token = new TestnetToken(taskArgs.token, wallet)

    const { value: assetId } = await token.functions.get_asset_id().get()

    console.log(`Asset ID: ${assetId.bits.toString()}`)
    const beforeBalance = await wallet.getBalance(assetId.bits.toString())

    console.log(`Before Balance: ${beforeBalance.toString()}`)
    await call(token.functions.faucet())
    const afterBalance = await wallet.getBalance(assetId.bits.toString())

    console.log(`After Balance: ${afterBalance.toString()}`)

    console.log(`Faucet called`)
}
