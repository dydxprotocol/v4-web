import { expect, use } from "chai"
import { AbstractContract, Provider, Signer, Wallet, WalletUnlocked } from "fuels"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import { Fungible, Rlp, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault, RlpManager } from "../../../types"
import { deploy, getValue, getValStr, formatObj, call } from "../../utils/utils"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { expandDecimals, toNormalizedPrice, toPrice, toUsd } from "../../utils/units"
import { getAssetId, toAsset } from "../../utils/asset"
import { useChai } from "../../utils/chai"
import { BigNumber } from "ethers"
import { BNB_MAX_LEVERAGE, BTC_MAX_LEVERAGE, DAI_MAX_LEVERAGE, getBnbConfig, getBtcConfig, getDaiConfig } from "../../utils/vault"
import { getPosition } from "../../utils/contract"
import { BNB_PRICEFEED_ID, BTC_PRICEFEED_ID, DAI_PRICEFEED_ID, getUpdatePriceDataCall } from "../../utils/mock-pyth"
import { launchNode, getNodeWallets } from "../../utils/node"

use(useChai)

describe("Vault.increaseShortPosition", function () {
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
    let vault_user2: Vault
    let vault_user3: Vault
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
            vault.functions.set_funding_rate(
                8 * 3600, // funding_interval (8 hours)
                600, // fundingRateFactor
                600, // stableFundingRateFactor
            ),
        )

        await call(rlp.functions.initialize())

        vault_user0 = new Vault(vault.id.toAddress(), user0)
        vault_user1 = new Vault(vault.id.toAddress(), user1)
        vault_user2 = new Vault(vault.id.toAddress(), user2)
        vault_user3 = new Vault(vault.id.toAddress(), user3)
    })

    it("increasePosition short validations", async () => {
        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(300), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))
        await expect(
            vault_user1
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), 0, false)
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultInvalidMsgCaller")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(1000), false)
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultCollateralAssetNotWhitelisted")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(BNB), toAsset(BNB), toUsd(1000), false)
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultShortCollateralAssetMustBeStableAsset")

        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(DAI), toUsd(1000), false)
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultShortIndexAssetMustNotBeStableAsset")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(1000), false)
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultShortIndexAssetNotShortable")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(60000), vaultPricefeed, priceUpdateSigner))
        await call(
            vault.functions.set_asset_config(
                toAsset(BTC), // _token
                8, // _tokenDecimals
                10000, // _tokenWeight
                75, // _minProfitBps
                0, // _maxRusdAmount
                false, // _isStable
                false, // _isShortable
            ),
        )

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(1000), false)
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultShortIndexAssetNotShortable")

        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(50000), vaultPricefeed, priceUpdateSigner))

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(1000), false)
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultInsufficientCollateralForFees")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), 0, false)
                .addContracts(attachedContracts)
                .call(),
        ).to.be.revertedWith("VaultInvalidPositionSize")

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(1000)))

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(1000), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(9, 8), getAssetId(DAI)],
                })
                .call(),
        ).to.be.revertedWith("VaultInsufficientCollateralForFees")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(1000), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [BigNumber.from(expandDecimals(9, 8)).add(expandDecimals(4)).toString(), getAssetId(DAI)],
                })
                .call(),
        ).to.be.revertedWith("VaultLiquidationFeesExceedCollateral")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(100), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [BigNumber.from(expandDecimals(9, 8)).add(expandDecimals(4)).toString(), getAssetId(DAI)],
                })
                .call(),
        ).to.be.revertedWith("VaultLiquidationFeesExceedCollateral")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(8), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [
                        BigNumber.from(expandDecimals(9, 8)).add(expandDecimals(4)).add(expandDecimals(6)).toString(),
                        getAssetId(DAI),
                    ],
                })
                .call(),
        ).to.be.revertedWith("VaultSizeMustBeMoreThanCollateral")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(600), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [
                        BigNumber.from(expandDecimals(9, 8)).add(expandDecimals(4)).add(expandDecimals(6)).toString(),
                        getAssetId(DAI),
                    ],
                })
                .call(),
        ).to.be.revertedWith("VaultMaxLeverageExceeded")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(100), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [
                        BigNumber.from(expandDecimals(9, 8)).add(expandDecimals(4)).add(expandDecimals(6)).toString(),
                        getAssetId(DAI),
                    ],
                })
                .call(),
        ).to.be.revertedWith("VaultReserveExceedsPool")
    })

    it("increasePosition short", async () => {
        await call(vault.functions.set_max_global_short_size(toAsset(BTC), toUsd(300)))

        let globalDelta = formatObj(await getValue(vault.functions.get_global_short_delta(toAsset(BTC))))
        expect(await globalDelta[0]).eq(false)
        expect(await globalDelta[1]).eq("0")

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

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(60000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BNB), toPrice(1000), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getBnbConfig(BNB)))
        await call(vault.functions.set_max_leverage(toAsset(BNB), BNB_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(DAI.functions.mint(addrToIdentity(user0), expandDecimals(1000)))
        await call(DAI.functions.mint(addrToIdentity(user1), expandDecimals(1000)))
        await call(DAI.functions.mint(addrToIdentity(user2), expandDecimals(1000)))

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(99), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(500), getAssetId(DAI)],
                })
                .call(),
        ).to.be.revertedWith("VaultSizeMustBeMoreThanCollateral")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(501), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(500), getAssetId(DAI)],
                })
                .call(),
        ).to.be.revertedWith("VaultReserveExceedsPool")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("0")

        expect(await getValStr(vault.functions.get_redemption_collateral_usd(toAsset(DAI)))).eq("0")
        await call(
            vault_user0
                .functions.buy_rusd(toAsset(DAI), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(500), getAssetId(DAI)],
                }),
        )
        expect(await getValStr(vault.functions.get_redemption_collateral_usd(toAsset(DAI)))).eq(
            "499300200000000000000000000000000",
        )

        globalDelta = formatObj(await getValue(vault.functions.get_global_short_delta(toAsset(BTC))))
        expect(await globalDelta[0]).eq(false)
        expect(await globalDelta[1]).eq("0")

        await expect(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(501), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(20), getAssetId(DAI)],
                })
                .call(),
        ).to.be.revertedWith("VaultReserveExceedsPool")

        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq("0")

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq("0")
        expect(position.collateral).eq("0")
        expect(position.average_price).eq("0") // averagePrice
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("0")
        expect(position.realized_pnl.value).eq("0")
        expect(position.realized_pnl.is_neg).eq(false)
        expect(position.last_increased_time).eq("0") // lastIncreasedTime

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))
        await call(
            vault_user0
                .functions.increase_position(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), toUsd(90), false)
                .callParams({
                    forward: [expandDecimals(20), getAssetId(DAI)],
                })
                .addContracts(attachedContracts),
        )

        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("499800000000")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(DAI)))).eq("90090090090")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(DAI)))).eq("0")
        expect(await getValStr(vault.functions.get_redemption_collateral_usd(toAsset(DAI)))).eq(
            "499300200000000000000000000000000",
        )

        let timestamp = await getValStr(utils.functions.get_unix_timestamp())

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq(toUsd(19.89))
        expect(position.average_price).eq("40959000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("90090090090")
        expect(position.realized_pnl.value).eq("0")
        expect(position.realized_pnl.is_neg).eq(false)
        let lastIncreasedTime = BigNumber.from(position.last_increased_time)
        // timestamp is within a deviation of 2 (actually: 1), so account for that here
        expect(lastIncreasedTime.gte(BigNumber.from(timestamp).sub(2)) && lastIncreasedTime.lte(BigNumber.from(timestamp).add(2)))
            .to.be.true // lastIncreasedTime

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("289910089")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(DAI)))).eq("499300200000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("499800000000")

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq(toUsd(90))
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq(
            "40959000000000000000000000000000000",
        )

        globalDelta = formatObj(await getValue(vault.functions.get_global_short_delta(toAsset(BTC))))
        expect(await globalDelta[0]).eq(false)
        expect(await globalDelta[1]).eq("180180180180180180180180180180")

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("180180180180180180180180180180")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(42000), vaultPricefeed, priceUpdateSigner))

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("2379696769940672379696769940672")

        globalDelta = formatObj(await getValue(vault.functions.get_global_short_delta(toAsset(BTC))))
        expect(await globalDelta[0]).eq(false)
        expect(await globalDelta[1]).eq("2379696769940672379696769940672")

        await call(
            vault_user0
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
        expect(position.collateral).eq("15567946238921848677946238921849")
        expect(position.average_price).eq("40959000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("40040040040")
        expect(position.realized_pnl.value).eq("1322053761078151322053761078151")
        expect(position.realized_pnl.is_neg).eq(true)
        // timestamp is within a deviation of 2 (actually: 1), so account for that here
        expect(lastIncreasedTime.gte(BigNumber.from(timestamp).sub(2)) && lastIncreasedTime.lte(BigNumber.from(timestamp).add(2)))
            .to.be.true // lastIncreasedTime

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("1057643008862521057643008862521")

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(DAI)))).eq("339860138")
        expect(await getValStr(vault.functions.get_rusd_amount(toAsset(DAI)))).eq("499300200000")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(DAI)))).eq("501120733028")

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq(toUsd(40))
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq(
            "40959000000000000000000000000000000",
        )

        globalDelta = formatObj(await getValue(vault.functions.get_global_short_delta(toAsset(BTC))))
        expect(await globalDelta[0]).eq(false)
        expect(await globalDelta[1]).eq("1057643008862521057643008862521")

        await call(DAI.functions.mint(contrToIdentity(vault), expandDecimals(50)))
        await call(
            vault_user1
                .functions.increase_position(addrToIdentity(user1), toAsset(DAI), toAsset(BTC), toUsd(200), false)
                .callParams({
                    forward: [expandDecimals(20), getAssetId(DAI)],
                })
                .addContracts(attachedContracts),
        )

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq(toUsd(240))
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq(
            "41788129554655870445344129554656039",
        )

        globalDelta = formatObj(await getValue(vault.functions.get_global_short_delta(toAsset(BTC))))
        expect(await globalDelta[0]).eq(false)
        expect(await globalDelta[1]).eq("1458043409262921458043409262920")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("80080080080080080080080080080")

        delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user1), toAsset(DAI), toAsset(BTC), false)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("4371037704371037704371037704371")

        globalDelta = formatObj(await getValue(vault.functions.get_global_short_delta(toAsset(BTC))))
        expect(await globalDelta[0]).eq(true)
        expect(await globalDelta[1]).eq("4290957624290957624290957624291")

        await call(DAI.functions.mint(contrToIdentity(vault), expandDecimals(20)))
        await call(
            vault_user2
                .functions.increase_position(addrToIdentity(user2), toAsset(DAI), toAsset(BTC), toUsd(60), false)
                .callParams({
                    forward: [expandDecimals(20), getAssetId(DAI)],
                })
                .addContracts(attachedContracts),
        )

        expect(await getValStr(vault.functions.get_global_short_sizes(toAsset(BTC)))).eq(toUsd(300))
        expect(await getValStr(vault.functions.get_global_short_average_prices(toAsset(BTC)))).eq(
            "41619629032258064516129032258064549",
        )

        globalDelta = formatObj(await getValue(vault.functions.get_global_short_delta(toAsset(BTC))))
        expect(await globalDelta[0]).eq(true)
        expect(await globalDelta[1]).eq("4170837504170837504170837504171")

        await call(DAI.functions.mint(contrToIdentity(vault), expandDecimals(20)))

        await expect(
            vault_user2
                .functions.increase_position(addrToIdentity(user2), toAsset(DAI), toAsset(BTC), toUsd(60), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(20), getAssetId(DAI)],
                })
                .call(),
        ).to.be.revertedWith("VaultMaxShortsExceeded")

        await call(
            vault_user2
                .functions.increase_position(addrToIdentity(user2), toAsset(DAI), toAsset(BNB), toUsd(60), false)
                .callParams({
                    forward: [expandDecimals(20), getAssetId(DAI)],
                })
                .addContracts(attachedContracts),
        )
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
