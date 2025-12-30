import { Provider, Wallet } from "fuels"
import { call, getArgs } from "./utils"
import { PricefeedWrapperFactory, VaultFactory, SimpleProxyFactory, Vault } from "../types"

if (require.main === module) {
    deployStarboard(getArgs(["url", "privK", "usdcAssetId", "usdcPricefeedId", "usdcDecimals", "storkContract"]))
        .then(() => {
            process.exit(0)
        })
        .catch((error) => {
            // eslint-disable-next-line no-console
            console.error(error)
            process.exit(1)
        })
}

export async function deployStarboard(taskArgs: any) {
    const provider = new Provider(taskArgs.url)
    const deployer = Wallet.fromPrivateKey(taskArgs.privK, provider)

    const deployerIdentity = { Address: { bits: deployer.address.toHexString() } }
    const storkContract = { bits: taskArgs.storkContract }

    const { waitForResult: waitForResultPricefeedWrapper } = await PricefeedWrapperFactory.deploy(deployer, {
        configurableConstants: {
            STORK_CONTRACT: storkContract,
        },
        salt: "0x8000000000000000000000000000000000000000000000000000000000000000",
    })
    const { contract: pricefeedWrapper } = await waitForResultPricefeedWrapper()
    // eslint-disable-next-line no-console
    console.log(`PricefeedWrapper deployed to: ${pricefeedWrapper.id.toString()} ${pricefeedWrapper.id.toB256().toString()}`)

    const { waitForResult: waitForResultVaultImpl } = await VaultFactory.deploy(deployer, {
        configurableConstants: {
            COLLATERAL_ASSET_ID: { bits: taskArgs.usdcAssetId },
            COLLATERAL_ASSET: taskArgs.usdcPricefeedId,
            COLLATERAL_ASSET_DECIMALS: taskArgs.usdcDecimals,
            PRICEFEED_WRAPPER: { bits: pricefeedWrapper.id.toString() },
        },
        salt: "0x8000000000000000000000000000000000000000000000000000000000000001",
    })
    const { contract: vaultImpl } = await waitForResultVaultImpl()
    // eslint-disable-next-line no-console
    console.log(`Vault implementation deployed to: ${vaultImpl.id.toString()} ${vaultImpl.id.toB256().toString()}`)

    const { waitForResult: waitForResultSimpleProxy } = await SimpleProxyFactory.deploy(deployer, {
        configurableConstants: {
            DEPLOYER: { bits: deployer.address.toHexString() },
        },
        salt: "0x8000000000000000000000000000000000000000000000000000000000000002",
    })
    const { contract: simpleProxy } = await waitForResultSimpleProxy()
    // eslint-disable-next-line no-console
    console.log(`SimpleProxy deployed to: ${simpleProxy.id.toString()} ${simpleProxy.id.toB256().toString()}`)
    await call(
        simpleProxy.functions.initialize_proxy(deployerIdentity, {
            bits: vaultImpl.id.toHexString(),
        }),
    )
    // eslint-disable-next-line no-console
    console.log("SimpleProxy initialized")
    const vault = new Vault(simpleProxy.id.toAddress(), deployer)
    // eslint-disable-next-line no-console
    console.log(`Vault deployed to: ${vault.id.toString()} ${vault.id.toB256().toString()}`)
    await call(vault.functions.initialize(deployerIdentity).addContracts([vaultImpl]))
    // eslint-disable-next-line no-console
    console.log("Vault initialized")

    await call(vault.functions.set_liquidator(deployerIdentity, true).addContracts([vaultImpl]))
    await call(vault.functions.set_asset_config(taskArgs.usdcPricefeedId, taskArgs.usdcDecimals).addContracts([vaultImpl]))
    // eslint-disable-next-line no-console
    console.log("Deployment done")

    return [vault.id.toString(), vaultImpl.id.toString(), pricefeedWrapper.id.toString()]
}
