import { expect, use } from "chai"
import { AbstractContract, assets, Provider, Signer, Wallet, WalletUnlocked, AssetId } from "fuels"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import { Fungible, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault } from "../../../types"
import { deploy, getBalance, getValStr, getValue, call } from "../../utils/utils"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { expandDecimals, toPrice, toUsd } from "../../utils/units"
import { getAssetId, toAsset } from "../../utils/asset"
import { useChai } from "../../utils/chai"
import { BNB_MAX_LEVERAGE, BTC_MAX_LEVERAGE, getBnbConfig, getBtcConfig } from "../../utils/vault"
import { BNB_PRICEFEED_ID, BTC_PRICEFEED_ID, DAI_PRICEFEED_ID, getUpdatePriceDataCall } from "../../utils/mock-pyth"

import { launchNode, getNodeWallets } from "../../utils/node"

use(useChai)

describe("Vault.withdrawFees", function () {
    let attachedContracts: AbstractContract[]
    let priceUpdateSigner: Signer
    let launchedNode: LaunchTestNodeReturn<DeployContractConfig[]>
    let deployer: WalletUnlocked
    let user0: WalletUnlocked
    let user1: WalletUnlocked
    let user2: WalletUnlocked
    let user3: WalletUnlocked
    let BNB: Fungible
    let DAI: Fungible
    let BTC: Fungible
    let vault: Vault
    let vault_user0: Vault
    let rusd: Rusd
    let RUSD_ASSET_ID: string // the RUSD fungible asset
    let vaultPricefeed: VaultPricefeed
    let timeDistributor: TimeDistributor
    let yieldTracker: YieldTracker
    let utils: Utils

    beforeEach(async () => {
        launchedNode = await launchNode()
        ;[ deployer, user0, user1, user2, user3 ] = getNodeWallets(launchedNode)
          
        priceUpdateSigner = new Signer(deployer.privateKey)

        /*
            NativeAsset + Pricefeed
        */
        BNB = await deploy("Fungible", deployer)
        DAI = await deploy("Fungible", deployer)
        BTC = await deploy("Fungible", deployer)

        /*
            Vault + Router + RUSD
        */
        utils = await deploy("Utils", deployer)
        vault = await deploy("Vault", deployer)
        vault_user0 = new Vault(vault.id.toAddress(), user0)
        vaultPricefeed = await deploy("VaultPricefeed", deployer)
        rusd = await deploy("Rusd", deployer)
        timeDistributor = await deploy("TimeDistributor", deployer)
        yieldTracker = await deploy("YieldTracker", deployer)

        attachedContracts = [vault, vaultPricefeed, rusd]

        RUSD_ASSET_ID = getAssetId(rusd)

        await call(rusd.functions.initialize(toContract(vault), toAddress(user0)))

        await call(vault.functions.initialize(addrToIdentity(deployer), toAsset(rusd), toContract(rusd)))
        await call(vault.functions.set_pricefeed_provider(toContract(vaultPricefeed)))

        await call(yieldTracker.functions.initialize(toContract(rusd)))
        await call(yieldTracker.functions.set_time_distributor(toContract(timeDistributor)))
        await call(timeDistributor.functions.initialize())
        await call(timeDistributor.functions.set_distribution([contrToIdentity(yieldTracker)], [1000], [toAsset(BNB)]))

        await call(BNB.functions.mint(contrToIdentity(timeDistributor), 5000))
        await call(rusd.functions.set_yield_trackers([{ bits: contrToIdentity(yieldTracker).ContractId?.bits as string }]))

        await call(vaultPricefeed.functions.initialize(addrToIdentity(deployer), toAddress(deployer)))
        await call(vaultPricefeed.functions.set_asset_config(toAsset(BNB), BNB_PRICEFEED_ID, 9))
        await call(vaultPricefeed.functions.set_asset_config(toAsset(DAI), DAI_PRICEFEED_ID, 9))
        await call(vaultPricefeed.functions.set_asset_config(toAsset(BTC), BTC_PRICEFEED_ID, 9))

        await call(
            vault.functions.set_funding_rate(
                8 * 3600, // funding_interval (8 hours)
                600, // fundingRateFactor
                600, // stableFundingRateFactor
            ),
        )
    })

    it("withdrawFees", async () => {
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(300), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(60000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(BNB.functions.mint(addrToIdentity(user0), expandDecimals(900)))

        expect((await deployer.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq("0")

        const r = await call(
            vault_user0
                .functions.buy_rusd(toAsset(BNB), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(900), getAssetId(BNB)],
                }),
        )

        expect((await deployer.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("268920810000000")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("2700000000")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("268920810000000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq("897300000000")
        expect(await getValStr(rusd.functions.total_rusd_supply())).eq("268920810000000")

        await call(BNB.functions.mint(addrToIdentity(user0), expandDecimals(200)))

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(2)))

        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(2), getAssetId(BTC)],
                }),
        )

        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BTC)))).eq("119520360000000")
        expect(await getValStr(rusd.functions.total_rusd_supply())).eq("388441170000000")

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(2)))

        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(2), getAssetId(BTC)],
                }),
        )
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BTC)))).eq("239040720000000")
        expect(await getValStr(rusd.functions.total_rusd_supply())).eq("507961530000000")

        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("268920810000000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq("897300000000")

        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BNB), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(200), getAssetId(BNB)],
                }),
        )

        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("328680990000000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq("1096700000000")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("3300000000")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("12000000")

        await expect(vault_user0.functions.withdraw_fees(toAsset(BNB), addrToIdentity(user2)).call()).to.be.revertedWith(
            "VaultForbiddenNotGov",
        )

        expect((await user2.getBalance(getAssetId(BNB))).toString()).eq("0")
        await call(vault.functions.withdraw_fees(toAsset(BNB), addrToIdentity(user2)).addContracts(attachedContracts))
        expect((await user2.getBalance(getAssetId(BNB))).toString()).eq("3300000000")

        expect((await user2.getBalance(getAssetId(BTC))).toString()).eq("0")
        await call(vault.functions.withdraw_fees(toAsset(BTC), addrToIdentity(user2)).addContracts(attachedContracts))
        expect((await user2.getBalance(getAssetId(BTC))).toString()).eq("12000000")
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
