import { expect, use } from "chai"
import { AbstractContract, Provider, Signer, Wallet, WalletUnlocked } from "fuels"
import { Fungible, Rlp, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault } from "../../../types"
import { deploy, getBalance, getValue, getValStr, formatObj, call } from "../../utils/utils"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { expandDecimals, toNormalizedPrice, toPrice, toUsd } from "../../utils/units"
import { getAssetId, toAsset } from "../../utils/asset"
import { useChai } from "../../utils/chai"
import { DAI_MAX_LEVERAGE, BNB_MAX_LEVERAGE, getBnbConfig, getBtcConfig, getDaiConfig, BTC_MAX_LEVERAGE } from "../../utils/vault"
import { WALLETS } from "../../utils/wallets"
import { getPosition, getPositionLeverage } from "../../utils/contract"
import { BNB_PRICEFEED_ID, BTC_PRICEFEED_ID, DAI_PRICEFEED_ID, getUpdatePriceDataCall } from "../../utils/mock-pyth"

use(useChai)

describe("Vault.decreaseShortPosition", () => {
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
    let vaultPricefeed: VaultPricefeed
    let timeDistributor: TimeDistributor
    let yieldTracker: YieldTracker
    let rlp: Rlp

    beforeEach(async () => {
        const provider = await Provider.create("http://127.0.0.1:4000/v1/graphql")

        const wallets = WALLETS.map((k) => Wallet.fromPrivateKey(k, provider))
        ;[deployer, user0, user1, user2, user3] = wallets
        priceUpdateSigner = new Signer(WALLETS[0])

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
    })

    it("decreasePosition short", async () => {
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

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(300), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))

        await expect(
            vault
                .connect(user1)
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BTC),
                    toAsset(BTC),
                    0,
                    0,
                    false,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultInvalidMsgCaller")

        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(60000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await expect(
            vault
                .connect(user0)
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(DAI),
                    toAsset(BTC),
                    0,
                    toUsd(1000),
                    false,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultEmptyPosition")

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(1000)))
        await call(
            vault
                .as(user0)
                .functions.buy_rusd(toAsset(DAI), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), getAssetId(DAI)],
                }),
        )

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(
            vault
                .connect(user0)
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(90), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(10), getAssetId(DAI)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq(toUsd(9.9))
        expect(position.average_price).eq("39960000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("90090090090")
        expect(position.realized_pnl.value).eq("0")
        expect(position.realized_pnl.is_neg).eq(false)

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(44000), vaultPricefeed, priceUpdateSigner))
        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("9198198198198198198198198198198")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(1), vaultPricefeed, priceUpdateSigner))
        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("89997745495495495495495495495495")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(1), vaultPricefeed, priceUpdateSigner))
        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("89997745495495495495495495495495")

        let leverage = await getPositionLeverage(vault, addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)

        expect(leverage).eq("90909") // ~9X leverage

        await expect(
            vault
                .connect(user0)
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(DAI),
                    toAsset(BTC),
                    0,
                    toUsd(100),
                    false,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultSizeExceeded")

        await expect(
            vault
                .connect(user0)
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(DAI),
                    toAsset(BTC),
                    toUsd(5),
                    toUsd(50),
                    false,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultLiquidationFeesExceedCollateral")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("129910089")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(DAI)))).eq("90090090090")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("99960000000")
        expect(await getBalance(user2, DAI)).eq("0")

        await call(
            vault
                .connect(user0)
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(DAI),
                    toAsset(BTC),
                    toUsd(3),
                    toUsd(50),
                    false,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(40))
        expect(position.collateral).eq("6900000000000000000000000000000")
        expect(position.average_price).eq("39960000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("40040040040")
        expect(position.realized_pnl.value).eq("49998747497497497497497497497497")
        expect(position.realized_pnl.is_neg).eq(false)

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("179860138")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(DAI)))).eq("40040040040")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("50011201302")
        expect(await getBalance(user2, DAI)).eq("52895851645")

        leverage = await getPositionLeverage(vault, addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)

        expect(leverage).eq("57971")
    })

    it("decreasePosition short minProfitBasisPoints", async () => {
        await call(
            vault.functions.set_fees(
                50, // tax_basis_points
                10, // stable_tax_basis_points
                4, // mint_burn_fee_basis_points
                30, // swap_fee_basis_points
                4, // stable_swap_fee_basis_points
                10, // margin_fee_basis_points
                toUsd(5), // liquidation_fee_usd
                60 * 60, // min_profit_time
                false, // has_dynamic_fees
            ),
        )

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(300), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))

        await expect(
            vault
                .connect(user1)
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BTC),
                    toAsset(BTC),
                    0,
                    0,
                    false,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultInvalidMsgCaller")

        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(60000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await expect(
            vault
                .connect(user0)
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(DAI),
                    toAsset(BTC),
                    0,
                    toUsd(1000),
                    false,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultEmptyPosition")

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(1000)))
        await call(
            vault
                .as(user0)
                .functions.buy_rusd(toAsset(DAI), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), getAssetId(DAI)],
                }),
        )

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(
            vault
                .connect(user0)
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(90), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(10), getAssetId(DAI)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq(toUsd(9.9))
        expect(position.average_price).eq("39960000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("90090090090")
        expect(position.realized_pnl.value).eq("0")
        expect(position.realized_pnl.is_neg).eq(false)

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39701), vaultPricefeed, priceUpdateSigner)) // 40,000 * (100 - 0.75)% => 39700
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39701), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39701), vaultPricefeed, priceUpdateSigner))
        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq(toUsd(0))
    })

    it("decreasePosition short with loss", async () => {
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

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(300), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(60000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(1000)))
        await call(
            vault
                .as(user0)
                .functions.buy_rusd(toAsset(DAI), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), getAssetId(DAI)],
                }),
        )

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(
            vault
                .connect(user0)
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(90), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(10), getAssetId(DAI)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq(toUsd(9.9))
        expect(position.average_price).eq("39960000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("90090090090")
        expect(position.realized_pnl.value).eq("0")
        expect(position.realized_pnl.is_neg).eq(false)

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40400), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40400), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40400), vaultPricefeed, priceUpdateSigner))
        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("1081981981981981981981981981981")

        let leverage = await getPositionLeverage(vault, addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)

        expect(leverage).eq("90909") // ~9X leverage

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("129910089")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(DAI)))).eq("90090090090")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("99960000000") // 99.6
        expect(await getBalance(user2, DAI)).eq("0")

        await expect(
            vault
                .connect(user0)
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(DAI),
                    toAsset(BTC),
                    toUsd(4),
                    toUsd(50),
                    false,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultLiquidationFeesExceedCollateral")

        await call(
            vault
                .connect(user0)
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(DAI),
                    toAsset(BTC),
                    toUsd(0),
                    toUsd(50),
                    false,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(40))
        expect(position.collateral).eq("9248898898898898898898898898900")
        expect(position.average_price).eq("39960000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("40040040040")
        expect(position.realized_pnl.value).eq("601101101101101101101101101100")
        expect(position.realized_pnl.is_neg).eq(true)

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("179860138")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(DAI)))).eq("40040040040")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("100560500600")
        expect(await getBalance(user2, DAI)).eq("0")

        await call(
            vault
                .connect(user0)
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(DAI),
                    toAsset(BTC),
                    toUsd(0),
                    toUsd(40),
                    false,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq("0")
        expect(position.collateral).eq("0") // collateral
        expect(position.average_price).eq("0")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("0")
        expect(position.realized_pnl.value).eq("0")
        expect(position.realized_pnl.is_neg).eq(false)

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("219820177")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("101040901080")
        expect(await getBalance(user2, DAI)).eq("8719298719")
    })
})
