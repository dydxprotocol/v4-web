import { Provider, Wallet, createAssetId } from "fuels"
import { StorkMock, Vault, TestnetToken } from "../../contracts/types"
import { call, getArgs, moveBlockchainTime, toPrice, walletToAddressIdentity, expandDecimals, DEFAULT_SUB_ID, USDC_ASSET, ETH_ASSET, BTC_ASSET } from "./utils"

// priv keys are hardcoded, taken form the fuel node starting script
const deployerPK = "0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a" //0x0a0da2e1d4d201cc73cd500dfd64a732f1b94e5fb2d86657ab43ff620acaefd6
const user0PK = "0x366079294383ed426ef94b9e86a8e448876a92c1ead9bbf75e6e205a6f4f570d" //0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770"
const user1PK = "0xb978aa71a1487dc9c1f996493af73f0427cf78f560b606224e7f0089bae04c41" //0x7ab1e9d9fd10909aead61cbfd4a5ec2d80bb304f34cfa2b5a9446398e284e92c"
const user2PK = "0xb19556cb693d7850d0e75d05a6e2e4c9ed5691d9e5bc54a7d43ee6eed3ad5fe3" //0x6fe2a2b3a6f712b211c7317cf0fd12805d10f4f5473cfb461b1e2ba7acaf790b"

// graphql url is hardcoded, taken form the fuel node starting script
const graphQLUrl = "http://127.0.0.1:4000/v1/graphql"


if (require.main === module) {
    populateEvents(getArgs(["mockPricefeedAddress", "vaultAddress", "usdcAddress"]))
}


async function populateEvents(taskArgs: any) {
    const provider = new Provider(graphQLUrl)

    // preparation, usually the same for all the populate scripts
    const deployerWallet = Wallet.fromPrivateKey(deployerPK, provider)
    const user0Wallet = Wallet.fromPrivateKey(user0PK, provider)
    const user1Wallet = Wallet.fromPrivateKey(user1PK, provider)
    const user2Wallet = Wallet.fromPrivateKey(user2PK, provider)

    const user0Identity = walletToAddressIdentity(user0Wallet)
    const user1Identity = walletToAddressIdentity(user1Wallet)
    const user2Identity = walletToAddressIdentity(user2Wallet)

    const storkMockDeployer = new StorkMock(taskArgs.mockPricefeedAddress, deployerWallet)
    const vaultDeployer = new Vault(taskArgs.vaultAddress, deployerWallet)
    const vaultUser0 = new Vault(taskArgs.vaultAddress, user0Wallet)
    const vaultUser1 = new Vault(taskArgs.vaultAddress, user1Wallet)
    const vaultUser2 = new Vault(taskArgs.vaultAddress, user2Wallet)
    const usdcUser0 = new TestnetToken(taskArgs.usdcAddress, user0Wallet)
    const usdcUser1 = new TestnetToken(taskArgs.usdcAddress, user1Wallet)
    const usdcUser2 = new TestnetToken(taskArgs.usdcAddress, user2Wallet)

    const attachedContracts = [taskArgs.vaultAddress, taskArgs.mockPricefeedAddress]
    const USDC_ASSET_ID = createAssetId(taskArgs.usdcAddress, DEFAULT_SUB_ID).bits

    // Get LP asset ID from vault
    const lpAssetResult = await vaultDeployer.functions.get_lp_asset().get()
    const LP_ASSET_ID = lpAssetResult.value.bits.toString()

    // custom code, populate the events
    // Mint USDC tokens for users
    await call(usdcUser0.functions.faucet())
    await call(usdcUser1.functions.faucet())
    await call(usdcUser2.functions.faucet())

    // Set initial prices
    await call(storkMockDeployer.functions.update_price(USDC_ASSET, toPrice(1)))
    await call(storkMockDeployer.functions.update_price(ETH_ASSET, toPrice(3000)))
    await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45000)))
    await moveBlockchainTime(provider, 2, 1)

    // User0 adds liquidity (10000 USDC)
    await call(
        vaultUser0.functions
            .add_liquidity(user0Identity)
            .addContracts(attachedContracts)
            .callParams({
                forward: [expandDecimals(10000), USDC_ASSET_ID],
            }),
    )
    await moveBlockchainTime(provider, 5, 1)

    // User1 adds liquidity (5000 USDC)
    await call(
        vaultUser1.functions
            .add_liquidity(user1Identity)
            .addContracts(attachedContracts)
            .callParams({
                forward: [expandDecimals(5000), USDC_ASSET_ID],
            }),
    )
    await moveBlockchainTime(provider, 10, 1)

    // User0 adds more liquidity (3000 USDC)
    await call(
        vaultUser0.functions
            .add_liquidity(user0Identity)
            .addContracts(attachedContracts)
            .callParams({
                forward: [expandDecimals(3000), USDC_ASSET_ID],
            }),
    )
    await moveBlockchainTime(provider, 8, 1)

    // User2 adds liquidity (7000 USDC)
    await call(
        vaultUser2.functions
            .add_liquidity(user2Identity)
            .addContracts(attachedContracts)
            .callParams({
                forward: [expandDecimals(7000), USDC_ASSET_ID],
            }),
    )
    await moveBlockchainTime(provider, 12, 1)

    // Get LP token balances for removal
    const user0LpBalance = await user0Wallet.getBalance(LP_ASSET_ID)
    const user1LpBalance = await user1Wallet.getBalance(LP_ASSET_ID)
    const user2LpBalance = await user2Wallet.getBalance(LP_ASSET_ID)

    // User0 removes half of their liquidity
    const user0RemoveAmount = user0LpBalance.div(2)
    await call(
        vaultUser0.functions
            .remove_liquidity(user0Identity)
            .addContracts(attachedContracts)
            .callParams({
                forward: [user0RemoveAmount.toString(), LP_ASSET_ID],
            }),
    )
    await moveBlockchainTime(provider, 7, 1)

    // User1 removes all their liquidity
    await call(
        vaultUser1.functions
            .remove_liquidity(user1Identity)
            .addContracts(attachedContracts)
            .callParams({
                forward: [user1LpBalance.toString(), LP_ASSET_ID],
            }),
    )
    await moveBlockchainTime(provider, 15, 1)

    // User0 removes remaining liquidity
    const user0RemainingLpBalance = await user0Wallet.getBalance(LP_ASSET_ID)
    await call(
        vaultUser0.functions
            .remove_liquidity(user0Identity)
            .addContracts(attachedContracts)
            .callParams({
                forward: [user0RemainingLpBalance.toString(), LP_ASSET_ID],
            }),
    )
    await moveBlockchainTime(provider, 9, 1)

    // User2 adds more liquidity (2000 USDC)
    await call(
        vaultUser2.functions
            .add_liquidity(user2Identity)
            .addContracts(attachedContracts)
            .callParams({
                forward: [expandDecimals(2000), USDC_ASSET_ID],
            }),
    )
    await moveBlockchainTime(provider, 11, 1)
}

