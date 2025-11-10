import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { WalletUnlocked, DateTime, BN } from "fuels"
import { launchNode, getNodeWallets } from "./node"
import {
    call,
    AddressIdentity,
    walletToAddressIdentity,
    expandDecimals,
    COLLATERAL_ASSET,
    USDC_ASSET,
    BTC_ASSET,
    BTC_MAX_LEVERAGE,
    getBtcConfig,
    getUsdcConfig,
    getAssetId,
    moveBlockchainTime,
} from "./utils"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import { PricefeedWrapper, StorkMock, PricefeedWrapperFactory, StorkMockFactory, Vault, VaultFactory, FungibleFactory, Fungible } from "../../contracts/types"
import * as compose from 'docker-compose'

function toPrice(value: number, decimals: number = 9): string {
    const v = BigInt(value) * BigInt(10) ** BigInt(decimals)
    return v.toString()
}

describe("Indexer", () => {
    let launchedNode: LaunchTestNodeReturn<DeployContractConfig[]>
    let deployer: WalletUnlocked
    let deployerIdentity: AddressIdentity
    let liquidator: WalletUnlocked
    let liquidatorIdentity: AddressIdentity
    let USDC: Fungible
    let USDC_ASSET_ID: string
    let storkMock: StorkMock
    let pricefeedWrapper: PricefeedWrapper
    let vault: Vault

    beforeEach(async () => {
        launchedNode = await launchNode()
        ;[deployer, , , , liquidator] = getNodeWallets(launchedNode)

        deployerIdentity = walletToAddressIdentity(deployer)
        liquidatorIdentity = walletToAddressIdentity(liquidator)

        const { waitForResult: waitForResultUSDC } = await FungibleFactory.deploy(deployer)
        const { contract: USDCDeployed } = await waitForResultUSDC()
        USDC = USDCDeployed
    
        USDC_ASSET_ID = getAssetId(USDC)

        // Deploy StorkMock contract first
        const { waitForResult: waitForResultStorkMock } = await StorkMockFactory.deploy(deployer)
        const { contract: storkMockDeployed } = await waitForResultStorkMock()
        storkMock = storkMockDeployed

        // Deploy PricefeedWrapper with StorkMock as dependency
        const { waitForResult: waitForResultPricefeedWrapper } = await PricefeedWrapperFactory.deploy(deployer, {
            configurableConstants: {
                STORK_CONTRACT: { bits: storkMock.id.b256Address },
            },
        })
        const { contract: pricefeedWrapperDeployed } = await waitForResultPricefeedWrapper()
        pricefeedWrapper = pricefeedWrapperDeployed

        const { waitForResult: waitForResultVault } = await VaultFactory.deploy(deployer, {
            configurableConstants: {
                COLLATERAL_ASSET_ID: { bits: USDC_ASSET_ID },
                COLLATERAL_ASSET,
                COLLATERAL_ASSET_DECIMALS: 9,
                PRICEFEED_WRAPPER: { bits: pricefeedWrapper.id.b256Address },
            },
        })
        const { contract: vaultDeployed } = await waitForResultVault()
        vault = vaultDeployed

        await call(vault.functions.initialize(deployerIdentity))
        await call(vault.functions.set_liquidator(liquidatorIdentity, true))

        await call(
            vault.functions.set_fees(
                30, // mint_burn_fee_basis_points
                10, // margin_fee_basis_points
                expandDecimals(5), // liquidation_fee_usd
            ),
        )

    })

    it("should work", { timeout: 30_000 },async () => {
        console.log("works")
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
