import { expect, use } from "chai"
import { AbstractContract, Provider, Signer, Wallet, WalletUnlocked } from "fuels"
import { Fungible, Rlp, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault } from "../../../types"
import { deploy, formatObj, getValStr, getValue, call } from "../../utils/utils"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { asStr, expandDecimals, toNormalizedPrice, toPrice, toUsd } from "../../utils/units"
import { getAssetId, toAsset } from "../../utils/asset"
import { useChai } from "../../utils/chai"
import { BTC_MAX_LEVERAGE, getBtcConfig, validateVaultBalance } from "../../utils/vault"
import { getPosition, getPositionLeverage } from "../../utils/contract"
import { BNB_PRICEFEED_ID, BTC_PRICEFEED_ID, DAI_PRICEFEED_ID, getUpdatePriceDataCall } from "../../utils/mock-pyth"
import { launchNode } from "../../utils/node"

use(useChai)

describe("Vault.depositCollateral", () => {
    let attachedContracts: AbstractContract[]
    let priceUpdateSigner: Signer
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
    let vault_user0: Vault
    let vault_user1: Vault
    let vaultPricefeed: VaultPricefeed
    let timeDistributor: TimeDistributor
    let yieldTracker: YieldTracker
    let rlp: Rlp

    beforeEach(async () => {
        [ deployer, user0, user1, user2, user3 ] = await launchNode()
          
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

    it("deposit collateral", async () => {
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(60000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(1)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(47), true)
                .callParams({
                    // 0.001174 BTC => 47
                    forward: [(117500 - 1) * 10, getAssetId(BTC)],
                })
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultReserveExceedsPool")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("0")

        expect(await getValStr(vault.functions.get_redemption_collateral_usd(toAsset(BTC)))).eq("0")
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    // 0.001174 BTC => 47
                    forward: [(117500 - 1) * 10, getAssetId(BTC)],
                }),
        )
        expect(await getValStr(vault.functions.get_redemption_collateral_usd(toAsset(BTC)))).eq(
            "46811741400000000000000000000000",
        )

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("3525")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BTC)))).eq("46811741400")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("1171465")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(100), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [(117500 - 1) * 10, getAssetId(BTC)],
                })
                .call(),
        ).to.be.revertedWith("VaultReserveExceedsPool")

        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [(117500 - 1) * 10, getAssetId(BTC)],
                }),
        )

        expect(await getValStr(vault.functions.get_redemption_collateral_usd(toAsset(BTC)))).eq(
            "93623482800000000000000000000000",
        )

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("7050")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BTC)))).eq("93623482800")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2342930")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(47), true)
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultInsufficientCollateralForFees")

        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq("0")

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq("0")
        expect(position.collateral).eq("0") // collateral
        expect(position.average_price).eq("0")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("0")

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(47), true)
                .callParams({
                    forward: [22500 * 10, getAssetId(BTC)],
                })
                .addContracts(attachedContracts),
        )

        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2566757")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("1176176")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq("38056000000000000000000000000000")
        expect(await getValStr(vault.functions.get_redemption_collateral_usd(toAsset(BTC)))).eq(
            "93547558800000000000000000000000",
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(47))
        expect(position.collateral).eq("8944000000000000000000000000000")
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("1176176")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("8223")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BTC)))).eq("93623482800")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2566757")

        let leverage = await getPositionLeverage(vault, addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)

        expect(leverage).eq("52549") // ~5.2x

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), 0, true)
                .callParams({
                    forward: [22500 * 10, getAssetId(BTC)],
                })
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(47))
        expect(position.collateral).eq("17935000000000000000000000000000")
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("1176176")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("8223")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BTC)))).eq("93623482800")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2791757")

        leverage = await getPositionLeverage(vault, addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)
        expect(leverage).eq("26205") // ~2.6x

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), 0, true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [100 * 10, getAssetId(BTC)],
                }),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(47))
        expect(position.collateral).eq("17984950000000000000000000000000")
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("1176176")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("8223")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BTC)))).eq("93623482800")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2792757")

        leverage = await getPositionLeverage(vault, addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)
        expect(leverage).eq("26132") // ~2.6x

        await validateVaultBalance(expect, vault, BTC)
    })
})
