import { expect, use } from "chai"
import { AbstractContract, Provider, Signer, Wallet, WalletUnlocked } from "fuels"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import { Fungible, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault } from "../../../types"
import { deploy, getValStr, call } from "../../utils/utils"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { toPrice, toUsd } from "../../utils/units"
import { getAssetId, toAsset } from "../../utils/asset"
import { useChai } from "../../utils/chai"
import { BNB_MAX_LEVERAGE, DAI_MAX_LEVERAGE, getBnbConfig, getDaiConfig } from "../../utils/vault"
import { BNB_PRICEFEED_ID, BTC_PRICEFEED_ID, DAI_PRICEFEED_ID, getUpdatePriceDataCall } from "../../utils/mock-pyth"
import { launchNode, getNodeWallets } from "../../utils/node"

use(useChai)

describe("Vault.getFeeBasisPoints", function () {
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
    let rusd: Rusd
    let RUSD: string // the RUSD fungible asset
    let vaultPricefeed: VaultPricefeed
    let timeDistributor: TimeDistributor
    let yieldTracker: YieldTracker
    let vault_user0: Vault
    let vault_user1: Vault

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

        attachedContracts = [vault, vaultPricefeed, rusd]

        RUSD = getAssetId(rusd)

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

        await call(
            vault.functions.set_fees(
                50, // tax_basis_points
                10, // stable_tax_basis_points
                20, // mint_burn_fee_basis_points
                30, // swap_fee_basis_points
                4, // stable_swap_fee_basis_points
                10, // margin_fee_basis_points
                toUsd(5), // liquidation_fee_usd
                0, // min_profit_time
                true, // has_dynamic_fees
            ),
        )

        vault_user0 = new Vault(vault.id.toAddress(), user0)
        vault_user1 = new Vault(vault.id.toAddress(), user1)
    })

    it("getFeeBasisPoints", async () => {
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(300), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))
        expect(await getValStr(vault.functions.get_target_rusd_amount(toAsset(BNB)))).eq("0")

        await call(BNB.functions.mint(addrToIdentity(user0), 100 * 10))
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BNB), addrToIdentity(deployer))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [100 * 10, getAssetId(BNB)],
                }),
        )

        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("299100")
        expect(await getValStr(vault.functions.get_target_rusd_amount(toAsset(BNB)))).eq("299100")

        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 1000 * 10, 100, 50, true))).eq("100")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 5000 * 10, 100, 50, true))).eq("104")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 1000 * 10, 100, 50, false))).eq("100")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 5000 * 10, 100, 50, false))).eq("104")

        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 1000 * 10, 50, 100, true))).eq("51")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 5000 * 10, 50, 100, true))).eq("58")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 1000 * 10, 50, 100, false))).eq("51")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 5000 * 10, 50, 100, false))).eq("58")

        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        expect(await getValStr(vault.functions.get_target_rusd_amount(toAsset(BNB)))).eq("149550")
        expect(await getValStr(vault.functions.get_target_rusd_amount(toAsset(DAI)))).eq("149550")

        // incrementing bnb has an increased fee, while reducing bnb has a decreased fee
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 1000 * 10, 100, 50, true))).eq("150")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 5000 * 10, 100, 50, true))).eq("150")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 10000 * 10, 100, 50, true))).eq("150")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 20000 * 10, 100, 50, true))).eq("150")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 1000 * 10, 100, 50, false))).eq("50")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 5000 * 10, 100, 50, false))).eq("50")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 10000 * 10, 100, 50, false))).eq("50")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 20000 * 10, 100, 50, false))).eq("50")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 25000 * 10, 100, 50, false))).eq("50")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 100000 * 10, 100, 50, false))).eq("150")

        await call(DAI.functions.mint(addrToIdentity(user0), 20000 * 10))
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(DAI), addrToIdentity(deployer))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [20000 * 10, getAssetId(DAI)],
                }),
        )

        expect(await getValStr(vault.functions.get_target_rusd_amount(toAsset(BNB)))).eq("249450")
        expect(await getValStr(vault.functions.get_target_rusd_amount(toAsset(DAI)))).eq("249450")

        const bnbConfig = getBnbConfig(BNB)
        bnbConfig[2] = 30000 // asset_weight
        await call(vault.functions.set_asset_config(...bnbConfig))

        expect(await getValStr(vault.functions.get_target_rusd_amount(toAsset(BNB)))).eq("374175")
        expect(await getValStr(vault.functions.get_target_rusd_amount(toAsset(DAI)))).eq("124725")

        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("299100")

        // rusdAmount(bnb) is 29700, targetAmount(bnb) is 37270
        // incrementing bnb has a decreased fee, while reducing bnb has an increased fee
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 1000 * 10, 100, 50, true))).eq("90")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 5000 * 10, 100, 50, true))).eq("90")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 10000 * 10, 100, 50, true))).eq("90")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 1000 * 10, 100, 50, false))).eq("110")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 5000 * 10, 100, 50, false))).eq("113")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 10000 * 10, 100, 50, false))).eq("116")

        bnbConfig[2] = 5000 // asset_weight
        await call(vault.functions.set_asset_config(...bnbConfig))

        await call(BNB.functions.mint(addrToIdentity(user0), 200 * 10))
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BNB), addrToIdentity(deployer))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [200 * 10, getAssetId(BNB)],
                }),
        )

        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("894304")
        expect(await getValStr(vault.functions.get_target_rusd_amount(toAsset(BNB)))).eq("364701")
        expect(await getValStr(vault.functions.get_target_rusd_amount(toAsset(DAI)))).eq("729402")

        // rusdAmount(bnb) is 88800, targetAmount(bnb) is 36266
        // incrementing bnb has an increased fee, while reducing bnb has a decreased fee
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 1000 * 10, 100, 50, true))).eq("150")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 5000 * 10, 100, 50, true))).eq("150")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 10000 * 10, 100, 50, true))).eq("150")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 1000 * 10, 100, 50, false))).eq("28")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 5000 * 10, 100, 50, false))).eq("28")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 20000 * 10, 100, 50, false))).eq("28")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 50000 * 10, 100, 50, false))).eq("28")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 80000 * 10, 100, 50, false))).eq("28")

        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 1000 * 10, 50, 100, true))).eq("150")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 5000 * 10, 50, 100, true))).eq("150")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 10000 * 10, 50, 100, true))).eq("150")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 1000 * 10, 50, 100, false))).eq("0")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 5000 * 10, 50, 100, false))).eq("0")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 20000 * 10, 50, 100, false))).eq("0")
        expect(await getValStr(vault.functions.get_fee_basis_points(toAsset(BNB), 50000 * 10, 50, 100, false))).eq("0")
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
