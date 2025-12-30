import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { AbstractContract, WalletUnlocked, AssetId } from "fuels"
import { launchNode, getNodeWallets } from "./node"
import {
    call,
    AddressIdentity,
    walletToAddressIdentity,
    expandDecimals,
    COLLATERAL_ASSET,
    USDC_ASSET,
    getBtcConfig,
    getUsdcConfig,
    getAssetId,
} from "./utils"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import {
    FungibleFactory,
    PricefeedWrapperFactory,
    StorkMockFactory,
    VaultFactory,
    SimpleProxyFactory,
    Vault,
    StorkMock,
    PricefeedWrapper,
    Fungible,
} from "../types"

describe("Vault SRC20", () => {
    let attachedContracts: AbstractContract[]
    let launchedNode: LaunchTestNodeReturn<DeployContractConfig[]>
    let deployer: WalletUnlocked
    let user0: WalletUnlocked
    let deployerIdentity: AddressIdentity
    let user0Identity: AddressIdentity
    let USDC: Fungible
    let USDC_ASSET_ID: string
    let LP_ASSET_ID: string // the LP fungible asset
    let storkMock: StorkMock
    let pricefeedWrapper: PricefeedWrapper
    let vault: Vault

    beforeEach(async () => {
        launchedNode = await launchNode()
        ;[deployer, user0] = getNodeWallets(launchedNode)

        deployerIdentity = walletToAddressIdentity(deployer)
        user0Identity = walletToAddressIdentity(user0)

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
                COLLATERAL_ASSET_ID: { bits: USDC_ASSET_ID },
                COLLATERAL_ASSET,
                COLLATERAL_ASSET_DECIMALS: 9,
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

        await call(
            vault.functions.set_fees(
                30, // mint_burn_fee_basis_points
                10, // margin_fee_basis_points
                expandDecimals(5), // liquidation_fee_usd
            ),
        )

        await call(storkMock.functions.update_price(USDC_ASSET, expandDecimals(1, 18)))

        await call(vault.functions.set_asset_config(...getUsdcConfig()))
        await call(vault.functions.set_asset_config(...getBtcConfig()))
    })

    describe("total_assets", () => {
        it("should return 1", async () => {
            const totalAssets = (await vault.functions.total_assets().get()).value
            expect(totalAssets.toNumber()).eq(1)
        })
    })

    describe("name", () => {
        it("should return 'StarBoardLP' for LP asset", async () => {
            const lpAssetId: AssetId = { bits: LP_ASSET_ID }
            const nameResult = (await vault.functions.name(lpAssetId).get()).value

            expect(nameResult).eq("StarBoardLP")
        })

        it("should return undefined for invalid asset ID", async () => {
            const invalidAssetId: AssetId = { bits: "0x1234567890123456789012345678901234567890123456789012345678901234" }
            const nameResult = (await vault.functions.name(invalidAssetId).get()).value

            expect(nameResult).toBeUndefined()
        })
    })

    describe("symbol", () => {
        it("should return 'SLP' for LP asset", async () => {
            const lpAssetId: AssetId = { bits: LP_ASSET_ID }
            const symbolResult = (await vault.functions.symbol(lpAssetId).get()).value

            expect(symbolResult).eq("SLP")
        })

        it("should return undefined for invalid asset ID", async () => {
            const invalidAssetId: AssetId = { bits: "0x1234567890123456789012345678901234567890123456789012345678901234" }
            const symbolResult = (await vault.functions.symbol(invalidAssetId).get()).value

            expect(symbolResult).toBeUndefined()
        })
    })

    describe("decimals", () => {
        it("should return 9 (collateral asset decimals) for LP asset", async () => {
            const lpAssetId: AssetId = { bits: LP_ASSET_ID }
            const decimalsResult = (await vault.functions.decimals(lpAssetId).get()).value

            expect(decimalsResult).eq(9)
        })

        it("should return undefined for invalid asset ID", async () => {
            const invalidAssetId: AssetId = { bits: "0x1234567890123456789012345678901234567890123456789012345678901234" }
            const decimalsResult = (await vault.functions.decimals(invalidAssetId).get()).value

            expect(decimalsResult).toBeUndefined()
        })
    })

    describe("total_supply", () => {
        it("should return 0 initially", async () => {
            const lpAssetId: AssetId = { bits: LP_ASSET_ID }
            const totalSupplyResult = (await vault.functions.total_supply(lpAssetId).get()).value

            expect(totalSupplyResult?.toNumber()).eq(0)
        })

        it("should increase when liquidity is added", async () => {
            const lpAssetId: AssetId = { bits: LP_ASSET_ID }

            // Get initial supply
            const initialSupplyResult = (await vault.functions.total_supply(lpAssetId).get()).value
            const initialSupply = initialSupplyResult!
            expect(initialSupply.toNumber()).eq(0)

            // Add liquidity
            await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
            const vaultUser0 = new Vault(vault.id.toAddress(), user0)

            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )

            // Check supply increased
            const newSupplyResult = (await vault.functions.total_supply(lpAssetId).get()).value
            const newSupply = newSupplyResult!
            expect(newSupply.toNumber()).gt(initialSupply.toNumber())
        })

        it("should decrease when liquidity is removed", async () => {
            const lpAssetId: AssetId = { bits: LP_ASSET_ID }

            // Add liquidity first
            await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
            const vaultUser0 = new Vault(vault.id.toAddress(), user0)

            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )

            const supplyAfterAddResult = (await vault.functions.total_supply(lpAssetId).get()).value
            const supplyAfterAdd = supplyAfterAddResult!
            const lpBalance = await user0.getBalance(LP_ASSET_ID)

            // Remove liquidity
            await call(
                vaultUser0.functions
                    .remove_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [lpBalance, LP_ASSET_ID],
                    }),
            )

            // Check supply decreased
            const supplyAfterRemoveResult = (await vault.functions.total_supply(lpAssetId).get()).value
            const supplyAfterRemove = supplyAfterRemoveResult!
            expect(supplyAfterRemove.toNumber()).lt(supplyAfterAdd.toNumber())
        })

        it("should return undefined for invalid asset ID", async () => {
            const invalidAssetId: AssetId = { bits: "0x1234567890123456789012345678901234567890123456789012345678901234" }
            const totalSupplyResult = (await vault.functions.total_supply(invalidAssetId).get()).value

            expect(totalSupplyResult).toBeUndefined()
        })

        it("should track supply correctly through multiple add/remove operations", async () => {
            const lpAssetId: AssetId = { bits: LP_ASSET_ID }

            // First add liquidity
            await call(USDC.functions.mint(user0Identity, expandDecimals(40000)))
            const vaultUser0 = new Vault(vault.id.toAddress(), user0)

            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(100), USDC_ASSET_ID],
                    }),
            )

            const supply1Result = (await vault.functions.total_supply(lpAssetId).get()).value
            const supply1 = supply1Result!.toNumber()

            // Second add liquidity
            await call(
                vaultUser0.functions
                    .add_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [expandDecimals(50), USDC_ASSET_ID],
                    }),
            )

            const supply2Result = (await vault.functions.total_supply(lpAssetId).get()).value
            const supply2 = supply2Result!.toNumber()
            expect(supply2).gt(supply1)

            // Remove partial liquidity
            const lpBalance = await user0.getBalance(LP_ASSET_ID)
            const halfLpBalance = lpBalance.div(2)

            await call(
                vaultUser0.functions
                    .remove_liquidity(user0Identity)
                    .addContracts(attachedContracts)
                    .callParams({
                        forward: [halfLpBalance, LP_ASSET_ID],
                    }),
            )

            const supply3Result = (await vault.functions.total_supply(lpAssetId).get()).value
            const supply3 = supply3Result!.toNumber()
            expect(supply3).lt(supply2)
            expect(supply3).gt(0)
        })
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
