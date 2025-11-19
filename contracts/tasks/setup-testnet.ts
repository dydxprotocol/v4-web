import { Provider, Wallet } from "fuels"
import { Vault as VaultContract } from "../types/Vault"
import { call, getArgs } from "./utils"
import { deployTestnetToken } from "./deploy-testnet-token"
import { deployStarboard } from "./deploy-starboard"

if (require.main === module) {
    setupTestnet(getArgs(["url", "privK", "storkContractAddress"]))
        .then(() => {
            process.exit(0)
        })
        .catch((error) => {
            // eslint-disable-next-line no-console
            console.error(error)
            process.exit(1)
        })
}

async function setupTestnet(taskArgs: any) {
    // eslint-disable-next-line no-console
    console.log("Setup asset configuration for the testnet")

    const usdcPricefeedId = "0x0000000000000000000000000000000000000000000000000000000000000069"
    const btcPricefeedId = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"
    const bnbPricefeedId = "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f"
    const ethPricefeedId = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"

    const [, USDCAssetId] = await deployTestnetToken({
        // [USDCAddress, USDCAssetId]
        url: taskArgs.url,
        privK: taskArgs.privK,
        name: "mckUSDC",
        symbol: "sUSDC",
        decimals: "6",
    })

    await deployTestnetToken({
        // [BTCAddress, BTCAssetId]
        url: taskArgs.url,
        privK: taskArgs.privK,
        name: "mockBTC",
        symbol: "sbBTC",
        decimals: "9",
    })
    await deployTestnetToken({
        // [BNBAddress, BNBAssetId]
        url: taskArgs.url,
        privK: taskArgs.privK,
        name: "mockBNB",
        symbol: "sbBNB",
        decimals: "9",
    })
    await deployTestnetToken({
        // [ETHAddress, ETHAssetId]
        url: taskArgs.url,
        privK: taskArgs.privK,
        name: "mockETH",
        symbol: "sbETH",
        decimals: "9",
    })

    // eslint-disable-next-line no-console
    console.log("usdc setup", USDCAssetId)
    const [vaultAddress] = await deployStarboard({
        // [vaultAddress, pricefeedWrapperAddress]
        url: taskArgs.url,
        privK: taskArgs.privK,
        usdcAssetId: USDCAssetId,
        usdcPricefeedId,
        usdcDecimals: "6",
        storkContract: taskArgs.storkContractAddress,
    })

    // it is important to instantiate the wallet after deployment
    const provider = new Provider(taskArgs.url)
    const deployer = Wallet.fromPrivateKey(taskArgs.privK, provider)
    const vault = new VaultContract(vaultAddress, deployer)

    await call(vault.functions.set_asset_config(btcPricefeedId, 9))
    await call(vault.functions.set_asset_config(bnbPricefeedId, 9))
    await call(vault.functions.set_asset_config(ethPricefeedId, 9))

    // eslint-disable-next-line no-console
    console.log("Setup complete")
}
