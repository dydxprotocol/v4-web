import { Provider, Wallet } from "fuels"
import { TestnetTokenFactory } from "../types/index.js"
import { call, getArgs, getRandomSalt } from "./utils.js"

if (import.meta.url === `file://${process.argv[1]}`) {
    deployTestnetToken(getArgs(["url", "privK", "name", "symbol", "decimals"], ["salt"]))
        .then(() => {
            process.exit(0)
        })
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

export async function deployTestnetToken(taskArgs: any) {
    const salt = taskArgs.salt || getRandomSalt()

    console.log("Deploy a token for the testnet")

    const provider = new Provider(taskArgs.url)
    const deployer = Wallet.fromPrivateKey(taskArgs.privK, provider)

    console.log(`Deploying token named ${taskArgs.name} ${taskArgs.symbol} decimals: ${taskArgs.decimals}`)

    const { waitForResult: waitForResultTestnetToken } = await TestnetTokenFactory.deploy(deployer, {
        configurableConstants: {
            NAME: taskArgs.name,
            SYMBOL: taskArgs.symbol,
            DECIMALS: taskArgs.decimals,
        },
        salt,
    })
    const { contract: tt } = await waitForResultTestnetToken()

    const ttAssetId = (await tt.functions.get_asset_id().get()).value

    console.log(`Token deployed to: contractId: ${tt.id.toString()} assetId: ${ttAssetId.bits}`)
    await call(tt.functions.initialize())

    console.log("Token initialized")

    return [tt.id.toString(), ttAssetId.bits]
}
