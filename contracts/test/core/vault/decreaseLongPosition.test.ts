import { expect, use } from "chai"
import { AbstractContract, Provider, Signer, Wallet, WalletUnlocked } from "fuels"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import { Fungible, Rlp, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault } from "../../../types"
import { deploy, getBalance, getValue, getValStr, formatObj, call } from "../../utils/utils"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { asStr, expandDecimals, toNormalizedPrice, toPrice, toUsd } from "../../utils/units"
import { getAssetId, toAsset } from "../../utils/asset"
import { useChai } from "../../utils/chai"
import {
    BNB_MAX_LEVERAGE,
    BTC_MAX_LEVERAGE,
    DAI_MAX_LEVERAGE,
    getBnbConfig,
    getBtcConfig,
    getDaiConfig,
    validateVaultBalance,
} from "../../utils/vault"
import { getPosition, getPositionLeverage } from "../../utils/contract"
import { BNB_PRICEFEED_ID, BTC_PRICEFEED_ID, DAI_PRICEFEED_ID, getUpdatePriceDataCall } from "../../utils/mock-pyth"
import { launchNode, getNodeWallets } from "../../utils/node"

use(useChai)

describe("Vault.decreaseLongPosition", () => {
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

    it("decreasePosition long", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await expect(
            call(
                vault_user1
                    .functions.decrease_position(
                        addrToIdentity(user0),
                        toAsset(BTC),
                        toAsset(BTC),
                        0,
                        0,
                        true,
                        addrToIdentity(user2),
                    )
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultInvalidMsgCaller")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await expect(
            call(
                vault_user0
                    .functions.decrease_position(
                        addrToIdentity(user0),
                        toAsset(BTC),
                        toAsset(BTC),
                        0,
                        toUsd(1000),
                        true,
                        addrToIdentity(user2),
                    )
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultEmptyPosition")

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

        // test that minProfitBasisPoints works as expected
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000 - 1), vaultPricefeed, priceUpdateSigner))
        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("2063438811188811188811188811188")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000 + 307), vaultPricefeed, priceUpdateSigner)) // 41000 * 0.75% => 307.5)
        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("2755054195804195804195804195804")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000 + 308), vaultPricefeed, priceUpdateSigner))
        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("2757299700299700299700299700299")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(45100), vaultPricefeed, priceUpdateSigner))

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("11272252747252747252747252747252")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(46100), vaultPricefeed, priceUpdateSigner))
        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("13517757242757242757242757242757")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(47100), vaultPricefeed, priceUpdateSigner))
        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("15763261738261738261738261738261")

        let leverage = await getPositionLeverage(vault, addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)

        expect(leverage).eq("90909") // ~9X leverage

        await expect(
            call(
                vault_user0
                    .functions.decrease_position(
                        addrToIdentity(user0),
                        toAsset(BTC),
                        toAsset(BTC),
                        0,
                        toUsd(100),
                        true,
                        addrToIdentity(user2),
                    )
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultSizeExceeded")

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
        expect(position.realized_pnl.value).eq("8757367632367632367632367632367")
        expect(position.realized_pnl.is_neg).eq(false)

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("10807")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("1001001")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq(toUsd(33.1))
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2490877")
        expect((await user2.getBalance(getAssetId(BTC))).toString()).eq("248315")

        await validateVaultBalance(expect, vault, BTC, 1)
    })

    it("decreasePosition long aum", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(500), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(500), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(500), vaultPricefeed, priceUpdateSigner))

        await call(BNB.functions.mint(addrToIdentity(deployer), expandDecimals(10)))
        await call(
            vault.functions
                .buy_rusd(toAsset(BNB), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(10), getAssetId(BNB)],
                }),
        )

        await call(BNB.functions.mint(addrToIdentity(deployer), expandDecimals(1)))
        await call(BNB.functions.mint(addrToIdentity(user0), expandDecimals(1)))
        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BNB), toAsset(BNB), toUsd(1000), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(1), getAssetId(BNB)],
                }),
        )

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(750), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(750), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(750), vaultPricefeed, priceUpdateSigner))

        await call(
            vault_user0
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BNB),
                    toAsset(BNB),
                    toUsd(0),
                    toUsd(500),
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
                    toUsd(250),
                    toUsd(100),
                    true,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )
    })

    it("decreasePosition long minProfitBasisPoints", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await expect(
            call(
                vault_user1
                    .functions.decrease_position(
                        addrToIdentity(user0),
                        toAsset(BTC),
                        toAsset(BTC),
                        0,
                        0,
                        true,
                        addrToIdentity(user2),
                    )
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultInvalidMsgCaller")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await expect(
            call(
                vault_user0
                    .functions.decrease_position(
                        addrToIdentity(user0),
                        toAsset(BTC),
                        toAsset(BTC),
                        0,
                        toUsd(1000),
                        true,
                        addrToIdentity(user2),
                    )
                    .addContracts(attachedContracts),
            ),
        ).to.be.revertedWith("VaultEmptyPosition")

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

        // test that minProfitBasisPoints works as expected
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000 - 1), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000 - 1), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000 - 1), vaultPricefeed, priceUpdateSigner))
        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("2063438811188811188811188811188")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000 + 307), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000 + 307), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000 + 307), vaultPricefeed, priceUpdateSigner))
        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("2755054195804195804195804195804")
    })

    it("decreasePosition long with loss", async () => {
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

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40790), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40690), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40590), vaultPricefeed, priceUpdateSigner))

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("9747")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("2252252")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq(toUsd(80.1))
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2740253")
        expect((await user2.getBalance(getAssetId(BTC))).toString()).eq("0")

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("1145027472527472527472527472527")

        await call(
            vault_user0
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BTC),
                    toAsset(BTC),
                    toUsd(0),
                    toUsd(50),
                    true,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(40))
        expect(position.collateral).eq("9900000000000000000000000000000")
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("1001001")
        expect(position.realized_pnl.value).eq("636126373626373626373626373626")
        expect(position.realized_pnl.is_neg).eq(false)

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("10977")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("1001001")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq("30100000000000000000000000000000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2724597")
        expect((await user2.getBalance(getAssetId(BTC))).toString()).eq("14425")

        await call(
            vault_user0
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BTC),
                    toAsset(BTC),
                    toUsd(0),
                    toUsd(40),
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

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("11961")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2468414")
        expect((await user2.getBalance(getAssetId(BTC))).toString()).eq("269624")

        await validateVaultBalance(expect, vault, BTC, 1)
    })

    it("decreasePosition negative collateral", async () => {
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

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(80000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(80000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(80000), vaultPricefeed, priceUpdateSigner))

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("9747")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("2252252")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq(toUsd(80.1))
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2740253")
        expect((await user2.getBalance(getAssetId(BTC))).toString()).eq("0")

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("89640359640359640359640359640359")

        expect(await getValStr(vault.functions.get_cumulative_funding_rate(toAsset(BTC)))).eq("0")

        // await increaseTime(provider, 100 * 24 * 60 * 60)

        // await  call(vault.functions.update_cumulative_funding_rate(toAsset(BTC), toAsset(BTC)))
        // expect(await getValStr(vault.functions.get_cumulative_funding_rate(toAsset(BTC)))).eq("147796")

        // @TODO: this doesn't revert for some reason
        // await expect(call(
        //     vault
        //         .connect(user0)
        //         .functions.decrease_position(
        //             toAddress(user0),
        //             toAsset(BTC),
        //             toAsset(BTC),
        //             0,
        //             toUsd(10),
        //             true,
        //             addrToIdentity(user2),
        //         )
        // .addContracts(attachedContracts)
        // ).to.be.revertedWith("ArithmeticOverflow")

        await call(
            vault_user0
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BTC),
                    toAsset(BTC),
                    0,
                    toUsd(50),
                    true,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(40))
        expect(position.collateral).eq(toUsd(9.9))
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("1001001")
        expect(position.realized_pnl.value).eq("49800199800199800199800199800199")
        expect(position.realized_pnl.is_neg).eq(false)

        await validateVaultBalance(expect, vault, BTC)
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
