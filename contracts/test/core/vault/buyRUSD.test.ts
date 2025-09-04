import { expect, use } from "chai"
import { AbstractContract, assets, Provider, Signer, Wallet, WalletUnlocked, AssetId } from "fuels"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import { Fungible, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault } from "../../../types"
import { deploy, getBalance, getValStr, call } from "../../utils/utils"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { asStr, expandDecimals, toPrice, toUsd } from "../../utils/units"
import { getAssetId, toAsset } from "../../utils/asset"
import { useChai } from "../../utils/chai"
import { BigNumber } from "ethers"
import {
    BNB_MAX_LEVERAGE,
    BTC_MAX_LEVERAGE,
    DAI_MAX_LEVERAGE,
    getBnbConfig,
    getBtcConfig,
    getDaiConfig,
    validateVaultBalance,
} from "../../utils/vault"
import {
    BNB_PRICEFEED_ID,
    BTC_PRICEFEED_ID,
    DAI_PRICEFEED_ID,
    ETH_PRICEFEED_ID,
    getUpdatePriceDataCall,
} from "../../utils/mock-pyth"

import { launchNode, getNodeWallets } from "../../utils/node"

use(useChai)

describe("Vault.buyRUSD", () => {
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

        vault_user0 = new Vault(vault.id.toAddress(), user0)
        vault_user1 = new Vault(vault.id.toAddress(), user1)
    })

    it("buyRUSD", async () => {
        await expect(
            call(vault.functions.buy_rusd(toAsset(BNB), addrToIdentity(deployer)).addContracts(attachedContracts)),
        ).to.be.revertedWith("VaultAssetNotWhitelisted")

        await expect(
            call(vault_user0.functions.buy_rusd(toAsset(BNB), addrToIdentity(user1)).addContracts(attachedContracts)),
        ).to.be.revertedWith("VaultAssetNotWhitelisted")

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(300), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))

        await expect(
            call(vault_user0.functions.buy_rusd(toAsset(BNB), addrToIdentity(user1)).addContracts(attachedContracts)),
        ).to.be.revertedWith("VaultInvalidAssetAmount")

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq("0")

        await call(BNB.functions.mint(addrToIdentity(user0), 100))
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BNB), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [100, getAssetId(BNB)],
                }),
        )

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("29670")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("1")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("29670")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq(asStr(100 - 1))

        await validateVaultBalance(expect, vault, BNB)
    })

    it("buyRUSD allows gov to mint", async () => {
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(300), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))

        await call(BNB.functions.mint(addrToIdentity(deployer.address), 100))

        expect((await deployer.getBalance(RUSD_ASSET_ID)).toString()).eq("0")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq("0")

        await call(
            vault.functions
                .buy_rusd(toAsset(BNB), addrToIdentity(deployer))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [100, getAssetId(BNB)],
                }),
        )

        expect((await deployer.getBalance(RUSD_ASSET_ID)).toString()).eq("29670")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("1")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("29670")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq(asStr(100 - 1))

        await validateVaultBalance(expect, vault, BNB)
    })

    it("buyRUSD uses min price", async () => {
        await expect(
            call(vault_user0.functions.buy_rusd(toAsset(BNB), addrToIdentity(user1)).addContracts(attachedContracts)),
        ).to.be.revertedWith("VaultAssetNotWhitelisted")

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(300), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(200), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(250), vaultPricefeed, priceUpdateSigner))

        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq("0")
        await call(BNB.functions.mint(addrToIdentity(user0), 100))
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BNB), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [100, getAssetId(BNB)],
                }),
        )
        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("24725")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("1")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("24725")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq(asStr(100 - 1))

        await validateVaultBalance(expect, vault, BNB)
    })

    it("buyRUSD updates fees", async () => {
        await expect(
            call(vault_user0.functions.buy_rusd(toAsset(BNB), addrToIdentity(user1)).addContracts(attachedContracts)),
        ).to.be.revertedWith("VaultAssetNotWhitelisted")

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(300), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq("0")
        await call(BNB.functions.mint(addrToIdentity(user0), 10000))
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BNB), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [10000, getAssetId(BNB)],
                }),
        )

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("2988009")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("30")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("2988009")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq(asStr(10000 - 30))

        await validateVaultBalance(expect, vault, BNB)
    })

    it("buyRUSD uses mintBurnFeeBasisPoints", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

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

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq("0")
        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(10000)))
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(DAI), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(10000), getAssetId(DAI)],
                }),
        )

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("9986004000000")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq(expandDecimals(4))
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(DAI)))).eq("9986004000000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq(expandDecimals(10000 - 4))
    })

    it("buyRUSD adjusts for decimals", async () => {
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(60000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await expect(
            call(vault_user0.functions.buy_rusd(toAsset(BTC), addrToIdentity(user1)).addContracts(attachedContracts)),
        ).to.be.revertedWith("VaultInvalidAssetAmount")

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("0")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BNB)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BNB)))).eq("0")

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(1)))
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(1), getAssetId(BTC)],
                }),
        )

        expect((await user0.getBalance(RUSD_ASSET_ID)).toString()).eq("0")
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("3000000")
        expect((await user1.getBalance(RUSD_ASSET_ID)).toString()).eq("59760180000000")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BTC)))).eq("59760180000000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("997000000")

        await validateVaultBalance(expect, vault, BTC)
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
