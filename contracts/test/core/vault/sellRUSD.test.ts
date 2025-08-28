import { expect, use } from "chai"
import { AbstractContract, assets, Provider, Signer, Wallet, WalletUnlocked, AssetId } from "fuels"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import { Fungible, Rlp, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault } from "../../../types"
import { deploy, getBalance, getValStr, call } from "../../utils/utils"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { asStr, expandDecimals, toPrice, toUsd } from "../../utils/units"
import { getAssetId, toAsset } from "../../utils/asset"
import { useChai } from "../../utils/chai"
import { BNB_MAX_LEVERAGE, BTC_MAX_LEVERAGE, DAI_MAX_LEVERAGE, getBnbConfig, getBtcConfig, getDaiConfig } from "../../utils/vault"
import { WALLETS } from "../../utils/wallets"
import { BNB_PRICEFEED_ID, BTC_PRICEFEED_ID, DAI_PRICEFEED_ID, getUpdatePriceDataCall } from "../../utils/mock-pyth"

import { launchNode, getNodeWallets } from "../../utils/node"

use(useChai)

describe("Vault.sellRUSD", function () {
    let attachedContracts: AbstractContract[]
    let priceUpdateSigner: Signer
    let launchedNode: LaunchTestNodeReturn<DeployContractConfig[]>
    let deployer: WalletUnlocked
    let user0: WalletUnlocked
    let user1: WalletUnlocked
    let user2: WalletUnlocked
    let user3: WalletUnlocked
    let utils: Utils
    let BNB: Fungible
    let DAI: Fungible
    let BTC: Fungible
    let vault: Vault
    let vault_user0: Vault
    let vault_user1: Vault
    let rusd: Rusd
    let RUSD_ASSET_ID: string // the RUSD fungible asset
    let vaultPricefeed: VaultPricefeed
    let timeDistributor: TimeDistributor
    let yieldTracker: YieldTracker
    let rlp: Rlp

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
        vaultPricefeed = await deploy("VaultPricefeed", deployer)
        rusd = await deploy("Rusd", deployer)
        timeDistributor = await deploy("TimeDistributor", deployer)
        yieldTracker = await deploy("YieldTracker", deployer)
        rlp = await deploy("Rlp", deployer)
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

        await call(rlp.functions.initialize())

        vault_user0 = new Vault(vault.id.toAddress(), user0)
        vault_user1 = new Vault(vault.id.toAddress(), user1)
    })

    it("sellRUSD", async () => {
        await expect(
            call(vault_user0.functions.sell_rusd(toAsset(BNB), addrToIdentity(user1)).addContracts(attachedContracts)),
        ).to.be.revertedWith("VaultAssetNotWhitelisted")

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(300), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(60000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(BNB.functions.mint(addrToIdentity(user0), 100))

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq("0")
        expect((await user0.getBalance(getAssetId(BNB))).toString()).eq("100")

        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BNB), addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [100, getAssetId(BNB)],
                }),
        )

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("29670")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("1")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("29670")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq(asStr(100 - 1))
        expect((await user0.getBalance(getAssetId(BNB))).toString()).eq("0")

        await expect(
            call(vault_user0.functions.sell_rusd(toAsset(BNB), addrToIdentity(user1)).addContracts(attachedContracts)),
        ).to.be.revertedWith("VaultInvalidRusdAmount")

        await expect(
            call(
                vault_user0
                    .functions.sell_rusd(toAsset(BTC), addrToIdentity(user1))
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [15000, getAssetId(rusd)],
                    }),
            ),
        ).to.be.revertedWith("VaultInvalidRedemptionAmount")

        console.log("user0 RUSD balance", (await user0.getBalance(RUSD_ASSET_ID)).toString())
        await call(
            vault_user0
                .functions.sell_rusd(toAsset(BNB), addrToIdentity(user1))
                .callParams({
                    forward: [15000, getAssetId(rusd)],
                })
                .addContracts(attachedContracts),
        )
        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("14670")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("2")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq(asStr(29700 - 15000 - 30))
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq("50")
        expect((await user0.getBalance(getAssetId(BNB))).toString()).eq("0")
        expect((await user1.getBalance(getAssetId(BNB))).toString()).eq(asStr(48))
    })

    it("sellRUSD after a price increase", async () => {
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(300), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))

        await call(BNB.functions.mint(addrToIdentity(user0), 100))

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq("0")
        expect((await user0.getBalance(getAssetId(BNB))).toString()).eq("100")
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BNB), addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [100, getAssetId(BNB)],
                }),
        )

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("29670")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("1")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("29670")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq(asStr(100 - 1))
        expect((await user0.getBalance(getAssetId(BNB))).toString()).eq("0")

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(400), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(600), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(500), vaultPricefeed, priceUpdateSigner))

        await call(
            vault_user0
                .functions.sell_rusd(toAsset(BNB), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [15000, getAssetId(rusd)],
                }),
        )

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq(asStr(29700 - 15000 - 30))
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("2")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq(asStr(29700 - 15000 - 30))
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq(asStr(100 - 1 - 25 - 4))
        expect((await user0.getBalance(getAssetId(BNB))).toString()).eq("0")
        expect((await user1.getBalance(getAssetId(BNB))).toString()).eq("28")
    })

    it("sellRUSD redeem based on price", async () => {
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(60000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(2)))

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("0")
        expect((await user0.getBalance(getAssetId(BTC))).toString()).eq(expandDecimals(2))

        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(2), getAssetId(BTC)],
                }),
        )

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("119520360000000")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("6000000")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BTC)))).eq("119520360000000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("1994000000")
        expect((await user0.getBalance(getAssetId(BTC))).toString()).eq("0")
        expect((await user1.getBalance(getAssetId(BTC))).toString()).eq("0")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(82000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(80000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(83000), vaultPricefeed, priceUpdateSigner))

        await call(
            vault_user0
                .functions.sell_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(10000), getAssetId(rusd)],
                }),
        )

        expect((await user1.getBalance(getAssetId(BTC))).toString()).eq("120000481")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("6361085")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("1873638434")
    })

    it("sellRUSD for stableTokens", async () => {
        await call(
            vault.functions.set_fees(
                50, // tax_basis_points
                10, // stable_tax_basis_points
                4, // mint_burn_fee_basis_points
                30, // swap_fee_basis_points
                4, // stable_swap_fee_basis_points
                10, // margin_fee_basis_points
                toUsd(5), // liquidation_fee_usd
                0, // min_profit_time
                false, // has_dynamic_fees
            ),
        )

        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(10000)))

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("0")
        expect((await user0.getBalance(getAssetId(DAI))).toString()).eq(expandDecimals(10000))

        await call(
            vault_user0
                .functions.buy_rusd(toAsset(DAI), addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(10000), getAssetId(DAI)],
                }),
        )

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("9986004000000")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq(expandDecimals(4))
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(DAI)))).eq("9986004000000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq(expandDecimals(9996))
        expect((await user0.getBalance(getAssetId(DAI))).toString()).eq("0")
        expect((await user1.getBalance(getAssetId(DAI))).toString()).eq("0")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(5000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(1)))

        expect((await user2.getBalance(getAssetId(DAI))).toString()).eq("0")

        await call(
            vault_user0
                .functions.swap(toAsset(BTC), toAsset(DAI), addrToIdentity(user2))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(1), getAssetId(BTC)],
                }),
        )

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("18970029971")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(DAI)))).eq("4991004000000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("5005990009991")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BTC)))).eq("4995000000000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq(expandDecimals(1))

        expect((await user2.getBalance(getAssetId(DAI))).toString()).eq("4975039960038")
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
