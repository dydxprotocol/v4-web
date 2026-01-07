import { AbstractContract, WalletUnlocked } from "fuels"
import { launchNode, getNodeWallets } from "./node.js"
import {
    call,
    AddressIdentity,
    walletToAddressIdentity,
    expandDecimals,
    BASE_ASSET,
    USDC_ASSET,
    BTC_ASSET,
    getBtcConfig,
    getAssetId,
} from "./utils.js"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
    Fungible,
    FungibleFactory,
    PricefeedWrapper,
    PricefeedWrapperFactory,
    StorkMock,
    StorkMockFactory,
    TestnetTokenFactory,
    VaultFactory,
    SimpleProxyFactory,
    Vault,
} from "../types/index.js"

describe("Vault.touch", () => {
    let attachedContracts: AbstractContract[]
    let launchedNode: LaunchTestNodeReturn<DeployContractConfig[]>
    let deployer: WalletUnlocked
    let user0: WalletUnlocked
    let user1: WalletUnlocked
    let liquidator: WalletUnlocked
    let deployerIdentity: AddressIdentity
    let user0Identity: AddressIdentity
    let user1Identity: AddressIdentity
    let liquidatorIdentity: AddressIdentity
    let USDC: Fungible
    let USDC_ASSET_ID: string
    let LP_ASSET_ID: string // the LP fungible asset
    let storkMock: StorkMock
    let pricefeedWrapper: PricefeedWrapper
    let vault: Vault
    let vaultUser0: Vault
    let vaultUser1: Vault
    let vaultLiquidator: Vault

    beforeEach(async () => {
        launchedNode = await launchNode()
        ;[deployer, user0, user1, , liquidator] = getNodeWallets(launchedNode)

        deployerIdentity = walletToAddressIdentity(deployer)
        user0Identity = walletToAddressIdentity(user0)
        user1Identity = walletToAddressIdentity(user1)
        liquidatorIdentity = walletToAddressIdentity(liquidator)

        /*
            NativeAsset + Pricefeed
        */
        const { waitForResult: waitForResultUSDC } = await FungibleFactory.deploy(deployer)
        const { contract: USDCDeployed } = await waitForResultUSDC()
        USDC = USDCDeployed

        USDC_ASSET_ID = getAssetId(USDC)

        const { waitForResult: waitForResultStorkMock } = await StorkMockFactory.deploy(deployer)
        const { contract: storkMockDeployed } = await waitForResultStorkMock()
        storkMock = storkMockDeployed
        const { waitForResult: waitForResultPricefeedWrapper } = await PricefeedWrapperFactory.deploy(deployer, {
            configurableConstants: {
                STORK_CONTRACT: { bits: storkMock.id.b256Address },
            },
        })
        const { contract: pricefeedWrapperDeployed } = await waitForResultPricefeedWrapper()
        pricefeedWrapper = pricefeedWrapperDeployed

        const { waitForResult: waitForResultVaultImpl } = await VaultFactory.deploy(deployer, {
            configurableConstants: {
                BASE_ASSET_ID: { bits: USDC_ASSET_ID },
                BASE_ASSET,
                BASE_ASSET_DECIMALS: 9,
                PRICEFEED_WRAPPER: { bits: pricefeedWrapper.id.b256Address },
            },
        })
        const { contract: vaultImpl } = await waitForResultVaultImpl()

        const { waitForResult: waitForResultSimpleProxy } = await SimpleProxyFactory.deploy(deployer, {
            configurableConstants: {
                DEPLOYER: { bits: deployer.address.toHexString() },
            },
        })
        const { contract: simpleProxy } = await waitForResultSimpleProxy()
        await call(
            simpleProxy.functions.initialize_proxy(deployerIdentity, {
                bits: vaultImpl.id.toHexString(),
            }),
        )
        vault = new Vault(simpleProxy.id.toAddress(), deployer)

        attachedContracts = [vault, vaultImpl, storkMock, pricefeedWrapper]
        LP_ASSET_ID = (await vault.functions.get_lp_asset().get()).value.bits.toString()

        await call(vault.functions.initialize(deployerIdentity))
        await call(vault.functions.set_liquidator(liquidatorIdentity, true))

        await call(
            vault.functions.set_fees(
                30, // liquidity_fee_basis_points
                10, // position_fee_basis_points
                expandDecimals(5), // liquidation_fee
            ),
        )

        vaultUser0 = new Vault(vault.id.toAddress(), user0)
        vaultUser1 = new Vault(vault.id.toAddress(), user1)
        vaultLiquidator = new Vault(vault.id.toAddress(), liquidator)

        await call(storkMock.functions.update_price(USDC_ASSET, expandDecimals(1, 18)))

        await call(vault.functions.set_asset_config(...getBtcConfig()))

        await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(40000, 18)))
    })

    it("add liquidity", async () => {
        await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
        await call(
            vaultUser0.functions
                .add_liquidity(user0Identity)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), USDC_ASSET_ID],
                }),
        )
        // console.log((await user0.getBalance(LP_ASSET_ID)).toString())
        const sblpAmount = await user0.getBalance(LP_ASSET_ID)
        expect(sblpAmount.toNumber()).gt(0)
    })

    it("remove liquidity", async () => {
        await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
        await call(
            vaultUser0.functions
                .add_liquidity(user0Identity)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), USDC_ASSET_ID],
                }),
        )
        const sblpAmount = await user0.getBalance(LP_ASSET_ID)
        const usdcAmount = await user0.getBalance(USDC_ASSET_ID)
        await call(
            vaultUser0.functions
                .remove_liquidity(user0Identity)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [sblpAmount, LP_ASSET_ID],
                }),
        )
        const sblpAmountAfter = await user0.getBalance(LP_ASSET_ID)
        const usdcAmountAfter = await user0.getBalance(USDC_ASSET_ID)
        expect(sblpAmountAfter.toNumber()).eq(0)
        expect(usdcAmountAfter.toNumber()).gt(usdcAmount.toNumber())
    })

    it("increase long position", async () => {
        await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
        await call(
            vaultUser0.functions
                .add_liquidity(user0Identity)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), USDC_ASSET_ID],
                }),
        )

        await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
        await call(
            vaultUser1.functions
                .increase_position(user1Identity, BTC_ASSET, expandDecimals(100), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), USDC_ASSET_ID],
                }),
        )
        const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value
        expect(!position.size.isZero()).eq(true)
        expect(!position.collateral.isZero()).eq(true)
        // console.log(position.size.div(position.collateral).toString())
    })

    it("increase short position", async () => {
        await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
        await call(
            vaultUser0.functions
                .add_liquidity(user0Identity)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), USDC_ASSET_ID],
                }),
        )

        await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
        await call(
            vaultUser1.functions
                .increase_position(user1Identity, BTC_ASSET, expandDecimals(100), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), USDC_ASSET_ID],
                }),
        )
        const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, false).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value
        expect(!position.size.isZero()).eq(true)
        expect(!position.collateral.isZero()).eq(true)
    })

    it("decrease long position", async () => {
        await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
        await call(
            vaultUser0.functions
                .add_liquidity(user0Identity)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), USDC_ASSET_ID],
                }),
        )

        await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
        await call(
            vaultUser1.functions
                .increase_position(user1Identity, BTC_ASSET, expandDecimals(100), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), USDC_ASSET_ID],
                }),
        )
        const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value
        const usdcAmount = await user1.getBalance(USDC_ASSET_ID)
        await call(
            vaultUser1.functions
                .decrease_position(
                    user1Identity,
                    BTC_ASSET,
                    position.collateral.div(2),
                    position.size.div(2),
                    true,
                    user1Identity,
                )
                .addContracts(attachedContracts),
        )
        const positionAfter = (await vault.functions.get_position_by_key(positionKey).get()).value
        expect(positionAfter.size.gt(position.size.div(2).mul(95).div(100))).eq(true)
        expect(positionAfter.size.lt(position.size.div(2).mul(105).div(100))).eq(true)
        expect(positionAfter.collateral.gt(position.collateral.div(2).mul(95).div(100))).eq(true)
        expect(positionAfter.collateral.lt(position.collateral.div(2).mul(105).div(100))).eq(true)
        const usdcAmountAfter = await user1.getBalance(USDC_ASSET_ID)
        expect(usdcAmountAfter.toNumber()).gt(usdcAmount.toNumber())
    })

    it("decrease short position", async () => {
        await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
        await call(
            vaultUser0.functions
                .add_liquidity(user0Identity)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), USDC_ASSET_ID],
                }),
        )

        await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
        await call(
            vaultUser1.functions
                .increase_position(user1Identity, BTC_ASSET, expandDecimals(100), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), USDC_ASSET_ID],
                }),
        )
        const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, false).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value
        const usdcAmount = await user1.getBalance(USDC_ASSET_ID)
        await call(
            vaultUser1.functions
                .decrease_position(
                    user1Identity,
                    BTC_ASSET,
                    position.collateral.div(2),
                    position.size.div(2),
                    false,
                    user1Identity,
                )
                .addContracts(attachedContracts),
        )
        const positionAfter = (await vault.functions.get_position_by_key(positionKey).get()).value
        expect(positionAfter.size.gt(position.size.div(2).mul(95).div(100))).eq(true)
        expect(positionAfter.size.lt(position.size.div(2).mul(105).div(100))).eq(true)
        expect(positionAfter.collateral.gt(position.collateral.div(2).mul(95).div(100))).eq(true)
        expect(positionAfter.collateral.lt(position.collateral.div(2).mul(105).div(100))).eq(true)
        const usdcAmountAfter = await user1.getBalance(USDC_ASSET_ID)
        expect(usdcAmountAfter.toNumber()).gt(usdcAmount.toNumber())
    })

    it("profit long position", async () => {
        await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
        await call(
            vaultUser0.functions
                .add_liquidity(user0Identity)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), USDC_ASSET_ID],
                }),
        )

        await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
        await call(
            vaultUser1.functions
                .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(400), USDC_ASSET_ID],
                }),
        )

        const leverage = (await vault.functions.get_position_leverage(user1Identity, BTC_ASSET, true).get()).value
        // 10_000 leverage base point
        expect(leverage.toNumber()).gte(25_000)
        expect(leverage.toNumber()).lt(26_000)
        const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value

        await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(48000, 18)))

        const positionDelta = (await vault.functions.get_position_pnl(user1Identity, BTC_ASSET, true).get()).value
        expect(positionDelta[0]).eq(true)
        // * 0.95 for fees
        // * 0.2 for the price jump
        expect(positionDelta[1].gt(position.size.mul(95).div(100).mul(20).div(100))).eq(true)
        expect(positionDelta[1].lt(position.size.mul(105).div(100).mul(20).div(100))).eq(true)
    })

    it("loss long position", async () => {
        await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
        await call(
            vaultUser0.functions
                .add_liquidity(user0Identity)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), USDC_ASSET_ID],
                }),
        )

        await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
        await call(
            vaultUser1.functions
                .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(400), USDC_ASSET_ID],
                }),
        )

        const leverage = (await vault.functions.get_position_leverage(user1Identity, BTC_ASSET, true).get()).value
        // 10_000 leverage base point
        expect(leverage.toNumber()).gte(25_000)
        expect(leverage.toNumber()).lt(26_000)
        const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value

        await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(32000, 18)))

        const positionDelta = (await vault.functions.get_position_pnl(user1Identity, BTC_ASSET, true).get()).value
        expect(positionDelta[0]).eq(false)
        // * 0.95 for fees
        // * 0.2 for the price jump
        expect(positionDelta[1].gt(position.size.mul(95).div(100).mul(20).div(100))).eq(true)
        expect(positionDelta[1].lt(position.size.mul(105).div(100).mul(20).div(100))).eq(true)
    })

    it("loss short position", async () => {
        await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
        await call(
            vaultUser0.functions
                .add_liquidity(user0Identity)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), USDC_ASSET_ID],
                }),
        )

        await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
        await call(
            vaultUser1.functions
                .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(400), USDC_ASSET_ID],
                }),
        )

        const leverage = (await vault.functions.get_position_leverage(user1Identity, BTC_ASSET, false).get()).value
        // 10_000 leverage base point
        expect(leverage.toNumber()).gte(25_000)
        expect(leverage.toNumber()).lt(26_000)
        const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, false).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value

        await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(48000, 18)))

        const positionDelta = (await vault.functions.get_position_pnl(user1Identity, BTC_ASSET, false).get()).value
        expect(positionDelta[0]).eq(false)
        // * 0.95 for fees
        // * 0.2 for the price jump
        expect(positionDelta[1].gt(position.size.mul(95).div(100).mul(20).div(100))).eq(true)
        expect(positionDelta[1].lt(position.size.mul(105).div(100).mul(20).div(100))).eq(true)
    })

    it("profit short position", async () => {
        await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
        await call(
            vaultUser0.functions
                .add_liquidity(user0Identity)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), USDC_ASSET_ID],
                }),
        )

        await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
        await call(
            vaultUser1.functions
                .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(400), USDC_ASSET_ID],
                }),
        )

        const leverage = (await vault.functions.get_position_leverage(user1Identity, BTC_ASSET, false).get()).value
        // 10_000 leverage base point
        expect(leverage.toNumber()).gte(25_000)
        expect(leverage.toNumber()).lt(26_000)
        const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, false).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value

        await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(32000, 18)))

        const positionDelta = (await vault.functions.get_position_pnl(user1Identity, BTC_ASSET, false).get()).value
        expect(positionDelta[0]).eq(true)
        // * 0.95 for fees
        // * 0.2 for the price jump
        expect(positionDelta[1].gt(position.size.mul(95).div(100).mul(20).div(100))).eq(true)
        expect(positionDelta[1].lt(position.size.mul(105).div(100).mul(20).div(100))).eq(true)
    })

    it("liquidate long position", async () => {
        await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
        await call(
            vaultUser0.functions
                .add_liquidity(user0Identity)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), USDC_ASSET_ID],
                }),
        )

        await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
        await call(
            vaultUser1.functions
                .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), USDC_ASSET_ID],
                }),
        )

        const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, true).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value

        await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(35000, 18)))

        const validateLiquidation = (await vault.functions.validate_liquidation(user1Identity, BTC_ASSET, true, false).get())
            .value
        expect(validateLiquidation[0].toNumber()).eq(1)
        const positionDelta = (await vault.functions.get_position_pnl(user1Identity, BTC_ASSET, true).get()).value
        expect(positionDelta[0]).eq(false)
        expect(positionDelta[1].gt(position.collateral)).eq(true)

        await call(
            vaultLiquidator.functions
                .liquidate_position(user1Identity, BTC_ASSET, true, liquidatorIdentity)
                .addContracts(attachedContracts),
        )
        const positionAfter = (await vault.functions.get_position_by_key(positionKey).get()).value
        expect(positionAfter.size.isZero()).eq(true)
        expect(positionAfter.collateral.isZero()).eq(true)
    })

    it("liquidate short position", async () => {
        await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
        await call(
            vaultUser0.functions
                .add_liquidity(user0Identity)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(40000), USDC_ASSET_ID],
                }),
        )

        await call(USDC.functions.mint(user1Identity, expandDecimals(40000)))
        await call(
            vaultUser1.functions
                .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [expandDecimals(100), USDC_ASSET_ID],
                }),
        )

        const positionKey = (await vault.functions.get_position_key(user1Identity, BTC_ASSET, false).get()).value
        const position = (await vault.functions.get_position_by_key(positionKey).get()).value

        await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(45000, 18)))

        const validateLiquidation = (await vault.functions.validate_liquidation(user1Identity, BTC_ASSET, false, false).get())
            .value
        expect(validateLiquidation[0].toNumber()).eq(1)
        const positionDelta = (await vault.functions.get_position_pnl(user1Identity, BTC_ASSET, false).get()).value
        expect(positionDelta[0]).eq(false)
        expect(positionDelta[1].gt(position.collateral)).eq(true)

        await call(
            vaultLiquidator.functions
                .liquidate_position(user1Identity, BTC_ASSET, false, liquidatorIdentity)
                .addContracts(attachedContracts),
        )
        const positionAfter = (await vault.functions.get_position_by_key(positionKey).get()).value
        expect(positionAfter.size.isZero()).eq(true)
        expect(positionAfter.collateral.isZero()).eq(true)
    })

    it("deploy testnet token", async () => {
        const { waitForResult: waitForResultTestnetToken } = await TestnetTokenFactory.deploy(deployer, {
            configurableConstants: {
                NAME: "TstTken",
                SYMBOL: "ttokn",
                DECIMALS: 9,
            },
        })
        const { contract: token } = await waitForResultTestnetToken()
        await call(token.functions.initialize())
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
