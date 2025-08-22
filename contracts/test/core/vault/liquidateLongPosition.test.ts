import { expect, use } from "chai"
import { AbstractContract, Provider, Signer, Wallet, WalletUnlocked } from "fuels"
import { Fungible, Rlp, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault } from "../../../types"
import { deploy, getBalance, getValue, getValStr, formatObj, call } from "../../utils/utils"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { expandDecimals, toPrice, toUsd } from "../../utils/units"
import { getAssetId, toAsset } from "../../utils/asset"
import { useChai } from "../../utils/chai"
import { BigNumber } from "ethers"
import { BTC_MAX_LEVERAGE, getBtcConfig, getDaiConfig } from "../../utils/vault"
import { WALLETS } from "../../utils/wallets"
import { getPosition } from "../../utils/contract"
import { BNB_PRICEFEED_ID, BTC_PRICEFEED_ID, DAI_PRICEFEED_ID, getUpdatePriceDataCall } from "../../utils/mock-pyth"

use(useChai)

describe("Vault.liquidateLongPosition", () => {
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

    it("liquidate long", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(vault.functions.set_liquidator(addrToIdentity(user0), true))
        await expect(
            call(
                vault
                    .connect(user0)
                    .functions.liquidate_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, addrToIdentity(user2))
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultEmptyPosition")

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(1)))
        await call(BTC.functions.mint(addrToIdentity(user1), expandDecimals(1)))

        await call(
            vault
                .as(user1)
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    // 0.0025 BTC => 100 USD
                    forward: [250000 * 10, getAssetId(BTC)],
                }),
        )

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(1)))

        await call(
            vault
                .connect(user0)
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(90), true)
                .addContracts(attachedContracts)
                .callParams({
                    // 0.00025 BTC => 10 USD
                    forward: [25000 * 10, getAssetId(BTC)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq(toUsd(9.9))
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("2252252")

        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, false),
                ),
            )[0],
        ).eq("0")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(43500), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(43500), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(43500), vaultPricefeed, priceUpdateSigner))

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("7679445554445554445554445554445")
        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, false),
                ),
            )[0],
        ).eq("0")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39000), vaultPricefeed, priceUpdateSigner))
        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("2425324675324675324675324675324")
        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, false),
                ),
            )[0],
        ).eq("0")

        await call(vault.functions.set_liquidator(addrToIdentity(deployer), true))
        await expect(
            call(
                vault.functions
                    .liquidate_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, addrToIdentity(user2))
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultCannotBeLiquidated")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(37000), vaultPricefeed, priceUpdateSigner))
        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("6916333666333666333666333666333")
        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, false),
                ),
            )[0],
        ).eq("1")

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq(toUsd(9.9))
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("2252252")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("9747")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("2252252")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq(toUsd(80.1))
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2740253")
        expect(await getBalance(user2, BTC)).eq("0")

        await expect(
            call(
                vault
                    .connect(user1)
                    .functions.liquidate_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, addrToIdentity(user2))
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultInvalidLiquidator")

        expect(await getValue(vault.functions.is_liquidator(addrToIdentity(user1)))).eq(false)
        await call(vault.functions.set_liquidator(addrToIdentity(user1), true))
        expect(await getValue(vault.functions.is_liquidator(addrToIdentity(user1)))).eq(true)

        await call(
            vault
                .connect(user1)
                .functions.liquidate_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, addrToIdentity(user2))
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq("0")
        expect(position.collateral).eq("0")
        expect(position.average_price).eq("0")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("0")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("12177")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2602823")
        expect(await getBalance(user2, BTC)).eq("135000")

        expect(await getBalance(user2, BTC))

        expect(await getBalance(vault, BTC, utils)).eq("2615000")

        const balance = BigNumber.from(await getBalance(vault, BTC, utils))
        const poolAmount = BigNumber.from(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC))))
        const feeReserve = BigNumber.from(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC))))
        expect(poolAmount.add(feeReserve).sub(balance).toString()).eq("0")

        await call(vault.functions.withdraw_fees(toAsset(BTC), addrToIdentity(user0)).addContracts(attachedContracts))

        // await call(BTC.functions.mint(contrToIdentity(vault), 1000))
        await call(
            vault
                .as(user0)
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [1000, getAssetId(BTC)],
                }),
        )
    })

    it("automatic stop-loss", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40333), vaultPricefeed, priceUpdateSigner))

        await call(vault.functions.set_liquidator(addrToIdentity(user0), true))
        await expect(
            call(
                vault
                    .connect(user0)
                    .functions.liquidate_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, addrToIdentity(user2))
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultEmptyPosition")

        await call(BTC.functions.mint(addrToIdentity(user1), expandDecimals(1)))
        await call(
            vault
                .as(user1)
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    // 0.05 BTC => 2000 USD
                    forward: [5000000 * 10, getAssetId(BTC)],
                }),
        )

        await call(BTC.functions.mint(addrToIdentity(user1), expandDecimals(1)))
        await call(BTC.functions.mint(addrToIdentity(user0), 250000 * 10))
        await call(
            vault
                .connect(user0)
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(1000), true)
                .callParams({
                    // 0.0025 BTC => 100 USD
                    forward: [250000 * 10, getAssetId(BTC)],
                })
                .addContracts(attachedContracts),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(1000))
        expect(position.collateral).eq("99731667500000000000000000000000")
        expect(position.average_price).eq("40373333000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("24818411")

        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, false),
                ),
            )[0],
        ).eq("0")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(43500), vaultPricefeed, priceUpdateSigner))

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("76366422361017357670222569932484")
        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, false),
                ),
            )[0],
        ).eq("0")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(42000), vaultPricefeed, priceUpdateSigner))

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("39250338831327103957456274417571")

        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, false),
                ),
            )[0],
        ).eq("0")

        await call(vault.functions.set_liquidator(addrToIdentity(deployer), true))
        await expect(
            call(
                vault.functions
                    .liquidate_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, addrToIdentity(user2))
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultCannotBeLiquidated")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(38000), vaultPricefeed, priceUpdateSigner))

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("59725883914513572609920513622197")
        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, false),
                ),
            )[0],
        ).eq("0")

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(1000))
        expect(position.collateral).eq("99731667500000000000000000000000")
        expect(position.average_price).eq("40373333000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("24818411")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("174768")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("24818411")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq("900268332500000000000000000000000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("52325232")
        expect(await getBalance(deployer, BTC)).eq("0")
        expect(await getBalance(user0, BTC)).eq("0")
        expect(await getBalance(user1, BTC)).eq("1950000000")
        expect(await getBalance(user2, BTC)).eq("0")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(36000), vaultPricefeed, priceUpdateSigner))
        await call(
            vault.functions
                .liquidate_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, addrToIdentity(user2))
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq("0")
        expect(position.collateral).eq("0")
        expect(position.average_price).eq("0")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("0")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("202518")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("52158732")
        expect(await getBalance(deployer, BTC)).eq("0")
        expect(await getBalance(user0, BTC)).eq("0")
        expect(await getBalance(user1, BTC)).eq("1950000000")
        expect(await getBalance(user2, BTC)).eq("138750")

        expect(await getBalance(vault, BTC, utils)).eq("52361250")

        const balance = BigNumber.from(await getBalance(vault, BTC, utils))
        const poolAmount = BigNumber.from(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC))))
        const feeReserve = BigNumber.from(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC))))
        expect(poolAmount.add(feeReserve).sub(balance).toString()).eq("0")

        await call(vault.functions.withdraw_fees(toAsset(BTC), addrToIdentity(user0)).addContracts(attachedContracts))

        // await call(BTC.functions.mint(contrToIdentity(vault), 1000))
        await call(
            vault
                .as(user0)
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [1000, getAssetId(BTC)],
                }),
        )
    })
})
