import { expect, use } from "chai"
import { useChai } from "../../utils/chai"
import { AbstractContract, assets, Provider, Signer, Wallet, WalletUnlocked, AssetId } from "fuels"
import { launchNode, getNodeWallets } from "../../utils/node"
import { deploy, getBalance, getValue, getValStr, formatObj, call } from "../../utils/utils"
import { getAssetId, toAsset } from "../../utils/asset"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import { Fungible, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault } from "../../../types"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { BNB_PRICEFEED_ID, BTC_PRICEFEED_ID, USDC_PRICEFEED_ID, getUpdatePriceDataCall } from "../../utils/mock-pyth"
import { BTC_MAX_LEVERAGE, getBtcConfig, validateVaultBalance, getUsdcConfig } from "../../utils/vault"
import { asStr, expandDecimals, toNormalizedPrice, toPrice, toUsd } from "../../utils/units"

use(useChai)

describe("Vault.touch", () => {
    let attachedContracts: AbstractContract[]
    let priceUpdateSigner: Signer
    let launchedNode: LaunchTestNodeReturn<DeployContractConfig[]>
    let deployer: WalletUnlocked
    let user0: WalletUnlocked
    let user1: WalletUnlocked
    let user2: WalletUnlocked
    let liquidator: WalletUnlocked
    let utils: Utils
    let BNB: Fungible
    let USDC: Fungible
    let BTC: Fungible
    let LP_ASSET_ID: string // the LP fungible asset
    let vault: Vault
    let vault_user0: Vault
    let vault_user1: Vault
    let vault_liquidator: Vault
    let vaultPricefeed: VaultPricefeed
    let timeDistributor: TimeDistributor
    let yieldTracker: YieldTracker

    beforeEach(async () => {
        launchedNode = await launchNode()
        ;[ deployer, user0, user1, user2, liquidator ] = getNodeWallets(launchedNode)
          
        priceUpdateSigner = new Signer(deployer.privateKey)

        /*
            NativeAsset + Pricefeed
        */
        BNB = await deploy("Fungible", deployer)
        USDC = await deploy("Fungible", deployer)
        BTC = await deploy("Fungible", deployer)

        utils = await deploy("Utils", deployer)
        vault = await deploy("Vault", deployer, { COLLATERAL_ASSET: toAsset(USDC) })
        vaultPricefeed = await deploy("VaultPricefeed", deployer)
        let RUSD = await deploy("Rusd", deployer)
        timeDistributor = await deploy("TimeDistributor", deployer)
        yieldTracker = await deploy("YieldTracker", deployer)
        
        attachedContracts = [vault, vaultPricefeed]
        LP_ASSET_ID = (await getValue(vault.functions.get_lp_asset())).bits.toString()

        await call(RUSD.functions.initialize(toContract(vault), toAddress(user0)))

        await call(vault.functions.initialize(addrToIdentity(deployer)))
        await call(vault.functions.set_pricefeed_provider(toContract(vaultPricefeed)))
        await call(vault.functions.set_liquidator(addrToIdentity(liquidator), true))

        await call(yieldTracker.functions.initialize(toContract(RUSD)))
        await call(yieldTracker.functions.set_time_distributor(toContract(timeDistributor)))
        await call(timeDistributor.functions.initialize())
        await call(timeDistributor.functions.set_distribution([contrToIdentity(yieldTracker)], [1000], [toAsset(BNB)]))

        await call(BNB.functions.mint(contrToIdentity(timeDistributor), 5000))
        await call(RUSD.functions.set_yield_trackers([{ bits: contrToIdentity(yieldTracker).ContractId?.bits as string }]))

        await call(vaultPricefeed.functions.initialize(addrToIdentity(deployer), toAddress(deployer)))
        await call(vaultPricefeed.functions.set_asset_config(toAsset(BNB), BNB_PRICEFEED_ID, 9))
        await call(vaultPricefeed.functions.set_asset_config(toAsset(USDC), USDC_PRICEFEED_ID, 9))
        await call(vaultPricefeed.functions.set_asset_config(toAsset(BTC), BTC_PRICEFEED_ID, 9))

        await call(
            vault.functions.set_fees(
                50, // tax_basis_points
                20, // stable_tax_basis_points
                30, // mint_burn_fee_basis_points
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

        vault_user0 = new Vault(vault.id.toAddress(), user0)
        vault_user1 = new Vault(vault.id.toAddress(), user1)
        vault_liquidator = new Vault(vault.id.toAddress(), liquidator)

        await call(getUpdatePriceDataCall(toAsset(USDC), toPrice(1), vaultPricefeed, priceUpdateSigner))

        await call(vault.functions.set_asset_config(...getUsdcConfig(USDC)))
        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
    })

    it("add liquidity", async () => {
        await call(USDC.functions.mint(addrToIdentity(user0), expandDecimals(40000)))
        await call(
            vault_user0
                .functions.add_liquidity(addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), getAssetId(USDC)],
                }),
        )
        // console.log((await user0.getBalance(LP_ASSET_ID)).toString())
        const sblpAmount = await user0.getBalance(LP_ASSET_ID)
        expect(sblpAmount.toNumber()).gt(0)
    })

    it("remove liquidity", async () => {
        await call(USDC.functions.mint(addrToIdentity(user0), expandDecimals(40000)))
        await call(
            vault_user0
                .functions.add_liquidity(addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), getAssetId(USDC)],
                }),
        )
        const sblpAmount = await user0.getBalance(LP_ASSET_ID)
        const usdcAmount = await user0.getBalance(getAssetId(USDC))
        await call(
            vault_user0
                .functions.remove_liquidity(addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [sblpAmount, LP_ASSET_ID],
                }),
        )
        const sblpAmountAfter = await user0.getBalance(LP_ASSET_ID)
        const usdcAmountAfter = await user0.getBalance(getAssetId(USDC))
        expect(sblpAmountAfter.toNumber()).eq(0)
        expect(usdcAmountAfter.toNumber()).gt(usdcAmount.toNumber())
    })

    it("increase long position", async () => {
        await call(USDC.functions.mint(addrToIdentity(user0), expandDecimals(40000)))
        await call(
            vault_user0
                .functions.add_liquidity(addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), getAssetId(USDC)],
                }),
        )

        await call(USDC.functions.mint(addrToIdentity(user1), expandDecimals(40000)))
        await call(
            vault_user1
                .functions.increase_position(addrToIdentity(user1), toAsset(BTC), toUsd(100), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), getAssetId(USDC)],
                }),
        )
        const positionKey = (await vault.functions.get_position_key(addrToIdentity(user1), toAsset(BTC), true).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value
        expect(!position.size.isZero()).eq(true)
        expect(!position.collateral.isZero()).eq(true)
        // console.log(position.size.div(position.collateral).toString())
    })

    it("increase short position", async () => {
        await call(USDC.functions.mint(addrToIdentity(user0), expandDecimals(40000)))
        await call(
            vault_user0
                .functions.add_liquidity(addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), getAssetId(USDC)],
                }),
        )

        await call(USDC.functions.mint(addrToIdentity(user1), expandDecimals(40000)))
        await call(
            vault_user1
                .functions.increase_position(addrToIdentity(user1), toAsset(BTC), toUsd(100), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), getAssetId(USDC)],
                }),
        )
        const positionKey = (await vault.functions.get_position_key(addrToIdentity(user1), toAsset(BTC), false).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value
        expect(!position.size.isZero()).eq(true)
        expect(!position.collateral.isZero()).eq(true)
    })

    it("decrease long position", async () => {
        await call(USDC.functions.mint(addrToIdentity(user0), expandDecimals(40000)))
        await call(
            vault_user0
                .functions.add_liquidity(addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), getAssetId(USDC)],
                }),
        )

        await call(USDC.functions.mint(addrToIdentity(user1), expandDecimals(40000)))
        await call(
            vault_user1
                .functions.increase_position(addrToIdentity(user1), toAsset(BTC), toUsd(100), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), getAssetId(USDC)],
                }),
        )
        const positionKey = (await vault.functions.get_position_key(addrToIdentity(user1), toAsset(BTC), true).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value
        const usdcAmount = await user1.getBalance(getAssetId(USDC))
        await call(
            vault_user1
                .functions.decrease_position(addrToIdentity(user1), toAsset(BTC), position.collateral.div(2), position.size.div(2), true, addrToIdentity(user1))
                .addContracts(attachedContracts),
        )
        const positionAfter = (await vault.functions.get_position_by_key(positionKey).get()).value
        expect(positionAfter.size.gt(position.size.div(2).mul(95).div(100))).eq(true)
        expect(positionAfter.size.lt(position.size.div(2).mul(105).div(100))).eq(true)
        expect(positionAfter.collateral.gt(position.collateral.div(2).mul(95).div(100))).eq(true)
        expect(positionAfter.collateral.lt(position.collateral.div(2).mul(105).div(100))).eq(true)
        const usdcAmountAfter = await user1.getBalance(getAssetId(USDC))
        expect(usdcAmountAfter.toNumber()).gt(usdcAmount.toNumber())
    })

    it("decrease short position", async () => {
        await call(USDC.functions.mint(addrToIdentity(user0), expandDecimals(40000)))
        await call(
            vault_user0
                .functions.add_liquidity(addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), getAssetId(USDC)],
                }),
        )

        await call(USDC.functions.mint(addrToIdentity(user1), expandDecimals(40000)))
        await call(
            vault_user1
                .functions.increase_position(addrToIdentity(user1), toAsset(BTC), toUsd(100), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), getAssetId(USDC)],
                }),
        )
        const positionKey = (await vault.functions.get_position_key(addrToIdentity(user1), toAsset(BTC), false).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value
        const usdcAmount = await user1.getBalance(getAssetId(USDC))
        await call(
            vault_user1
                .functions.decrease_position(addrToIdentity(user1), toAsset(BTC), position.collateral.div(2), position.size.div(2), false, addrToIdentity(user1))
                .addContracts(attachedContracts),
        )
        const positionAfter = (await vault.functions.get_position_by_key(positionKey).get()).value
        expect(positionAfter.size.gt(position.size.div(2).mul(95).div(100))).eq(true)
        expect(positionAfter.size.lt(position.size.div(2).mul(105).div(100))).eq(true)
        expect(positionAfter.collateral.gt(position.collateral.div(2).mul(95).div(100))).eq(true)
        expect(positionAfter.collateral.lt(position.collateral.div(2).mul(105).div(100))).eq(true)
        const usdcAmountAfter = await user1.getBalance(getAssetId(USDC))
        expect(usdcAmountAfter.toNumber()).gt(usdcAmount.toNumber())
    })

    it("profit long position", async () => {
        await call(USDC.functions.mint(addrToIdentity(user0), expandDecimals(40000)))
        await call(
            vault_user0
                .functions.add_liquidity(addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), getAssetId(USDC)],
                }),
        )

        await call(USDC.functions.mint(addrToIdentity(user1), expandDecimals(40000)))
        await call(
            vault_user1
                .functions.increase_position(addrToIdentity(user1), toAsset(BTC), toUsd(1000), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(400), getAssetId(USDC)],
                }),
        )

        const leverage = (await vault.functions.get_position_leverage(addrToIdentity(user1), toAsset(BTC), true).get()).value
        // 10_000 leverage base point
        expect(leverage.toNumber()).gte(25_000)
        expect(leverage.toNumber()).lt(26_000)
        const positionKey = (await vault.functions.get_position_key(addrToIdentity(user1), toAsset(BTC), true).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(48000), vaultPricefeed, priceUpdateSigner))

        const position_delta = (await vault.functions.get_position_delta(addrToIdentity(user1), toAsset(BTC), true).get()).value
        expect(position_delta[0]).eq(true)
        // * 0.95 for fees
        // * 0.2 for the price jump
        expect(position_delta[1].gt(position.size.mul(95).div(100).mul(20).div(100))).eq(true)
        expect(position_delta[1].lt(position.size.mul(105).div(100).mul(20).div(100))).eq(true)
    })

    it("loss long position", async () => {
        await call(USDC.functions.mint(addrToIdentity(user0), expandDecimals(40000)))
        await call(
            vault_user0
                .functions.add_liquidity(addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), getAssetId(USDC)],
                }),
        )

        await call(USDC.functions.mint(addrToIdentity(user1), expandDecimals(40000)))
        await call(
            vault_user1
                .functions.increase_position(addrToIdentity(user1), toAsset(BTC), toUsd(1000), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(400), getAssetId(USDC)],
                }),
        )

        const leverage = (await vault.functions.get_position_leverage(addrToIdentity(user1), toAsset(BTC), true).get()).value
        // 10_000 leverage base point
        expect(leverage.toNumber()).gte(25_000)
        expect(leverage.toNumber()).lt(26_000)
        const positionKey = (await vault.functions.get_position_key(addrToIdentity(user1), toAsset(BTC), true).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(32000), vaultPricefeed, priceUpdateSigner))

        const position_delta = (await vault.functions.get_position_delta(addrToIdentity(user1), toAsset(BTC), true).get()).value
        expect(position_delta[0]).eq(false)
        // * 0.95 for fees
        // * 0.2 for the price jump
        expect(position_delta[1].gt(position.size.mul(95).div(100).mul(20).div(100))).eq(true)
        expect(position_delta[1].lt(position.size.mul(105).div(100).mul(20).div(100))).eq(true)
    })

    it("loss short position", async () => {
        await call(USDC.functions.mint(addrToIdentity(user0), expandDecimals(40000)))
        await call(
            vault_user0
                .functions.add_liquidity(addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), getAssetId(USDC)],
                }),
        )

        await call(USDC.functions.mint(addrToIdentity(user1), expandDecimals(40000)))
        await call(
            vault_user1
                .functions.increase_position(addrToIdentity(user1), toAsset(BTC), toUsd(1000), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(400), getAssetId(USDC)],
                }),
        )

        const leverage = (await vault.functions.get_position_leverage(addrToIdentity(user1), toAsset(BTC), false).get()).value
        // 10_000 leverage base point
        expect(leverage.toNumber()).gte(25_000)
        expect(leverage.toNumber()).lt(26_000)
        const positionKey = (await vault.functions.get_position_key(addrToIdentity(user1), toAsset(BTC), false).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(48000), vaultPricefeed, priceUpdateSigner))

        const position_delta = (await vault.functions.get_position_delta(addrToIdentity(user1), toAsset(BTC), false).get()).value
        expect(position_delta[0]).eq(false)
        // * 0.95 for fees
        // * 0.2 for the price jump
        expect(position_delta[1].gt(position.size.mul(95).div(100).mul(20).div(100))).eq(true)
        expect(position_delta[1].lt(position.size.mul(105).div(100).mul(20).div(100))).eq(true)
    })

    it("profit short position", async () => {
        await call(USDC.functions.mint(addrToIdentity(user0), expandDecimals(40000)))
        await call(
            vault_user0
                .functions.add_liquidity(addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), getAssetId(USDC)],
                }),
        )

        await call(USDC.functions.mint(addrToIdentity(user1), expandDecimals(40000)))
        await call(
            vault_user1
                .functions.increase_position(addrToIdentity(user1), toAsset(BTC), toUsd(1000), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(400), getAssetId(USDC)],
                }),
        )

        const leverage = (await vault.functions.get_position_leverage(addrToIdentity(user1), toAsset(BTC), false).get()).value
        // 10_000 leverage base point
        expect(leverage.toNumber()).gte(25_000)
        expect(leverage.toNumber()).lt(26_000)
        const positionKey = (await vault.functions.get_position_key(addrToIdentity(user1), toAsset(BTC), false).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(32000), vaultPricefeed, priceUpdateSigner))

        const position_delta = (await vault.functions.get_position_delta(addrToIdentity(user1), toAsset(BTC), false).get()).value
        expect(position_delta[0]).eq(true)
        // * 0.95 for fees
        // * 0.2 for the price jump
        expect(position_delta[1].gt(position.size.mul(95).div(100).mul(20).div(100))).eq(true)
        expect(position_delta[1].lt(position.size.mul(105).div(100).mul(20).div(100))).eq(true)
    })

    it("liquidate long position", async () => {
        await call(USDC.functions.mint(addrToIdentity(user0), expandDecimals(40000)))
        await call(
            vault_user0
                .functions.add_liquidity(addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), getAssetId(USDC)],
                }),
        )

        await call(USDC.functions.mint(addrToIdentity(user1), expandDecimals(40000)))
        await call(
            vault_user1
                .functions.increase_position(addrToIdentity(user1), toAsset(BTC), toUsd(1000), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), getAssetId(USDC)],
                }),
        )

        const positionKey = (await vault.functions.get_position_key(addrToIdentity(user1), toAsset(BTC), true).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(35000), vaultPricefeed, priceUpdateSigner))

        const validate_liquidation = (await vault.functions.validate_liquidation(addrToIdentity(user1), toAsset(BTC), true, false).get()).value
        expect(validate_liquidation[0].toNumber()).eq(1)
        const position_delta = (await vault.functions.get_position_delta(addrToIdentity(user1), toAsset(BTC), true).get()).value
        expect(position_delta[0]).eq(false)
        expect(position_delta[1].gt(position.collateral)).eq(true)

        await call(
            vault_liquidator
                .functions.liquidate_position(addrToIdentity(user1), toAsset(BTC), true, addrToIdentity(liquidator))
                .addContracts(attachedContracts),
        )
        const positionAfter = (await vault.functions.get_position_by_key(positionKey).get()).value
        expect(positionAfter.size.isZero()).eq(true)
        expect(positionAfter.collateral.isZero()).eq(true)
    })

    it("liquidate short position", async () => {
        await call(USDC.functions.mint(addrToIdentity(user0), expandDecimals(40000)))
        await call(
            vault_user0
                .functions.add_liquidity(addrToIdentity(user0))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), getAssetId(USDC)],
                }),
        )

        await call(USDC.functions.mint(addrToIdentity(user1), expandDecimals(40000)))
        await call(
            vault_user1
                .functions.increase_position(addrToIdentity(user1), toAsset(BTC), toUsd(1000), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), getAssetId(USDC)],
                }),
        )

        const positionKey = (await vault.functions.get_position_key(addrToIdentity(user1), toAsset(BTC), false).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(45000), vaultPricefeed, priceUpdateSigner))

        const validate_liquidation = (await vault.functions.validate_liquidation(addrToIdentity(user1), toAsset(BTC), false, false).get()).value
        expect(validate_liquidation[0].toNumber()).eq(1)
        const position_delta = (await vault.functions.get_position_delta(addrToIdentity(user1), toAsset(BTC), false).get()).value
        expect(position_delta[0]).eq(false)
        expect(position_delta[1].gt(position.collateral)).eq(true)

        await call(
            vault_liquidator
                .functions.liquidate_position(addrToIdentity(user1), toAsset(BTC), false, addrToIdentity(liquidator))
                .addContracts(attachedContracts),
        )
        const positionAfter = (await vault.functions.get_position_by_key(positionKey).get()).value
        expect(positionAfter.size.isZero()).eq(true)
        expect(positionAfter.collateral.isZero()).eq(true)
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
