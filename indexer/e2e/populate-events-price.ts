import { Provider, Wallet } from "fuels"
import { StorkMock, Vault, TestnetToken } from "../../contracts/types"
import { call, getArgs, moveBlockchainTime, toPrice } from "./utils"
import { BTC_ASSET, USDC_ASSET, ETH_ASSET } from "./utils"

// priv keys are hardcoded, taken form the fuel node starting script
const deployerPK = "0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a" //0x0a0da2e1d4d201cc73cd500dfd64a732f1b94e5fb2d86657ab43ff620acaefd6
const user0PK = "0x366079294383ed426ef94b9e86a8e448876a92c1ead9bbf75e6e205a6f4f570d" //0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770"
const user1PK = "0xb978aa71a1487dc9c1f996493af73f0427cf78f560b606224e7f0089bae04c41" //0x7ab1e9d9fd10909aead61cbfd4a5ec2d80bb304f34cfa2b5a9446398e284e92c"
const user2PK = "0xb19556cb693d7850d0e75d05a6e2e4c9ed5691d9e5bc54a7d43ee6eed3ad5fe3" //0x6fe2a2b3a6f712b211c7317cf0fd12805d10f4f5473cfb461b1e2ba7acaf790b"
const liquidatorPK = "0xa5675fc7eb0657940fc73f6ec6c5265c045065ddac62e12e1174da030f3868b3" //0xad000576cc6dc12183a0306d8809c24f897fbbccfd3f179c571db6659218c088"

// graphql url is hardcoded, taken form the fuel node starting script
const graphQLUrl = "http://127.0.0.1:4000/v1/graphql"


if (require.main === module) {
    pupulateEvents(getArgs(["mockPricefeedAddress", "vaultAddress", "usdcAddress"]))
}


async function pupulateEvents(taskArgs: any) {
    const provider = new Provider(graphQLUrl)

    // preparation, usually the same for all the populate scripts
    const deployerWallet = Wallet.fromPrivateKey(deployerPK, provider)
    const user0Wallet = Wallet.fromPrivateKey(user0PK, provider)
    const user1Wallet = Wallet.fromPrivateKey(user1PK, provider)
    const user2Wallet = Wallet.fromPrivateKey(user2PK, provider)
    const liquidatorWallet = Wallet.fromPrivateKey(liquidatorPK, provider)

    const storkMockDeployer = new StorkMock(taskArgs.mockPricefeedAddress, deployerWallet)
    const vaultDeployer = new Vault(taskArgs.vaultAddress, deployerWallet)
    const vaultUser0 = new Vault(taskArgs.vaultAddress, user0Wallet)
    const vaultUser1 = new Vault(taskArgs.vaultAddress, user1Wallet)
    const vaultUser2 = new Vault(taskArgs.vaultAddress, user2Wallet)
    const vaultLiquidator = new Vault(taskArgs.vaultAddress, liquidatorWallet)
    const usdcUser0 = new TestnetToken(taskArgs.usdcAddress, user0Wallet)
    const usdcUser1 = new TestnetToken(taskArgs.usdcAddress, user1Wallet)
    const usdcUser2 = new TestnetToken(taskArgs.usdcAddress, user2Wallet)
    const usdcLiquidator = new TestnetToken(taskArgs.usdcAddress, liquidatorWallet)

    // custom code, populate the events
    await call(storkMockDeployer.functions.update_price(USDC_ASSET, toPrice(1)))
    await call(storkMockDeployer.functions.update_price(ETH_ASSET, toPrice(3000)))

    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45100)))
    await moveBlockchainTime(provider, 2, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44800)))
    await moveBlockchainTime(provider, 12, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44850)))
    await moveBlockchainTime(provider, 5, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44800)))
    await moveBlockchainTime(provider, 3, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44700)))
    await moveBlockchainTime(provider, 10, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44750)))
    await moveBlockchainTime(provider, 7, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44800)))
    await moveBlockchainTime(provider, 19, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44850)))
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44900)))
    await moveBlockchainTime(provider, 9, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45000)))
    await moveBlockchainTime(provider, 21, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45050)))
    await moveBlockchainTime(provider, 6, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45150)))
    await moveBlockchainTime(provider, 13, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45100)))
    await moveBlockchainTime(provider, 8, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45300)))
    await moveBlockchainTime(provider, 25, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45250)))
    await moveBlockchainTime(provider, 12, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45200)))
    await moveBlockchainTime(provider, 3, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45550)))
    await moveBlockchainTime(provider, 16, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45300)))
    await moveBlockchainTime(provider, 11, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45250)))
    await moveBlockchainTime(provider, 23, 1)
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45350)))

    await call(storkMockDeployer.functions.update_price(USDC_ASSET, toPrice(1)))
    await call(storkMockDeployer.functions.update_price(ETH_ASSET, toPrice(3000)))
}
