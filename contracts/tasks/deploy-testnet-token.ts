import { Provider, Wallet } from "fuels"
import { getArgs, call } from "./utils"
import { TestnetTokenFactory } from "../types"

if (require.main === module) {
  deployTestnetToken(getArgs(["url", "privK", "name", "symbol", "decimals"]))
}

export async function deployTestnetToken(taskArgs: any) {
    console.log("Deploy a token for the testnet")
    
    const provider = new Provider(taskArgs.url)
    const deployer = Wallet.fromPrivateKey(taskArgs.privK, provider)

    console.log(`Deploying token named ${taskArgs.name} ${taskArgs.symbol} decimals: ${taskArgs.decimals}`)

    const { waitForResult: waitForResultTestnetToken } = await TestnetTokenFactory.deploy(deployer, { configurableConstants: { 
        NAME: taskArgs.name,
        SYMBOL: taskArgs.symbol,
        DECIMALS: taskArgs.decimals,
    }})
    const { contract: tt } = await waitForResultTestnetToken()

    const ttAssetId = (await tt.functions.get_asset_id().get()).value
    console.log(`Token deployed to: contractId: ${tt.id.toString()} assetId: ${ttAssetId.bits}`)
    await call(tt.functions.initialize())
    console.log("Token initialized")

    return [tt.id.toString(), ttAssetId.bits]
}
