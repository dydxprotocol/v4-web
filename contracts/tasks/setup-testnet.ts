import { Provider, Wallet } from "fuels"
import { Vault as VaultContract } from "../types/Vault.js"
import {
    call,
    getArgs,
    USDC_ASSET,
    BTC_ASSET,
    BNB_ASSET,
    ETH_ASSET,
    BTC_MAX_LEVERAGE,
    ETH_MAX_LEVERAGE,
    BNB_MAX_LEVERAGE,
    getRandomSalt,
} from "./utils.js"
import { deployTestnetToken } from "./deploy-testnet-token.js"
import { deployStarboard } from "./deploy-starboard.js"

if (import.meta.url === `file://${process.argv[1]}`) {
    setupTestnet(getArgs(["url", "privK", "storkContractAddress"], ["salt"]))
        .then(() => {
            process.exit(0)
        })
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

export async function setupTestnet(taskArgs: Record<string, string | boolean>) {
    const salt = taskArgs.salt || getRandomSalt()
    // eslint-disable-next-line no-console
    console.log("Setup asset configuration for the testnet")

    const [, USDCAssetId] = await deployTestnetToken({
        // [USDCAddress, USDCAssetId]
        url: taskArgs.url as string,
        privK: taskArgs.privK as string,
        name: "mckUSDC",
        symbol: "sUSDC",
        decimals: "6",
        salt,
    })

    await deployTestnetToken({
        // [BTCAddress, BTCAssetId]
        url: taskArgs.url as string,
        privK: taskArgs.privK as string,
        name: "mockBTC",
        symbol: "sbBTC",
        decimals: "9",
        salt,
    })
    await deployTestnetToken({
        // [BNBAddress, BNBAssetId]
        url: taskArgs.url as string,
        privK: taskArgs.privK as string,
        name: "mockBNB",
        symbol: "sbBNB",
        decimals: "9",
        salt,
    })
    await deployTestnetToken({
        // [ETHAddress, ETHAssetId]
        url: taskArgs.url as string,
        privK: taskArgs.privK as string,
        name: "mockETH",
        symbol: "sbETH",
        decimals: "9",
        salt,
    })

    console.log("usdc setup, asset_id", USDCAssetId)
    const [vaultAddress, vaultImplAddress] = await deployStarboard({
        // [vaultAddress, vaultImplAddress, pricefeedWrapperAddress]
        url: taskArgs.url as string,
        privK: taskArgs.privK as string,
        usdcAssetId: USDCAssetId,
        usdcPricefeedId: USDC_ASSET,
        usdcDecimals: "6",
        storkContract: taskArgs.storkContractAddress,
        salt,
    })

    // it is important to instantiate the wallet after deployment
    const provider = new Provider(taskArgs.url as string)
    const deployer = Wallet.fromPrivateKey(taskArgs.privK as string, provider)
    const vault = new VaultContract(vaultAddress, deployer)

    await call(vault.functions.set_asset_config(BTC_ASSET, BTC_MAX_LEVERAGE).addContracts([vaultImplAddress]))
    await call(vault.functions.set_asset_config(BNB_ASSET, BNB_MAX_LEVERAGE).addContracts([vaultImplAddress]))
    await call(vault.functions.set_asset_config(ETH_ASSET, ETH_MAX_LEVERAGE).addContracts([vaultImplAddress]))

    console.log("Setup complete")
}
