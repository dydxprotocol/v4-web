import { expect, use } from "chai"
import { AbstractContract, assets, Provider, Signer, Wallet, WalletUnlocked, AssetId } from "fuels"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import { Fungible, Rlp, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault } from "../../../types"
import { deploy, getBalance, getValue, getValStr, formatObj, call } from "../../utils/utils"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { expandDecimals, toPrice, toUsd } from "../../utils/units"
import { getAssetId, toAsset } from "../../utils/asset"
import { useChai } from "../../utils/chai"
import {
    BTC_MAX_LEVERAGE,
    ETH_MAX_LEVERAGE,
    getBtcConfig,
    getDaiConfig,
    getEthConfig,
    validateVaultBalance,
} from "../../utils/vault"
import { WALLETS } from "../../utils/wallets"
import { getPosition, getPositionLeverage } from "../../utils/contract"
import {
    BNB_PRICEFEED_ID,
    BTC_PRICEFEED_ID,
    DAI_PRICEFEED_ID,
    ETH_PRICEFEED_ID,
    getUpdatePriceDataCall,
} from "../../utils/mock-pyth"

import { launchNode, getNodeWallets } from "../../utils/node"

use(useChai)

describe("Vault.averagePrice", () => {
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
    let ETH: Fungible
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
        launchedNode = await launchNode()
        ;[ deployer, user0, user1, user2, user3 ] = getNodeWallets(launchedNode)
          
        priceUpdateSigner = new Signer(deployer.privateKey)

        /*
            NativeAsset + Pricefeed
        */
        BNB = await deploy("Fungible", deployer)
        ETH = await deploy("Fungible", deployer)
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
        await call(vaultPricefeed.functions.set_asset_config(toAsset(ETH), ETH_PRICEFEED_ID, 9))
        await call(vaultPricefeed.functions.set_asset_config(toAsset(DAI), DAI_PRICEFEED_ID, 9))
        await call(vaultPricefeed.functions.set_asset_config(toAsset(BTC), BTC_PRICEFEED_ID, 9))

        await call(
            vault.functions.set_fees(
                50, // tax_basis_points
                20, // stable_tax_basis_points
                30, // mint_burn_fee_basis_points
                30, // swap_fee_basis_points
                4, // stable_swap_fee_basis_points
                10, // margin_fee_basis_points
                toUsd(5), // liquidation_fee_usd
                60 * 60, // min_profit_time
                false, // has_dynamic_fees
            ),
        )

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

    it("position.averagePrice, buyPrice < averagePrice", async () => {
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

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(36900), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(36900), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(36900), vaultPricefeed, priceUpdateSigner))

        let leverage = await getPositionLeverage(vault, addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)
        expect(leverage).eq("90909") // ~9X leverage
        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("9747")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("2252252")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq(toUsd(80.1))
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2740253")
        expect((await user2.getBalance(getAssetId(BTC))).toString()).eq("0")

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("7140884115884115884115884115884")

        await expect(
            call(
                vault_user0
                    .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(90), true)
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultLiquidationFeesExceedCollateral")

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(10), true)
                .addContracts(attachedContracts)
                .callParams({
                    // 0.00025 BTC => 10 USD
                    forward: [25000 * 10, getAssetId(BTC)],
                }),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(100))
        expect(position.collateral).eq("19105775000000000000000000000000")
        expect(position.average_price).eq("39777354811449676028938599744653035")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("2523525")

        leverage = await getPositionLeverage(vault, addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)
        expect(leverage).eq("52340") // ~5.2X leverage

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("10017")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("2523525")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq("80894225000000000000000000000000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2989983")
        expect((await user2.getBalance(getAssetId(BTC))).toString()).eq("0")

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("7326416814953278489742026205562")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("2970647983385246122508859771597") // ~1.111

        await validateVaultBalance(expect, vault, BTC)
    })

    it("long position.averagePrice, buyPrice == averagePrice", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(BTC.functions.mint(addrToIdentity(user1), expandDecimals(1)))
        await call(
            vault_user1
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [250000 * 10, getAssetId(BTC)],
                }),
        )

        await call(BTC.functions.mint(addrToIdentity(user1), expandDecimals(1)))
        await call(BTC.functions.mint(addrToIdentity(user0), 25000 * 10))
        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(90), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [25000 * 10, getAssetId(BTC)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq(toUsd(9.9))
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("2252252")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("179820179820179820179820179820")

        await call(BTC.functions.mint(addrToIdentity(user0), 25000 * 10))
        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(10), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [25000 * 10, getAssetId(BTC)],
                }),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(100))
        expect(position.collateral).eq("19880000000000000000000000000000")
        expect(position.average_price).eq("40112129703763010408326661329063178")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("2502502")

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("379261098541817822537103256383")

        await validateVaultBalance(expect, vault, BTC)
    })

    it("long position.averagePrice, buyPrice > averagePrice", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(BTC.functions.mint(addrToIdentity(user1), expandDecimals(1)))
        await call(
            vault_user1
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    // 0.0025 BTC => 100 USD
                    forward: [25000 * 10 * 10, getAssetId(BTC)],
                }),
        )

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(1)))
        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(90), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [25000 * 10, getAssetId(BTC)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq(toUsd(9.9))
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("2252252")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("22275224775224775224775224775224")

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(10), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [25000 * 10, getAssetId(BTC)],
                }),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(100))
        expect(position.average_price).eq("40932249433199207500153189403378596")

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("22030918631817732716833615934514")

        await validateVaultBalance(expect, vault, BTC)
    })

    it("long position.averagePrice, buyPrice < averagePrice", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
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
        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(90), true)
                .addContracts(attachedContracts)
                .callParams({
                    // 0.000125 BTC => 50 USD
                    forward: [125000 * 10, getAssetId(BTC)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq("49860000000000000000000000000000")
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("2252252")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(30000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(30000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(30000), vaultPricefeed, priceUpdateSigner))

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("22634865134865134865134865134865")

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(10), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [25000 * 10, getAssetId(BTC)],
                }),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(100))
        expect(position.average_price).eq("38815934402944119830842237789327497")

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("22789440828901368361907822447282")
    })

    it("long position.averagePrice, buyPrice < averagePrice + minProfitBasisPoints", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
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
        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(90), true)
                .addContracts(attachedContracts)
                .callParams({
                    // 0.000125 BTC => 50 USD
                    forward: [125000 * 10, getAssetId(BTC)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq("49860000000000000000000000000000")
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("2252252")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40300), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40300), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40300), vaultPricefeed, priceUpdateSigner))

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("0")

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(10), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [25000 * 10, getAssetId(BTC)],
                }),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(100))
        expect(position.average_price).eq("40340300000000000000000000000000000")

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("199800199800199800199800199800")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("1533702029979945612699955131716")
    })

    it("short position.averagePrice, buyPrice == averagePrice", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(DAI.functions.mint(addrToIdentity(user1), expandDecimals(101)))
        await call(
            vault_user1
                .functions.buy_rusd(toAsset(DAI), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(101), getAssetId(DAI)],
                }),
        )

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(50)))
        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(90), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(50), getAssetId(DAI)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq("49860000000000000000000000000000")
        expect(position.average_price).eq("39960000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("90090090090")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("180180180180180180180180180180")

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(10), false)
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(100))
        expect(position.collateral).eq("49850000000000000000000000000000")
        expect(position.average_price).eq("39888129496402877697841726618705107")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("100100100100")

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("380741101461822182542903263623")
    })

    it("short position.averagePrice, buyPrice > averagePrice", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(DAI.functions.mint(addrToIdentity(user1), expandDecimals(101)))
        await call(
            vault_user1
                .functions.buy_rusd(toAsset(DAI), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(101), getAssetId(DAI)],
                }),
        )

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(50)))
        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(90), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(50), getAssetId(DAI)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq("49860000000000000000000000000000")
        expect(position.average_price).eq("39960000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("90090090090")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("22725225225225225225225225225225") // 22.5

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(10), false)
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(100))
        expect(position.collateral).eq("49850000000000000000000000000000")
        expect(position.average_price).eq("40700679023674068636447054505413912")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("100100100100")

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("22970921371822272723173624074524")
    })

    it("short position.averagePrice, buyPrice < averagePrice", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(DAI.functions.mint(addrToIdentity(user1), expandDecimals(101)))
        await call(
            vault_user1
                .functions.buy_rusd(toAsset(DAI), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(101), getAssetId(DAI)],
                }),
        )

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(50)))
        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(90), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(50), getAssetId(DAI)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq("49860000000000000000000000000000")
        expect(position.average_price).eq("39960000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("90090090090")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(30000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(30000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(30000), vaultPricefeed, priceUpdateSigner))

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("22364864864864864864864864864864") // 22.5

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(10), false)
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(100))
        expect(position.collateral).eq("49850000000000000000000000000000")
        expect(position.average_price).eq("38603655352480417754569190600521763")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("100100100100")

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("22209439168898628358087817547276") // ~22.5
    })

    it("short position.averagePrice, buyPrice < averagePrice - minProfitBasisPoints", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(DAI.functions.mint(addrToIdentity(user1), expandDecimals(101)))
        await call(
            vault_user1
                .functions.buy_rusd(toAsset(DAI), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(101), getAssetId(DAI)],
                }),
        )

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(50)))
        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(90), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(50), getAssetId(DAI)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq("49860000000000000000000000000000")
        expect(position.average_price).eq("39960000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("90090090090")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39700), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39700), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39700), vaultPricefeed, priceUpdateSigner))

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("0") // 22.5

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(10), false)
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(100))
        expect(position.collateral).eq("49850000000000000000000000000000")
        expect(position.average_price).eq("39660300000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("100100100100")

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("200200200200200200200200200200") // ~22.5

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39000), vaultPricefeed, priceUpdateSigner))

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("1566553959501062775621969576629") // (39700 - 39000) / 39700 * 100 => 1.7632
    })

    it("long position.averagePrice, buyPrice < averagePrice 2", async () => {
        await call(getUpdatePriceDataCall(toAsset(ETH), "2513825607870", vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getEthConfig(ETH)))
        await call(vault.functions.set_max_leverage(toAsset(ETH), ETH_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(ETH), "2521450375360", vaultPricefeed, priceUpdateSigner))

        await call(ETH.functions.mint(addrToIdentity(user1), expandDecimals(10)))
        await call(
            vault_user1
                .functions.buy_rusd(toAsset(ETH), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(10), getAssetId(ETH)],
                }),
        )

        await call(ETH.functions.mint(addrToIdentity(user0), expandDecimals(1)))
        await call(
            vault_user0
                .functions.increase_position(
                    addrToIdentity(user0),
                    toAsset(ETH),
                    toAsset(ETH),
                    "5050322181222357947081599665915068",
                    true,
                )
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(1), getAssetId(ETH)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(ETH), toAsset(ETH), true, vault))
        expect(position.size).eq("5050322181222357947081599665915068")
        expect(position.collateral).eq("2513878602803777642052918400334084")
        expect(position.average_price).eq("2523971825735000000000000000000000")
        expect(position.entry_funding_rate).eq("0")

        await call(getUpdatePriceDataCall(toAsset(ETH), "2373235025390", vaultPricefeed, priceUpdateSigner))

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(ETH), toAsset(ETH), true)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("306364357918960910762951184573412")

        await call(ETH.functions.mint(addrToIdentity(user0), expandDecimals(1)))
        await call(
            vault_user0
                .functions.increase_position(
                    addrToIdentity(user0),
                    toAsset(ETH),
                    toAsset(ETH),
                    "4746470050780000000000000000000000",
                    true,
                )
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(1), getAssetId(ETH)],
                }),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(ETH), toAsset(ETH), true, vault))
        expect(position.size).eq("9796792232002357947081599665915068")
        expect(position.average_price).eq("2452296235817722670635628923178700")
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
