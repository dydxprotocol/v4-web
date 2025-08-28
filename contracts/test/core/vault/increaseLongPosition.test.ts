import { expect, use } from "chai"
import { AbstractContract, assets, Provider, Signer, Wallet, WalletUnlocked, AssetId } from "fuels"
import { Fungible, Rlp, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault } from "../../../types"
import { deploy, getValue, getValStr, formatObj, call } from "../../utils/utils"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { asStr, expandDecimals, toNormalizedPrice, toPrice, toUsd } from "../../utils/units"
import { getAssetId, toAsset } from "../../utils/asset"
import { useChai } from "../../utils/chai"
import { BigNumber } from "ethers"
import { BTC_MAX_LEVERAGE, DAI_MAX_LEVERAGE, getBtcConfig, getDaiConfig, validateVaultBalance } from "../../utils/vault"
import { WALLETS } from "../../utils/wallets"
import { getPosition } from "../../utils/contract"
import { BNB_PRICEFEED_ID, BTC_PRICEFEED_ID, DAI_PRICEFEED_ID, getUpdatePriceDataCall } from "../../utils/mock-pyth"

import { launchNode } from "../../utils/node"

use(useChai)

describe("Vault.increaseLongPosition", function () {
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
    let vault_user0: Vault
    let vault_user1: Vault
    let rusd: Rusd
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

    it("increasePosition long validations", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await expect(
            vault_user1
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), 0, true)
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultInvalidMsgCaller")

        await call(vault_user0.functions.set_approved_router(addrToIdentity(user1.address), true))

        await expect(
            vault_user1
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BNB), 0, true)
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultCollateralAssetNotWhitelisted")

        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BNB), toUsd(1000), true)
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultLongCollateralIndexAssetsMismatch")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(DAI), toUsd(1000), true)
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultLongCollateralAssetMustNotBeStableAsset")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(60000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(1000), true)
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultInsufficientCollateralForFees")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), 0, true)
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultInvalidPositionSize")

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(1)))

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(1000), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [(2500 - 1) * 10, getAssetId(BTC)],
                })
                .call(),
        ).to.be.revertedWith("VaultLossesExceedCollateral")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(1000), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [2500 * 10, getAssetId(BTC)],
                })
                .call(),
        ).to.be.revertedWith("VaultLossesExceedCollateral")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(1000), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [2500 * 10, getAssetId(BTC)],
                })
                .call(),
        ).to.be.revertedWith("VaultInsufficientCollateralForFees")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(1000), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [(2500 + 10000) * 10, getAssetId(BTC)],
                })
                .call(),
        ).to.be.revertedWith("VaultLiquidationFeesExceedCollateral")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(500), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [(2500 + 10000 + 10000) * 10, getAssetId(BTC)],
                })
                .call(),
        ).to.be.revertedWith("VaultMaxLeverageExceeded")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(8), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [(2500 + 10000 + 10000) * 10, getAssetId(BTC)],
                })
                .call(),
        ).to.be.revertedWith("VaultSizeMustBeMoreThanCollateral")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(47), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [(2500 + 10000 + 10000) * 10, getAssetId(BTC)],
                })
                .call(),
        ).to.be.revertedWith("VaultReserveExceedsPool")
    })

    it("increasePosition long", async () => {
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(60000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(1)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(118), true)
                .addContracts(attachedContracts)
                .callParams({
                    // 0.001174 BTC => 47
                    forward: [(117500 - 1) * 10, getAssetId(BTC)],
                })
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
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(200), true)
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
        expect(position.collateral).eq("0")
        expect(position.average_price).eq("0")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("0")
        expect(position.realized_pnl.value).eq("0")
        expect(position.realized_pnl.is_neg).eq(false)
        expect(position.last_increased_time).eq("0")

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(47), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [(22500 - 1) * 10, getAssetId(BTC)],
                }),
        )

        let timestamp = await getValStr(utils.functions.get_unix_timestamp())

        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2566747")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("1176176")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq("38056399600000000000000000000000")
        expect(await getValStr(vault.functions.get_redemption_collateral_usd(toAsset(BTC)))).eq(
            "93547558800000000000000000000000",
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(47))
        expect(position.collateral).eq("8943600400000000000000000000000")
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("1176176")
        expect(position.realized_pnl.value).eq("0")
        expect(position.realized_pnl.is_neg).eq(false)
        let lastIncreasedTime = BigNumber.from(position.last_increased_time)
        // timestamp is within a deviation of 2 (actually: 1), so account for that here
        expect(lastIncreasedTime.gte(BigNumber.from(timestamp).sub(2)) && lastIncreasedTime.lte(BigNumber.from(timestamp).add(2)))
            .to.be.true // lastIncreasedTime

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("8223")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BTC)))).eq("93623482800")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2566747")

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq("0")

        await validateVaultBalance(expect, vault, BTC)
    })

    it("increasePosition long aum", async () => {
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(100000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(100000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(100000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(1)))

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("0")

        expect(await getValStr(vault.functions.get_redemption_collateral_usd(toAsset(BTC)))).eq("0")
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(1), getAssetId(BTC)],
                }),
        )
        expect(await getValStr(vault.functions.get_redemption_collateral_usd(toAsset(BTC)))).eq(
            "99600300000000000000000000000000000",
        )

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("3000000") // 0.003 BTC
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(BTC)))).eq("99600300000000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("997000000") // 0.997

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(5, 8)))

        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq("0")

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq("0")
        expect(position.collateral).eq("0")
        expect(position.average_price).eq("0")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("0")
        expect(position.realized_pnl.value).eq("0")
        expect(position.realized_pnl.is_neg).eq(false)
        expect(position.last_increased_time).eq("0")

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(80000), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(5, 8), getAssetId(BTC)],
                }),
        )

        let timestamp = await getValStr(utils.functions.get_unix_timestamp())

        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("1496200800") // 1.4962 BTC
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("800800800") // 0.8 BTC
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq("30130000000000000000000000000000000")
        expect(await getValStr(vault.functions.get_redemption_collateral_usd(toAsset(BTC)))).eq(
            "99540260100000000000000000000000000",
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(80000))
        expect(position.collateral).eq("49870000000000000000000000000000000")
        expect(position.average_price).eq("100100000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("800800800") // 0.8 BTC
        expect(position.realized_pnl.value).eq("0")
        expect(position.realized_pnl.is_neg).eq(false)
        // timestamp is within a deviation of 2 (actually: 1), so account for that here
        let lastIncreasedTime = BigNumber.from(position.last_increased_time)
        expect(lastIncreasedTime.gte(BigNumber.from(timestamp).sub(2)) && lastIncreasedTime.lte(BigNumber.from(timestamp).add(2)))
            .to.be.true // lastIncreasedTime

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(150000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(150000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(150000), vaultPricefeed, priceUpdateSigner))

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("39760239760239760239760239760239760")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(75000), vaultPricefeed, priceUpdateSigner))

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("20119880119880119880119880119880119")

        await call(
            vault_user0
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BTC),
                    toAsset(BTC),
                    0,
                    toUsd(80000),
                    true,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq("0")
        expect(position.collateral).eq("0")
        expect(position.average_price).eq("0")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("0")
        expect(position.realized_pnl.value).eq("0")
        expect(position.realized_pnl.is_neg).eq(false)
        expect(position.last_increased_time).eq("0")

        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("1099928807")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq(toUsd(0))
        expect(await getValStr(vault.functions.get_redemption_collateral_usd(toAsset(BTC)))).eq(
            "82412165864475000000000000000000000",
        )

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq("0")

        await validateVaultBalance(expect, vault, BTC)
    })
})
