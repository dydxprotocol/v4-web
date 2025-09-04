import { expect, use } from "chai"
import { AbstractContract, Provider, Signer, Wallet, WalletUnlocked } from "fuels"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import { Fungible, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault } from "../../../types"
import { deploy, getBalance, getValue, getValStr, formatObj, call } from "../../utils/utils"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { expandDecimals, toNormalizedPrice, toPrice, toUsd } from "../../utils/units"
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
import { getPosition } from "../../utils/contract"
import { BNB_PRICEFEED_ID, BTC_PRICEFEED_ID, DAI_PRICEFEED_ID, getUpdatePriceDataCall } from "../../utils/mock-pyth"
import { launchNode, getNodeWallets } from "../../utils/node"

use(useChai)

describe("Vault.liquidateShortPosition", function () {
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
    let vault_user0: Vault
    let vault_user1: Vault
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

    it("liquidate short", async () => {
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

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(vault.functions.set_liquidator(addrToIdentity(user0), true))
        await expect(
            call(
                vault_user0
                    .functions.liquidate_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, addrToIdentity(user2))
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultEmptyPosition")

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq("0")

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(1000)))
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(DAI), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), getAssetId(DAI)],
                }),
        )

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(90), false)
                .callParams({
                    forward: [expandDecimals(10), getAssetId(DAI)],
                })
                .addContracts(attachedContracts),
        )
        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq(toUsd(9.9))
        expect(position.average_price).eq("39960000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("90090090090")

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq(toUsd(90))
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq(
            "39960000000000000000000000000000000",
        )

        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, false),
                ),
            )[0],
        ).eq("0")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39000), vaultPricefeed, priceUpdateSigner))

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("2074324324324324324324324324324")
        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, false),
                ),
            )[0],
        ).eq("0")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("2434684684684684684684684684684")
        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, false),
                ),
            )[0],
        ).eq("0")

        await call(vault.functions.set_liquidator(addrToIdentity(deployer), true))
        await expect(
            call(
                vault.functions
                    .liquidate_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, addrToIdentity(user2))
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultCannotBeLiquidated")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(42500), vaultPricefeed, priceUpdateSigner))

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("5816441441441441441441441441441")
        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, false),
                ),
            )[0],
        ).eq("1")

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq(toUsd(9.9))
        expect(position.average_price).eq("39960000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("90090090090")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("129910089")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(DAI)))).eq("90090090090")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("99960000000")
        expect((await user2.getBalance(getAssetId(DAI))).toString()).eq("0")

        await call(vault.functions.set_liquidator(addrToIdentity(deployer), true))
        await call(
            vault.functions
                .liquidate_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, addrToIdentity(user2))
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq("0")
        expect(position.collateral).eq("0") // collateral
        expect(position.average_price).eq("0")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("0")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("219820178")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("104765194805")
        expect((await user2.getBalance(getAssetId(DAI))).toString()).eq("4995004995")

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq(
            "39960000000000000000000000000000000",
        )

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))

        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(100), false)
                .callParams({
                    forward: [expandDecimals(20), getAssetId(DAI)],
                })
                .addContracts(attachedContracts),
        )

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq(toUsd(100))
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq(
            "49950000000000000000000000000000000",
        )
    })

    it("automatic stop-loss", async () => {
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

        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40333), vaultPricefeed, priceUpdateSigner))

        await call(vault.functions.set_liquidator(addrToIdentity(user0), true))
        await expect(
            call(
                vault_user0
                    .functions.liquidate_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, addrToIdentity(user2))
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultEmptyPosition")

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq("0")

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(1002)))
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(DAI), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(1002), getAssetId(DAI)],
                }),
        )

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(100)))
        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(1000), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), getAssetId(DAI)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(1000))
        expect(position.collateral).eq(toUsd(98.9))
        expect(position.average_price).eq("40292667000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("1001001001001")

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq(toUsd(1000))
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq(
            "40292667000000000000000000000000000",
        )

        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, false),
                ),
            )[0],
        ).eq("0")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39000), vaultPricefeed, priceUpdateSigner))

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("31114023799913765946543076932584")
        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, false),
                ),
            )[0],
        ).eq("0")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("18572436518039374261326508865744")
        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, false),
                ),
            )[0],
        ).eq("0")

        await call(vault.functions.set_liquidator(addrToIdentity(deployer), true))
        await expect(
            call(
                vault.functions
                    .liquidate_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, addrToIdentity(user2))
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultCannotBeLiquidated")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(45000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(45000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(45000), vaultPricefeed, priceUpdateSigner))
        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("117945357153945654677065680462402")
        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, false),
                ),
            )[0],
        ).eq("1")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(43600), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(43600), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(43600), vaultPricefeed, priceUpdateSigner))
        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("83164834931378456531556970403572")
        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, false),
                ),
            )[0],
        ).eq("2")

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(1000))
        expect(position.collateral).eq("98900000000000000000000000000000")
        expect(position.average_price).eq("40292667000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("1001001001001")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("1399800999")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(DAI)))).eq("1001001001001")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(DAI)))).eq("0")

        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("1001599200000")
        expect((await deployer.getBalance(getAssetId(DAI))).toString()).eq("0")
        expect((await user0.getBalance(getAssetId(DAI))).toString()).eq("0")
        expect((await user1.getBalance(getAssetId(DAI))).toString()).eq("0")
        expect((await user2.getBalance(getAssetId(DAI))).toString()).eq("0")
        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq(toUsd(1000))
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq(
            "40292667000000000000000000000000000",
        )

        await call(vault.functions.set_liquidator(addrToIdentity(deployer), true))
        await call(
            vault.functions
                .liquidate_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, addrToIdentity(user2))
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq("0")
        expect(position.collateral).eq("0") // collateral
        expect(position.average_price).eq("0")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("0")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("2398801998")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("1084680953178")
        expect((await deployer.getBalance(getAssetId(DAI))).toString()).eq("0")
        expect((await user0.getBalance(getAssetId(DAI))).toString()).eq("14720444623")
        expect((await user1.getBalance(getAssetId(DAI))).toString()).eq("0")
        expect((await user2.getBalance(getAssetId(DAI))).toString()).eq("0")

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq(
            "40292667000000000000000000000000000",
        )

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(20)))
        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(100), false)
                .callParams({
                    forward: [expandDecimals(20), getAssetId(DAI)],
                })
                .addContracts(attachedContracts),
        )

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq(toUsd(100))
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq(
            "49950000000000000000000000000000000",
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
    })

    it("global AUM", async () => {
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

        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40333), vaultPricefeed, priceUpdateSigner))

        await call(vault.functions.set_liquidator(addrToIdentity(user0), true))
        await expect(
            call(
                vault_user0
                    .functions.liquidate_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, addrToIdentity(user2))
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultEmptyPosition")

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq("0")

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(1002)))
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(DAI), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(1002), getAssetId(DAI)],
                }),
        )

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(100)))
        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(1000), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), getAssetId(DAI)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(1000))
        expect(position.collateral).eq("98900000000000000000000000000000")
        expect(position.average_price).eq("40292667000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("1001001001001")

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq(toUsd(1000))
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq(
            "40292667000000000000000000000000000",
        )

        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, false),
                ),
            )[0],
        ).eq("0")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39000), vaultPricefeed, priceUpdateSigner))

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("31114023799913765946543076932584")
        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, false),
                ),
            )[0],
        ).eq("0")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("18572436518039374261326508865744")
        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, false),
                ),
            )[0],
        ).eq("0")

        await call(vault.functions.set_liquidator(addrToIdentity(deployer), true))
        await expect(
            call(
                vault.functions
                    .liquidate_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, addrToIdentity(user2))
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultCannotBeLiquidated")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(45000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(45000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(45000), vaultPricefeed, priceUpdateSigner))
        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("117945357153945654677065680462402")
        expect(
            formatObj(
                await getValue(
                    vault.functions.validate_liquidation(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, false),
                ),
            )[0],
        ).eq("1")

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(1000))
        expect(position.collateral).eq(toUsd(98.9))
        expect(position.average_price).eq("40292667000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("1001001001001")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("1399800999")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(DAI)))).eq("1001001001001")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("1001599200000")
        expect((await deployer.getBalance(getAssetId(DAI))).toString()).eq("0")
        expect((await user0.getBalance(getAssetId(DAI))).toString()).eq("0")
        expect((await user1.getBalance(getAssetId(DAI))).toString()).eq("0")
        expect((await user2.getBalance(getAssetId(DAI))).toString()).eq("0")
        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq(toUsd(1000))
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq(
            "40292667000000000000000000000000000",
        )

        await call(vault.functions.set_liquidator(addrToIdentity(deployer), true))
        await call(
            vault.functions
                .liquidate_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, addrToIdentity(user2))
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq("0")
        expect(position.collateral).eq("0") // collateral
        expect(position.average_price).eq("0")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("0")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("2398801998")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("1094406392807")
        expect((await deployer.getBalance(getAssetId(DAI))).toString()).eq("0")
        expect((await user0.getBalance(getAssetId(DAI))).toString()).eq("0")
        expect((await user1.getBalance(getAssetId(DAI))).toString()).eq("0")
        expect((await user2.getBalance(getAssetId(DAI))).toString()).eq("4995004995")

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq(
            "40292667000000000000000000000000000",
        )

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(20)))
        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(100), false)
                .callParams({
                    forward: [expandDecimals(20), getAssetId(DAI)],
                })
                .addContracts(attachedContracts),
        )

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq(toUsd(100))
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq(
            "49950000000000000000000000000000000",
        )
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
