import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { WalletUnlocked } from "fuels"
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
import {
    FungibleFactory,
    PricefeedWrapperFactory,
    StorkMockFactory,
    VaultExposeFactory,
    SimpleProxyFactory,
    Fungible,
    VaultExpose,
    StorkMock,
    PricefeedWrapper,
} from "../types/index.js"

describe("Vault.calculate_settlement", () => {
    let launchedNode: LaunchTestNodeReturn<DeployContractConfig[]>
    let deployer: WalletUnlocked
    let liquidator: WalletUnlocked
    let deployerIdentity: AddressIdentity
    let liquidatorIdentity: AddressIdentity
    let USDC: Fungible
    let USDC_ASSET_ID: string
    let storkMock: StorkMock
    let pricefeedWrapper: PricefeedWrapper
    let vaultExpose: VaultExpose

    // the tests do not modify the state, so beforeAll is more effective
    beforeAll(async () => {
        launchedNode = await launchNode()
        ;[deployer, , , , liquidator] = getNodeWallets(launchedNode)

        deployerIdentity = walletToAddressIdentity(deployer)
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

        const { waitForResult: waitForResultVaultImpl } = await VaultExposeFactory.deploy(deployer, {
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
        vaultExpose = new VaultExpose(simpleProxy.id.toAddress(), deployer)

        await call(vaultExpose.functions.initialize(deployerIdentity))
        await call(vaultExpose.functions.set_liquidator(liquidatorIdentity, true))

        await call(
            vaultExpose.functions.set_fees(
                30, // liquidity_fee_basis_points
                10, // position_fee_basis_points
                10, // liquidation_fee_basis_points
            ),
        )

        await call(storkMock.functions.update_price(USDC_ASSET, expandDecimals(1, 18)))

        await call(vaultExpose.functions.set_asset_config(...getBtcConfig()))

        await call(storkMock.functions.update_price(BTC_ASSET, expandDecimals(40000, 18)))
    })

    describe("increase position", () => {
        it("zero case", async () => {
            const settlementResponse = (await vaultExpose.functions.calculate_settlement(0, 0, 0, 0, true, 0, true, 0, 0).get())
                .value
            expect(settlementResponse[0].toString()).toBe("0")
            expect(settlementResponse[1].toString()).toBe("0")
            expect(settlementResponse[2].toString()).toBe("0")
            expect(settlementResponse[3].toString()).toBe("0")
            expect(settlementResponse[4].toString()).toBe("0")
            expect(settlementResponse[5].toString()).toBe("0")
            expect(settlementResponse[6].toString()).toBe("0")
            expect(settlementResponse[7].toString()).toBe("Success")
        })

        it("normal case, funding rate in profit", async () => {
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        expandDecimals(1, 6), // protocol fee
                        expandDecimals(1, 6), // liquidity fee
                        0, // liquidation fee - zero when increasing position
                        expandDecimals(1, 8), // funding rate
                        true, // funding rate in profit
                        0, // pnl delta - zero when increasing position
                        true, // pnl delta in profit - zero when increasing position
                        expandDecimals(1, 10), // collateral
                        expandDecimals(1, 12), // total reserves
                    )
                    .get()
            ).value
            expect(settlementResponse[0].toString()).toBe(expandDecimals(1, 6)) // protocol fee
            expect(settlementResponse[1].toString()).toBe(expandDecimals(1, 6)) // liquidity fee
            expect(settlementResponse[2].toString()).toBe("0") // liquidation fee - zero when increasing position
            expect(settlementResponse[3].toString()).toBe(expandDecimals(1, 8)) // funding rate
            expect(settlementResponse[4].toString()).toBe("0") // pnl delta - zero when increasing position
            expect(settlementResponse[5].toString()).toBe(expandDecimals(10000 - 1 - 1 + 100, 6)) // collateral - protocol fee - liquidation fee + funding rate
            expect(settlementResponse[6].toString()).toBe(expandDecimals(1000000 + 1 - 100, 6)) // total reserves + liquidity fee - funding rate
            expect(settlementResponse[7].toString()).toBe("Success") // status
        })

        it("normal case, funding rate in loss", async () => {
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        expandDecimals(1, 6), // protocol fee
                        expandDecimals(1, 6), // liquidity fee
                        0, // liquidation fee - zero when increasing position
                        expandDecimals(1, 8), // funding rate
                        false, // funding rate in profit
                        0, // pnl delta - zero when increasing position
                        true, // pnl delta in profit - zero when increasing position
                        expandDecimals(1, 10), // collateral
                        expandDecimals(1, 12), // total reserves
                    )
                    .get()
            ).value
            expect(settlementResponse[0].toString()).toBe(expandDecimals(1, 6)) // protocol fee
            expect(settlementResponse[1].toString()).toBe(expandDecimals(1, 6)) // liquidity fee
            expect(settlementResponse[2].toString()).toBe("0") // liquidation fee - zero when increasing position
            expect(settlementResponse[3].toString()).toBe(expandDecimals(1, 8)) // funding rate
            expect(settlementResponse[4].toString()).toBe("0") // pnl delta - zero when increasing position
            expect(settlementResponse[5].toString()).toBe(expandDecimals(10000 - 1 - 1 - 100, 6)) // collateral - protocol fee - liquidation fee + funding rate
            expect(settlementResponse[6].toString()).toBe(expandDecimals(1000000 + 1 + 100, 6)) // total reserves + liquidity fee - funding rate
            expect(settlementResponse[7].toString()).toBe("Success") // status
        })

        it("insufficient collateral for protocol fee", async () => {
            const protocolFee = expandDecimals(100, 6)
            const collateral = expandDecimals(50, 6) // less than protocol fee
            const fundingRate = expandDecimals(40, 6) // funding rate in profit
            const totalReserves = expandDecimals(1, 12)
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        protocolFee, // protocol fee - larger than collateral + funding rate
                        0, // liquidity fee
                        0, // liquidation fee
                        fundingRate, // funding rate
                        true, // funding rate in profit (added to collateral first)
                        0, // pnl delta
                        true, // pnl delta in profit
                        collateral, // collateral
                        totalReserves, // total reserves
                    )
                    .get()
            ).value
            // Funding rate is added to collateral first (from reserves)
            // Then protocol fee is deducted from the increased collateral
            const collateralAfterFunding = (BigInt(collateral) + BigInt(fundingRate)).toString()
            const expectedProtocolFee = collateralAfterFunding // protocol fee cut to available collateral
            expect(settlementResponse[0].toString()).toBe(expectedProtocolFee) // protocol fee cut
            expect(settlementResponse[3].toString()).toBe(fundingRate) // funding rate full (enough reserves)
            expect(settlementResponse[5].toString()).toBe("0") // collateral becomes 0 after protocol fee
            expect(settlementResponse[6].toString()).toBe((BigInt(totalReserves) - BigInt(fundingRate)).toString()) // reserves decreased by funding rate
            expect(settlementResponse[7].toString()).toBe("InsufficientCollateral") // status
        })

        it("insufficient reserves for funding rate profit", async () => {
            const fundingRate = expandDecimals(100, 8)
            const totalReserves = expandDecimals(50, 8) // less than funding rate
            const collateral = expandDecimals(1, 10)
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        expandDecimals(1, 6), // protocol fee
                        0, // liquidity fee
                        0, // liquidation fee
                        fundingRate, // funding rate - larger than reserves
                        true, // funding rate in profit
                        0, // pnl delta
                        true, // pnl delta in profit
                        collateral, // collateral
                        totalReserves, // total reserves
                    )
                    .get()
            ).value
            // Funding rate should be cut to available reserves
            expect(settlementResponse[3].toString()).toBe(totalReserves) // funding rate cut
            expect(settlementResponse[6].toString()).toBe("0") // reserves become 0
            expect(settlementResponse[7].toString()).toBe("InsufficientReserves") // status
        })

        it("insufficient collateral for funding rate loss", async () => {
            const fundingRate = expandDecimals(100, 8)
            const protocolFee = expandDecimals(50, 6)
            const collateral = expandDecimals(80, 6) // less than protocol fee + funding rate
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        protocolFee, // protocol fee
                        0, // liquidity fee
                        0, // liquidation fee
                        fundingRate, // funding rate
                        false, // funding rate in loss (goes from collateral to reserves)
                        0, // pnl delta
                        true, // pnl delta in profit
                        collateral, // collateral
                        expandDecimals(1, 12), // total reserves
                    )
                    .get()
            ).value
            // Protocol fee takes priority, then funding rate gets cut
            expect(settlementResponse[0].toString()).toBe(protocolFee) // protocol fee full
            const remainingCollateral = (BigInt(collateral) - BigInt(protocolFee)).toString()
            expect(settlementResponse[3].toString()).toBe(remainingCollateral) // funding rate cut
            expect(settlementResponse[5].toString()).toBe("0") // collateral becomes 0
            expect(settlementResponse[7].toString()).toBe("InsufficientCollateral") // status
        })
    })

    describe("decrease position", () => {
        it("normal case, pnl_delta in profit", async () => {
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        expandDecimals(1, 6), // protocol fee
                        0, // liquidity fee - zero when decreasing position
                        0, // liquidation fee - zero when decreasing position
                        expandDecimals(1, 8), // funding rate
                        true, // funding rate in profit
                        expandDecimals(5, 8), // pnl delta
                        true, // pnl delta in profit
                        expandDecimals(1, 10), // collateral
                        expandDecimals(1, 12), // total reserves
                    )
                    .get()
            ).value
            expect(settlementResponse[0].toString()).toBe(expandDecimals(1, 6)) // protocol fee
            expect(settlementResponse[1].toString()).toBe("0") // liquidity fee
            expect(settlementResponse[2].toString()).toBe("0") // liquidation fee
            expect(settlementResponse[3].toString()).toBe(expandDecimals(1, 8)) // funding rate
            expect(settlementResponse[4].toString()).toBe(expandDecimals(5, 8)) // pnl delta
            expect(settlementResponse[5].toString()).toBe(expandDecimals(10000 - 1 + 100 + 500, 6)) // collateral - protocol fee + funding rate + pnl delta
            expect(settlementResponse[6].toString()).toBe(expandDecimals(1000000 - 100 - 500, 6)) // total reserves - funding rate - pnl delta
            expect(settlementResponse[7].toString()).toBe("Success") // status
        })

        it("normal case, pnl_delta in loss", async () => {
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        expandDecimals(1, 6), // protocol fee
                        0, // liquidity fee
                        0, // liquidation fee
                        expandDecimals(1, 8), // funding rate
                        false, // funding rate in loss
                        expandDecimals(5, 8), // pnl delta
                        false, // pnl delta in loss
                        expandDecimals(1, 10), // collateral
                        expandDecimals(1, 12), // total reserves
                    )
                    .get()
            ).value
            expect(settlementResponse[0].toString()).toBe(expandDecimals(1, 6)) // protocol fee
            expect(settlementResponse[1].toString()).toBe("0") // liquidity fee
            expect(settlementResponse[2].toString()).toBe("0") // liquidation fee
            expect(settlementResponse[3].toString()).toBe(expandDecimals(1, 8)) // funding rate
            expect(settlementResponse[4].toString()).toBe(expandDecimals(5, 8)) // pnl delta
            expect(settlementResponse[5].toString()).toBe(expandDecimals(10000 - 1 - 100 - 500, 6)) // collateral - protocol fee - funding rate - pnl delta
            expect(settlementResponse[6].toString()).toBe(expandDecimals(1000000 + 100 + 500, 6)) // total reserves + funding rate + pnl delta
            expect(settlementResponse[7].toString()).toBe("Success") // status
        })

        it("normal case, mixed pnl_delta profit and funding rate loss", async () => {
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        expandDecimals(1, 6), // protocol fee
                        0, // liquidity fee
                        0, // liquidation fee
                        expandDecimals(1, 8), // funding rate
                        false, // funding rate in loss
                        expandDecimals(5, 8), // pnl delta
                        true, // pnl delta in profit
                        expandDecimals(1, 10), // collateral
                        expandDecimals(1, 12), // total reserves
                    )
                    .get()
            ).value
            expect(settlementResponse[0].toString()).toBe(expandDecimals(1, 6)) // protocol fee
            expect(settlementResponse[3].toString()).toBe(expandDecimals(1, 8)) // funding rate
            expect(settlementResponse[4].toString()).toBe(expandDecimals(5, 8)) // pnl delta
            // collateral: 10000 - 1 (protocol) - 100 (funding loss) + 500 (pnl profit) = 10399
            expect(settlementResponse[5].toString()).toBe(expandDecimals(10399, 6))
            // reserves: 1000000 - 500 (pnl profit) + 100 (funding loss) = 999600
            expect(settlementResponse[6].toString()).toBe(expandDecimals(999600, 6))
            expect(settlementResponse[7].toString()).toBe("Success") // status
        })

        it("insufficient reserves for pnl_delta profit", async () => {
            const pnlDelta = expandDecimals(100, 8)
            const totalReserves = expandDecimals(50, 8) // less than pnl_delta
            const collateral = expandDecimals(1, 10)
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        expandDecimals(1, 6), // protocol fee
                        0, // liquidity fee
                        0, // liquidation fee
                        0, // funding rate
                        true, // funding rate in profit
                        pnlDelta, // pnl delta - larger than reserves
                        true, // pnl delta in profit
                        collateral, // collateral
                        totalReserves, // total reserves
                    )
                    .get()
            ).value
            // Pnl delta should be cut to available reserves
            expect(settlementResponse[4].toString()).toBe(totalReserves) // pnl delta cut
            expect(settlementResponse[6].toString()).toBe("0") // reserves become 0
            expect(settlementResponse[7].toString()).toBe("InsufficientReserves") // status
        })

        it("insufficient collateral for pnl_delta loss", async () => {
            const protocolFee = expandDecimals(50, 6)
            const pnlDelta = expandDecimals(100, 8)
            const collateral = expandDecimals(80, 6) // less than protocol fee + pnl_delta
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        protocolFee, // protocol fee
                        0, // liquidity fee
                        0, // liquidation fee
                        0, // funding rate
                        true, // funding rate in profit
                        pnlDelta, // pnl delta
                        false, // pnl delta in loss (goes from collateral to reserves)
                        collateral, // collateral
                        expandDecimals(1, 12), // total reserves
                    )
                    .get()
            ).value
            // Protocol fee takes priority, then pnl delta gets cut
            expect(settlementResponse[0].toString()).toBe(protocolFee) // protocol fee full
            const remainingCollateral = (BigInt(collateral) - BigInt(protocolFee)).toString()
            expect(settlementResponse[4].toString()).toBe(remainingCollateral) // pnl delta cut
            expect(settlementResponse[5].toString()).toBe("0") // collateral becomes 0
            expect(settlementResponse[7].toString()).toBe("InsufficientCollateral") // status
        })

        it("insufficient reserves for both funding rate and pnl_delta profit", async () => {
            const fundingRate = expandDecimals(50, 8)
            const pnlDelta = expandDecimals(50, 8)
            const totalReserves = expandDecimals(60, 8) // less than funding_rate + pnl_delta
            const collateral = expandDecimals(1, 10)
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        expandDecimals(1, 6), // protocol fee
                        0, // liquidity fee
                        0, // liquidation fee
                        fundingRate, // funding rate
                        true, // funding rate in profit
                        pnlDelta, // pnl delta
                        true, // pnl delta in profit
                        collateral, // collateral
                        totalReserves, // total reserves
                    )
                    .get()
            ).value
            // Funding rate takes priority over pnl_delta, so funding_rate is paid fully, pnl_delta is cut
            expect(settlementResponse[3].toString()).toBe(fundingRate) // funding rate full
            const remainingReserves = (BigInt(totalReserves) - BigInt(fundingRate)).toString()
            expect(settlementResponse[4].toString()).toBe(remainingReserves) // pnl delta cut
            expect(settlementResponse[6].toString()).toBe("0") // reserves become 0
            expect(settlementResponse[7].toString()).toBe("InsufficientReserves") // status
        })

        it("insufficient collateral for both funding rate and pnl_delta loss", async () => {
            const protocolFee = expandDecimals(30, 6)
            const fundingRate = expandDecimals(40, 6)
            const pnlDelta = expandDecimals(50, 6)
            const collateral = expandDecimals(90, 6) // less than protocol_fee + funding_rate + pnl_delta
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        protocolFee, // protocol fee
                        0, // liquidity fee
                        0, // liquidation fee
                        fundingRate, // funding rate
                        false, // funding rate in loss
                        pnlDelta, // pnl delta
                        false, // pnl delta in loss
                        collateral, // collateral
                        expandDecimals(1, 12), // total reserves
                    )
                    .get()
            ).value
            // Protocol fee takes priority, then funding rate, then pnl_delta gets cut
            expect(settlementResponse[0].toString()).toBe(protocolFee) // protocol fee full
            expect(settlementResponse[3].toString()).toBe(fundingRate) // funding rate full
            const remainingCollateral = (BigInt(collateral) - BigInt(protocolFee) - BigInt(fundingRate)).toString()
            expect(settlementResponse[4].toString()).toBe(remainingCollateral) // pnl delta cut
            expect(settlementResponse[5].toString()).toBe("0") // collateral becomes 0
            expect(settlementResponse[7].toString()).toBe("InsufficientCollateral") // status
        })
    })

    describe("liquidation", () => {
        it("normal case with liquidation fee", async () => {
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        expandDecimals(1, 6), // protocol fee
                        0, // liquidity fee
                        expandDecimals(5, 6), // liquidation fee
                        expandDecimals(1, 8), // funding rate
                        true, // funding rate in profit
                        expandDecimals(5, 8), // pnl delta
                        true, // pnl delta in profit
                        expandDecimals(1, 10), // collateral
                        expandDecimals(1, 12), // total reserves
                    )
                    .get()
            ).value
            expect(settlementResponse[0].toString()).toBe(expandDecimals(1, 6)) // protocol fee
            expect(settlementResponse[1].toString()).toBe("0") // liquidity fee
            expect(settlementResponse[2].toString()).toBe(expandDecimals(5, 6)) // liquidation fee
            expect(settlementResponse[3].toString()).toBe(expandDecimals(1, 8)) // funding rate
            expect(settlementResponse[4].toString()).toBe(expandDecimals(5, 8)) // pnl delta
            expect(settlementResponse[5].toString()).toBe(expandDecimals(10000 - 1 - 5 + 100 + 500, 6)) // collateral - protocol fee - liquidation fee + funding rate + pnl delta
            expect(settlementResponse[6].toString()).toBe(expandDecimals(1000000 - 100 - 500, 6)) // total reserves - funding rate - pnl delta
            expect(settlementResponse[7].toString()).toBe("Success") // status
        })

        it("insufficient collateral for liquidation fee", async () => {
            const protocolFee = expandDecimals(50, 6)
            const liquidationFee = expandDecimals(1600, 6) // large enough that even after funding rate and pnl delta are added, it's insufficient
            const fundingRate = expandDecimals(10, 8)
            const pnlDelta = expandDecimals(5, 8)
            const collateral = expandDecimals(80, 6) // less than protocol fee + liquidation fee (but funding rate and pnl delta are added first)
            const totalReserves = expandDecimals(1, 12)
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        protocolFee, // protocol fee
                        0, // liquidity fee
                        liquidationFee, // liquidation fee - larger than remaining collateral after protocol fee
                        fundingRate, // funding rate
                        true, // funding rate in profit (added to collateral first)
                        pnlDelta, // pnl delta
                        true, // pnl delta in profit (added to collateral first)
                        collateral, // collateral
                        totalReserves, // total reserves
                    )
                    .get()
            ).value
            // Funding rate and pnl delta are added to collateral first, then protocol fee takes priority, then liquidation fee gets cut
            const collateralAfterFunding = (BigInt(collateral) + BigInt(fundingRate) + BigInt(pnlDelta)).toString()
            expect(settlementResponse[0].toString()).toBe(protocolFee) // protocol fee full
            const remainingCollateral = (BigInt(collateralAfterFunding) - BigInt(protocolFee)).toString()
            expect(settlementResponse[2].toString()).toBe(remainingCollateral) // liquidation fee cut to remaining collateral
            expect(settlementResponse[3].toString()).toBe(fundingRate) // funding rate full
            expect(settlementResponse[4].toString()).toBe(pnlDelta) // pnl delta full
            expect(settlementResponse[5].toString()).toBe("0") // collateral becomes 0
            expect(settlementResponse[7].toString()).toBe("InsufficientCollateral") // status
        })

        it("insufficient collateral for protocol fee with liquidation fee", async () => {
            const protocolFee = expandDecimals(100, 6)
            const liquidationFee = expandDecimals(50, 6)
            const fundingRate = expandDecimals(20, 6)
            const pnlDelta = expandDecimals(20, 6)
            const collateral = expandDecimals(50, 6) // less than protocol fee (but funding rate and pnl delta are added first)
            const totalReserves = expandDecimals(1, 12)
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        protocolFee, // protocol fee - larger than collateral + funding rate + pnl delta
                        0, // liquidity fee
                        liquidationFee, // liquidation fee
                        fundingRate, // funding rate
                        true, // funding rate in profit (added to collateral first)
                        pnlDelta, // pnl delta
                        true, // pnl delta in profit (added to collateral first)
                        collateral, // collateral
                        totalReserves, // total reserves
                    )
                    .get()
            ).value
            // Funding rate and pnl delta are added to collateral first, then protocol fee gets cut to available collateral
            const collateralAfterFunding = (BigInt(collateral) + BigInt(fundingRate) + BigInt(pnlDelta)).toString()
            const expectedProtocolFee = collateralAfterFunding // protocol fee cut to available collateral
            expect(settlementResponse[0].toString()).toBe(expectedProtocolFee) // protocol fee cut
            expect(settlementResponse[2].toString()).toBe("0") // liquidation fee gets 0 (no collateral left)
            expect(settlementResponse[3].toString()).toBe(fundingRate) // funding rate full
            expect(settlementResponse[4].toString()).toBe(pnlDelta) // pnl delta full
            expect(settlementResponse[5].toString()).toBe("0") // collateral becomes 0
            expect(settlementResponse[7].toString()).toBe("InsufficientCollateral") // status
        })

        it("complex case: insufficient reserves and collateral with all fees", async () => {
            const protocolFee = expandDecimals(60, 6)
            const liquidationFee = expandDecimals(80, 6)
            const fundingRate = expandDecimals(80, 6)
            const pnlDelta = expandDecimals(60, 6)
            const collateral = expandDecimals(60, 6) // less than protocol_fee + liquidation_fee
            const totalReserves = expandDecimals(70, 6) // less than funding_rate + pnl_delta
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        protocolFee, // protocol fee
                        0, // liquidity fee
                        liquidationFee, // liquidation fee
                        fundingRate, // funding rate
                        true, // funding rate in profit
                        pnlDelta, // pnl delta
                        true, // pnl delta in profit
                        collateral, // collateral
                        totalReserves, // total reserves
                    )
                    .get()
            ).value
            // Funding rate and pnl delta are added to collateral first (but reserves are insufficient, so they get cut)
            // Funding rate gets cut to totalReserves, pnl_delta gets 0 (no reserves left)
            // Then protocol fee and liquidation fee are deducted
            const expectedFundingRate = totalReserves // funding rate cut to available reserves
            const expectedPnlDelta = "0" // pnl delta cut to 0 (no reserves left after funding rate)
            expect(settlementResponse[3].toString()).toBe(expectedFundingRate) // funding rate cut
            expect(settlementResponse[4].toString()).toBe(expectedPnlDelta) // pnl delta cut to 0
            // Collateral after receiving funding rate (pnl delta is 0 due to insufficient reserves)
            const collateralAfterFunding = (BigInt(collateral) + BigInt(expectedFundingRate)).toString()
            expect(settlementResponse[0].toString()).toBe(protocolFee) // protocol fee full
            const remainingCollateral = (BigInt(collateralAfterFunding) - BigInt(protocolFee)).toString()
            expect(settlementResponse[2].toString()).toBe(remainingCollateral) // liquidation fee cut
            expect(settlementResponse[5].toString()).toBe("0") // collateral becomes 0
            expect(settlementResponse[6].toString()).toBe("0") // reserves become 0
            // InsufficientCollateral overrides InsufficientReserves
            expect(settlementResponse[7].toString()).toBe("InsufficientCollateral") // status
        })

        it("complex case: all losses with insufficient collateral", async () => {
            const protocolFee = expandDecimals(40, 6)
            const liquidationFee = expandDecimals(30, 6)
            const fundingRate = expandDecimals(50, 6)
            const pnlDelta = expandDecimals(60, 6)
            const collateral = expandDecimals(150, 6) // less than protocol_fee + liquidation_fee + funding_rate + pnl_delta
            const settlementResponse = (
                await vaultExpose.functions
                    .calculate_settlement(
                        protocolFee, // protocol fee
                        0, // liquidity fee
                        liquidationFee, // liquidation fee
                        fundingRate, // funding rate
                        false, // funding rate in loss
                        pnlDelta, // pnl delta
                        false, // pnl delta in loss
                        collateral, // collateral
                        expandDecimals(1, 12), // total reserves
                    )
                    .get()
            ).value
            // Priority: protocol fee, liquidation fee, funding rate, pnl delta
            expect(settlementResponse[0].toString()).toBe(protocolFee) // protocol fee full
            expect(settlementResponse[2].toString()).toBe(liquidationFee) // liquidation fee full
            expect(settlementResponse[3].toString()).toBe(fundingRate) // funding rate full
            const remainingCollateral = (
                BigInt(collateral) -
                BigInt(protocolFee) -
                BigInt(liquidationFee) -
                BigInt(fundingRate)
            ).toString()
            expect(settlementResponse[4].toString()).toBe(remainingCollateral) // pnl delta cut
            expect(settlementResponse[5].toString()).toBe("0") // collateral becomes 0
            expect(settlementResponse[7].toString()).toBe("InsufficientCollateral") // status
        })
    })

    afterAll(async () => {
        launchedNode.cleanup()
    })
})
