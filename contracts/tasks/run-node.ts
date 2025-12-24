// @ts-nocheck
// there is a problem with the optional arguments in the launchTestNode function
import { WalletUnlocked } from "fuels"
import { DeployContractConfig, launchTestNode, LaunchTestNodeOptions, LaunchTestNodeReturn } from "fuels/test-utils"
import readline from "readline"

// URL: http://127.0.0.1:4000/v1/graphql
// prefunded wallets (privK, address)
// Deployer: 0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a 0x0a0da2e1d4d201cc73cd500dfd64a732f1b94e5fb2d86657ab43ff620acaefd6
// User0: 0x366079294383ed426ef94b9e86a8e448876a92c1ead9bbf75e6e205a6f4f570d 0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770
// User1: 0xb978aa71a1487dc9c1f996493af73f0427cf78f560b606224e7f0089bae04c41 0x7ab1e9d9fd10909aead61cbfd4a5ec2d80bb304f34cfa2b5a9446398e284e92c
// Liquidator: 0xa5675fc7eb0657940fc73f6ec6c5265c045065ddac62e12e1174da030f3868b3 0xad000576cc6dc12183a0306d8809c24f897fbbccfd3f179c571db6659218c088
// PriceSigner: 0xb19556cb693d7850d0e75d05a6e2e4c9ed5691d9e5bc54a7d43ee6eed3ad5fe3 0x6fe2a2b3a6f712b211c7317cf0fd12805d10f4f5473cfb461b1e2ba7acaf790b

if (require.main === module) {
    runNode()
}

async function runNode() {
     
    console.log(`Running node`)

    const launchedNode = await launchNode()
    // const[ deployer, user0, user1, liquidator, priceSigner ] = getNodeWallets(launchedNode)
    const originWallet = getNodeWallet(launchedNode)

    const baseAssetId = await launchedNode.provider.getBaseAssetId()
    const originBalance = await originWallet.getBalance(baseAssetId)
    let response = await originWallet.transfer(
        "0x0a0da2e1d4d201cc73cd500dfd64a732f1b94e5fb2d86657ab43ff620acaefd6",
        originBalance.div(10),
        baseAssetId,
    )
    await response.waitForResult()
    response = await originWallet.transfer(
        "0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770",
        originBalance.div(10),
        baseAssetId,
    )
    await response.waitForResult()
    response = await originWallet.transfer(
        "0x7ab1e9d9fd10909aead61cbfd4a5ec2d80bb304f34cfa2b5a9446398e284e92c",
        originBalance.div(10),
        baseAssetId,
    )
    await response.waitForResult()
    response = await originWallet.transfer(
        "0xad000576cc6dc12183a0306d8809c24f897fbbccfd3f179c571db6659218c088",
        originBalance.div(10),
        baseAssetId,
    )
    await response.waitForResult()
    response = await originWallet.transfer(
        "0x6fe2a2b3a6f712b211c7317cf0fd12805d10f4f5473cfb461b1e2ba7acaf790b",
        originBalance.div(10),
        baseAssetId,
    )
    await response.waitForResult()
     
    console.log("Node is up")

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })
    await new Promise((resolve) => {
        rl.question("Press Enter to stop node", (ans) => {
            rl.close()
            resolve(ans)
        })
    })
    launchedNode.cleanup()
}

async function launchNode(): Promise<LaunchTestNodeReturn<DeployContractConfig[]>> {
    // is there a way to pass private keys?
    const launchOptions: Partial<LaunchTestNodeOptions<DeployContractConfig[]>> = {
        walletsConfig: {
            count: 1, // Number of wallets you want
        },
        nodeOptions: {
            port: "4000",
        },
    }
    const launched: LaunchTestNodeReturn<DeployContractConfig[]> = await launchTestNode(launchOptions)

    return launched
}

function getNodeWallet(launchedNode: LaunchTestNodeReturn<DeployContractConfig[]>): WalletUnlocked {
    const {
        wallets: [originWallet],
    } = launchedNode

    return originWallet
}
