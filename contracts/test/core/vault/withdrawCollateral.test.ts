import { expect, use } from "chai"
import { AbstractContract, Signer, WalletUnlocked } from "fuels"
import { Fungible, Rlp, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault } from "../../../types"
import { deploy, getValue, getValStr, formatObj, call } from "../../utils/utils"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { asStr, expandDecimals, toNormalizedPrice, toPrice, toUsd } from "../../utils/units"
import { getAssetId, toAsset } from "../../utils/asset"
import { useChai } from "../../utils/chai"
import { BNB_MAX_LEVERAGE, BTC_MAX_LEVERAGE, DAI_MAX_LEVERAGE, getBnbConfig, getBtcConfig, getDaiConfig } from "../../utils/vault"
import { getPosition, getPositionLeverage } from "../../utils/contract"
import { BNB_PRICEFEED_ID, BTC_PRICEFEED_ID, DAI_PRICEFEED_ID, getUpdatePriceDataCall } from "../../utils/mock-pyth"
import { launchNode } from "../../utils/node"

use(useChai)

describe("Vault.withdrawCollateral", function () {
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

    it("withdraw collateral", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(BTC.functions.mint(addrToIdentity(user1), expandDecimals(1)))
        await call(
            vault_user1
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    // 0.0025 BTC => 100 USD
                    forward: [250000 * 10, getAssetId(BTC)],
                }),
        )

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(1)))
        await expect(
            call(
                vault_user0
                    .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(110), true)
                    .addContracts(attachedContracts)
                    .callParams({
                        // 0.00025 BTC => 10 USD
                        forward: [25000 * 10, getAssetId(BTC)],
                    }),
            ),
        ).to.be.revertedWith("VaultReserveExceedsPool")

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(90), true)
                .callParams({
                    // 0.00025 BTC => 10 USD
                    forward: [25000 * 10, getAssetId(BTC)],
                })
                .addContracts(attachedContracts),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq(toUsd(9.9))
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("2252252")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(46100), vaultPricefeed, priceUpdateSigner))

        let leverage = await getPositionLeverage(vault, addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)
        expect(leverage).eq("90909") // ~9X leverage

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("9747")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("2252252")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq(toUsd(80.1))
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2740253")
        expect((await user2.getBalance(getAssetId(BTC))).toString()).eq("0")

        await call(
            vault_user0
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BTC),
                    toAsset(BTC),
                    toUsd(3),
                    toUsd(50),
                    true,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )

        leverage = await getPositionLeverage(vault, addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)
        expect(leverage).eq("57971") // ~5.8X leverage

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(40))
        expect(position.collateral).eq("6900000000000000000000000000000")
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("1001001")
        expect(position.realized_pnl.value).eq("7509865134865134865134865134865")
        expect(position.realized_pnl.is_neg).eq(false)

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("10830")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("1001001")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq("33100000000000000000000000000000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2512502")
        expect((await user2.getBalance(getAssetId(BTC))).toString()).eq("226668")

        await expect(
            call(
                vault_user0
                    .functions.decrease_position(
                        addrToIdentity(user0),
                        toAsset(BTC),
                        toAsset(BTC),
                        toUsd(3),
                        0,
                        true,
                        addrToIdentity(user2),
                    )
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultLiquidationFeesExceedCollateral")

        await call(
            vault_user0
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BTC),
                    toAsset(BTC),
                    toUsd(1),
                    0,
                    true,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(40))
        expect(position.collateral).eq("5900000000000000000000000000000")
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("1001001")
        expect(position.realized_pnl.value).eq("7509865134865134865134865134865")
        expect(position.realized_pnl.is_neg).eq(false)

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("10830")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("1001001")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq(toUsd(34.1))
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2490832")
        expect((await user2.getBalance(getAssetId(BTC))).toString()).eq("248338")
    })

    it("withdraw during cooldown duration", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(BTC.functions.mint(addrToIdentity(user1), expandDecimals(1)))
        await call(
            vault_user1
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    // 0.0025 BTC => 100 USD
                    forward: [250000 * 10, getAssetId(BTC)],
                }),
        )

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(1)))
        await expect(
            call(
                vault_user0
                    .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(110), true)
                    .callParams({
                        // 0.00025 BTC => 10 USD
                        forward: [25000 * 10, getAssetId(BTC)],
                    })
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultReserveExceedsPool")

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(90), true)
                .callParams({
                    // 0.00025 BTC => 10 USD
                    forward: [25000 * 10, getAssetId(BTC)],
                })
                .addContracts(attachedContracts),
        )
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(45100), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(46100), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(47100), vaultPricefeed, priceUpdateSigner))

        // it's okay to withdraw AND decrease size with at least same proportion (e.g. if leverage is decreased or the same)
        await call(
            vault_user0
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BTC),
                    toAsset(BTC),
                    toUsd(1),
                    toUsd(10),
                    true,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )

        // it's also okay to fully close position
        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        await call(
            vault_user0
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BTC),
                    toAsset(BTC),
                    position.collateral,
                    position.size,
                    true,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(30), true)
                .callParams({
                    // 0.00025 BTC => 10 USD
                    forward: [25000 * 10, getAssetId(BTC)],
                })
                .addContracts(attachedContracts),
        )
    })

    it("withdraw collateral long", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(500), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(500), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(500), vaultPricefeed, priceUpdateSigner))

        await call(BNB.functions.mint(addrToIdentity(user0), expandDecimals(100)))
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(BNB), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(10), getAssetId(BNB)],
                }),
        )

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BNB), toAsset(BNB), toUsd(2000), true)
                .callParams({
                    forward: [expandDecimals(1), getAssetId(BNB)],
                })
                .addContracts(attachedContracts),
        )

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(750), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(750), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(750), vaultPricefeed, priceUpdateSigner))

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BNB), toAsset(BNB), toUsd(0), true)
                .callParams({
                    forward: [expandDecimals(1), getAssetId(BNB)],
                })
                .addContracts(attachedContracts),
        )

        await call(
            vault_user0
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BNB),
                    toAsset(BNB),
                    toUsd(500),
                    toUsd(0),
                    true,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(400), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(400), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(400), vaultPricefeed, priceUpdateSigner))

        await call(
            vault_user0
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BNB),
                    toAsset(BNB),
                    toUsd(250),
                    toUsd(0),
                    true,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )

        await call(
            vault_user0
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BNB),
                    toAsset(BNB),
                    toUsd(0),
                    toUsd(250),
                    true,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )
    })

    it("withdraw collateral short", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(500), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(500), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(500), vaultPricefeed, priceUpdateSigner))

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(8000 + 500 + 500)))
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(DAI), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(8000), getAssetId(DAI)],
                }),
        )

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BNB), toUsd(2000), false)
                .callParams({
                    forward: [expandDecimals(500), getAssetId(DAI)],
                })
                .addContracts(attachedContracts),
        )

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(525), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(525), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(525), vaultPricefeed, priceUpdateSigner))

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BNB), toUsd(0), false)
                .callParams({
                    forward: [expandDecimals(500), getAssetId(DAI)],
                })
                .addContracts(attachedContracts),
        )

        await call(
            vault_user0
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(DAI),
                    toAsset(BNB),
                    toUsd(500),
                    toUsd(0),
                    false,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(475), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(475), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(475), vaultPricefeed, priceUpdateSigner))

        await call(
            vault_user0
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(DAI),
                    toAsset(BNB),
                    toUsd(0),
                    toUsd(500),
                    false,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )
    })
})
