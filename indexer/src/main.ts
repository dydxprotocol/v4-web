import {run} from '@subsquid/batch-processor'
import {augmentBlock, Block, Receipt} from '@subsquid/fuel-objects'
import {DataSourceBuilder, FieldSelection} from '@subsquid/fuel-stream'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import { Interface, BN } from 'fuels';
import {Price, PositionKey, Position, TotalPosition, Liquidity, TotalLiquidity, PositionChange} from './model/generated'
import priceOracleAbi from './abis/stork-mock-abi.json'
import vaultAbi from './abis/vault-abi.json'

export const priceOracleInterface = new Interface(priceOracleAbi);
export const vaultInterface = new Interface(vaultAbi);

// Environment variables
export const GATEWAY_URL = process.env.GATEWAY_URL ?? "";
export const GRAPHQL_URL = process.env.GRAPHQL_URL ?? "";
export const VAULT_PRICEFEED_ADDRESS = process.env.VAULT_PRICEFEED_ADDRESS ?? "";
export const VAULT_ADDRESS = process.env.VAULT_ADDRESS ?? "";
export const FROM_BLOCK = process.env.FROM_BLOCK ?? "";
export const E2E_TEST_LOG = (process.env.E2E_TEST_LOG ?? "0") == "1"; // 0 - no log, 1 - log

if (!GRAPHQL_URL || !VAULT_PRICEFEED_ADDRESS || !VAULT_ADDRESS) {
  throw new Error('Environment variables not set');
}

let dataSourceBuilder = new DataSourceBuilder()
    .setGraphql({
        url: GRAPHQL_URL,
        strideConcurrency: 3,
        strideSize: 10
    })
    .setFields({
        receipt: {
            contract: true,
            receiptType: true,
            rb: true,
            data: true,
        },
        inputs: false,
        outputs: false,
        transactions: true,
    })
    .addReceipt({
        type: ['LOG_DATA'],
        contract: [
            VAULT_PRICEFEED_ADDRESS.toLowerCase(), // vault pricefeed
            VAULT_ADDRESS.toLowerCase(), // vault
        ],
        transaction: true,
    })
    

if (GATEWAY_URL) {
    dataSourceBuilder = dataSourceBuilder.setGateway(GATEWAY_URL)
}

if (FROM_BLOCK) {
    dataSourceBuilder = dataSourceBuilder.setBlockRange({from: parseInt(FROM_BLOCK)})
}

const dataSource = dataSourceBuilder.build()

const database = new TypeormDatabase()

function getUTCBlockTime(block: Block): number {
    // magic constant: TAI64 to UTC
    // the constant may slightly change in years
    return Number(block.header.time - 4611686018427387941n)
}

async function handlePriceUpdate(receipt: Receipt<{receipt: {rb: true, data: true}}>, _block: Block, ctx: any) {
    const logs = priceOracleInterface.decodeLog(receipt.data!, receipt.rb!.toString())
    const log = logs[0]
    const [asset, value] = log.ValueUpdate;
    const underlying = value.quantized_value.underlying;
    const priceValue = underlying.upper.mul(new BN("18446744073709551616"))
        .add(underlying.lower)
        .sub(new BN("170141183460469231731687303715884105728"))
        .abs();
    const price: Price = new Price({
        id: receipt.id,
        asset: asset,
        price: priceValue,
        timestamp: value.timestamp_ns / 1000000000,
    })
    await ctx.store.insert(price)
}

async function handleAddLiquidity(receipt: Receipt<{receipt: {rb: true, data: true}}>, block: Block, ctx: any) {
    const logs = vaultInterface.decodeLog(receipt.data!, receipt.rb!.toString())
    const log = logs[0]
    const provider = log.account.Address.bits
    const stablelDetla = log.stable_asset_amount
    const lpAmountDelta = log.lp_asset_amount

    const currentLiquidity: Liquidity = await ctx.store.findOne(Liquidity, { where: { provider: provider, latest: true }})
    let stable;
    let lpAmount;
    if (currentLiquidity) {
        currentLiquidity.latest = false
        await ctx.store.upsert(currentLiquidity)
        stable = currentLiquidity.stable + stablelDetla
        lpAmount = currentLiquidity.lpAmount + lpAmountDelta
    } else {
        stable = stablelDetla
        lpAmount = lpAmountDelta
    }
    const liquidity: Liquidity = new Liquidity({
        id: receipt.id,
        provider: provider,
        stable: stable,
        lpAmount: lpAmount,
        timestamp: getUTCBlockTime(block),
        latest: true,
    })
    await ctx.store.insert(liquidity)

    let totalLiquidity: TotalLiquidity = await ctx.store.findOne(TotalLiquidity, { where: { id: "1" }})
    if (totalLiquidity) {
        totalLiquidity.stable = totalLiquidity.stable + stablelDetla
        totalLiquidity.lpAmount = totalLiquidity.lpAmount + lpAmountDelta
        totalLiquidity.lastTimestamp = getUTCBlockTime(block)
        await ctx.store.upsert(totalLiquidity)
    } else {
        totalLiquidity = new TotalLiquidity({
            id: "1",
            stable: stablelDetla,
            lpAmount: lpAmountDelta,
            lastTimestamp: getUTCBlockTime(block),
        })
        await ctx.store.insert(totalLiquidity)
    }
}

async function handleRemoveLiquidity(receipt: Receipt<{receipt: {rb: true, data: true}}>, block: Block, ctx: any) {
    const logs = vaultInterface.decodeLog(receipt.data!, receipt.rb!.toString())
    const log = logs[0]
    const provider = log.account.Address.bits
    const stablelDetla = BigInt(log.stable_asset_amount.toString())
    const lpAmountDelta = BigInt(log.lp_asset_amount.toString())

    const currentLiquidity: Liquidity = await ctx.store.findOne(Liquidity, { where: { provider: provider, latest: true }})
    let stable;
    let lpAmount;
    if (currentLiquidity) {
        currentLiquidity.latest = false
        await ctx.store.upsert(currentLiquidity)
        stable = currentLiquidity.stable - stablelDetla
        lpAmount = currentLiquidity.lpAmount - lpAmountDelta
    } else {
        throw new Error('Liquidity not found')
    }
    const liquidity: Liquidity = new Liquidity({
        id: receipt.id,
        provider: provider,
        stable: stable,
        lpAmount: lpAmount,
        timestamp: getUTCBlockTime(block),
        latest: true,
    })
    await ctx.store.insert(liquidity)

    let totalLiquidity: TotalLiquidity = await ctx.store.findOne(TotalLiquidity, { where: { id: "1" }})
    if (totalLiquidity) {
        totalLiquidity.stable = totalLiquidity.stable - stablelDetla
        totalLiquidity.lpAmount = totalLiquidity.lpAmount - lpAmountDelta
        totalLiquidity.lastTimestamp = getUTCBlockTime(block)
        await ctx.store.upsert(totalLiquidity)
    } else {
        totalLiquidity = new TotalLiquidity({
            id: "1",
            stable: stablelDetla,
            lpAmount: lpAmountDelta,
            lastTimestamp: getUTCBlockTime(block),
        })
        await ctx.store.insert(totalLiquidity)
    }
}

async function handleIncreasePosition(receipt: Receipt<{receipt: {rb: true, data: true}}>, block: Block, ctx: any) {
    const logs = vaultInterface.decodeLog(receipt.data!, receipt.rb!.toString())
    const log = logs[0]
    const positionKey = log.position_key.bits
    let positionKeyRecord: PositionKey = await ctx.store.findOne(PositionKey, { where: { id: positionKey }})
    if (!positionKeyRecord) {
        positionKeyRecord = new PositionKey({
            id: positionKey,
            account: log.account.Address.bits,
            indexAssetId: log.index_asset.bits,
            isLong: true,
        })
        await ctx.store.insert(positionKeyRecord)
    } else {
        // check consistency ?
    }
    const collateralDeltaStr = log.collateral_delta.toString()
    const sizeDeltaStr = log.size_delta.toString()
    const collateralDelta = BigInt(collateralDeltaStr)
    const sizeDelta = BigInt(sizeDeltaStr)
    const positionFeeStr = log.position_fee.toString()
    const positionFee = BigInt(positionFeeStr)
    const fundingRateHasProfit = log.funding_rate_has_profit == true
    const fundingRateRawStr = log.funding_rate.toString()
    const fundingRate = fundingRateHasProfit ? BigInt(fundingRateRawStr) : -BigInt(fundingRateRawStr)

    const currentPosition: Position = await ctx.store.findOne(Position, { where: { positionKey: positionKey, latest: true }})
    let collateral;
    let size;
    let realizedFundingRate = BigInt(0)
    let realizedPnl = BigInt(0)
    if (currentPosition) {
        currentPosition.latest = false
        await ctx.store.upsert(currentPosition)
        collateral = currentPosition.collateralAmout
        size = currentPosition.size
        realizedFundingRate = currentPosition.realizedFundingRate
        realizedPnl = currentPosition.realizedPnl
    } else {
        collateral = BigInt(0)
        size = BigInt(0)
        realizedFundingRate = BigInt(0)
        realizedPnl = BigInt(0)
    }
    collateral = collateral + collateralDelta + fundingRate - positionFee
    size = size + sizeDelta
    realizedFundingRate = realizedFundingRate + fundingRate
    const position: Position = new Position({
        id: receipt.id,
        positionKey: positionKey,
        collateralAmout: collateral,
        size: size,
        timestamp: getUTCBlockTime(block),
        latest: true,
        change: PositionChange.INCREASE,
        collateralTransferred: collateralDelta,
        positionFee: positionFee,
        fundingRate: fundingRate,
        pnlDelta: BigInt(0),
        realizedFundingRate: realizedFundingRate,
        realizedPnl: realizedPnl,
    })
    await ctx.store.insert(position)

    let totalPosition: TotalPosition = await ctx.store.findOne(TotalPosition, { where: { indexAssetId: log.index_asset.bits, isLong: log.is_long }})
    if (totalPosition) {
        totalPosition.collateralAmout = totalPosition.collateralAmout + collateralDelta + fundingRate - positionFee
        totalPosition.size = totalPosition.size + sizeDelta
        totalPosition.lastTimestamp = getUTCBlockTime(block)
        await ctx.store.upsert(totalPosition)
    } else {
        totalPosition = new TotalPosition({
            id: receipt.id, // another value?
            indexAssetId: log.index_asset.bits,
            isLong: log.is_long,
            collateralAmout: collateral,
            size: size,
            lastTimestamp: getUTCBlockTime(block),
        })
        await ctx.store.insert(totalPosition)
    }
}

async function handleDecreasePosition(receipt: Receipt<{receipt: {rb: true, data: true}}>, block: Block, ctx: any) {
    const logs = vaultInterface.decodeLog(receipt.data!, receipt.rb!.toString())
    const log = logs[0]
    const positionKey = log.position_key.bits
    let positionKeyRecord: PositionKey = await ctx.store.findOne(PositionKey, { where: { id: positionKey }})
    if (!positionKeyRecord) {
        throw new Error('Position key not found')
    } else {
        // check consistency ?
    }
    const collateralDeltaStr = log.collateral_delta.toString()
    const sizeDeltaStr = log.size_delta.toString()
    const collateralDelta = BigInt(collateralDeltaStr)
    const sizeDelta = BigInt(sizeDeltaStr)
    const positionFeeStr = log.position_fee.toString()
    const positionFee = BigInt(positionFeeStr)
    const fundingRateHasProfit = log.funding_rate_has_profit == true
    const fundingRateRawStr = log.funding_rate.toString()
    const fundingRate = fundingRateHasProfit ? BigInt(fundingRateRawStr) : -BigInt(fundingRateRawStr)
    const pnlDeltaHasProfit = log.pnl_delta_has_profit == true
    const pnlDeltaRawStr = log.pnl_delta.toString()
    const pnlDelta = pnlDeltaHasProfit ? BigInt(pnlDeltaRawStr) : -BigInt(pnlDeltaRawStr)

    const currentPosition: Position = await ctx.store.findOne(Position, { where: { positionKey: positionKey, latest: true }})
    if (!currentPosition) {
        throw new Error('Position not found')
    }
    currentPosition.latest = false
    await ctx.store.upsert(currentPosition)

    let collateral = currentPosition.collateralAmout
    const size = currentPosition.size - sizeDelta
    const realizedFundingRate = currentPosition.realizedFundingRate + fundingRate
    const realizedPnl = currentPosition.realizedPnl + pnlDelta

    collateral = collateral + fundingRate + pnlDelta - positionFee
    let collateralTransferred
    if (size == BigInt(0)) {
        // close the position
        collateralTransferred = collateral
        collateral = BigInt(0)
    } else {
        const collateralTarget = collateral - collateralDelta
        if (collateral > collateralTarget) {
            collateralTransferred = collateral - collateralTarget
            collateral = collateralTarget
        } else {
            collateralTransferred = BigInt(0)
        }
    }

    const position: Position = new Position({
        id: receipt.id,
        positionKey: positionKey,
        collateralAmout: collateral,
        size: size,
        timestamp: getUTCBlockTime(block),
        latest: true,
        change: PositionChange.DECREASE,
        collateralTransferred: collateralTransferred,
        positionFee: positionFee,
        fundingRate: fundingRate,
        pnlDelta: pnlDelta,
        realizedFundingRate: realizedFundingRate,
        realizedPnl: realizedPnl,
    })
    await ctx.store.insert(position)

    let totalPosition: TotalPosition = await ctx.store.findOne(TotalPosition, { where: { indexAssetId: log.index_asset.bits, isLong: log.is_long }})
    if (!totalPosition) {
        throw new Error('Total position not found')
    }
    const collateralDiff = BigInt(currentPosition.collateralAmout) - collateral
    totalPosition.collateralAmout = totalPosition.collateralAmout - collateralDiff
    totalPosition.size = totalPosition.size - sizeDelta
    totalPosition.lastTimestamp = getUTCBlockTime(block)
    await ctx.store.upsert(totalPosition)
}

// The ClosePosition event goes right after the DecreasePosition event
// so just update the status
async function handleClosePosition(receipt: Receipt<{receipt: {rb: true, data: true}}>, block: Block, ctx: any) {
    const logs = vaultInterface.decodeLog(receipt.data!, receipt.rb!.toString())
    const log = logs[0]
    const positionKey = log.position_key.bits
    let positionKeyRecord: PositionKey = await ctx.store.findOne(PositionKey, { where: { id: positionKey }})
    if (!positionKeyRecord) {
        throw new Error('Position key not found')
    }
    const currentPosition: Position = await ctx.store.findOne(Position, { where: { positionKey: positionKey, latest: true }})
    if (!currentPosition) {
        throw new Error('Position not found')
    }
    currentPosition.change = PositionChange.CLOSE
    await ctx.store.upsert(currentPosition)
    // verify empty position
}

async function handleLiquidatePosition(receipt: Receipt<{receipt: {rb: true, data: true}}>, block: Block, ctx: any) {
    const logs = vaultInterface.decodeLog(receipt.data!, receipt.rb!.toString())
    const log = logs[0]
    const positionKey = log.position_key.bits
    let positionKeyRecord: PositionKey = await ctx.store.findOne(PositionKey, { where: { id: positionKey }})
    if (!positionKeyRecord) {
        throw new Error('Position key not found')
    }

    const collateralDeltaStr = log.collateral.toString()
    const sizeDeltaStr = log.size.toString()
    const collateralDelta = BigInt(collateralDeltaStr)
    const sizeDelta = BigInt(sizeDeltaStr)
    const positionFeeStr = log.position_fee.toString()
    const positionFee = BigInt(positionFeeStr)
    const liquidationFeeStr = log.liquidation_fee.toString()
    const liquidationFee = BigInt(liquidationFeeStr)
    const fundingRateHasProfit = log.funding_rate_has_profit == true
    const fundingRateRawStr = log.funding_rate.toString()
    const fundingRate = fundingRateHasProfit ? BigInt(fundingRateRawStr) : -BigInt(fundingRateRawStr)
    const pnlDeltaHasProfit = log.pnl_delta_has_profit == true
    const pnlDeltaRawStr = log.pnl_delta.toString()
    const pnlDelta = pnlDeltaHasProfit ? BigInt(pnlDeltaRawStr) : -BigInt(pnlDeltaRawStr)

    const currentPosition: Position = await ctx.store.findOne(Position, { where: { positionKey: positionKey, latest: true }})
    if (!currentPosition) {
        throw new Error('Position not found')
    }
    currentPosition.latest = false
    await ctx.store.upsert(currentPosition)

    const realizedFundingRate = currentPosition.realizedFundingRate + fundingRate
    const realizedPnl = currentPosition.realizedPnl + pnlDelta
    // must be: currentPosition.collateralAmout == collateralDelta
    // must be: currentPosition.size == sizeDelta
    const position: Position = new Position({
        id: receipt.id,
        positionKey: positionKey,
        collateralAmout: BigInt(0),
        size: BigInt(0),
        timestamp: getUTCBlockTime(block),
        latest: true,
        change: PositionChange.LIQUIDATE,
        collateralTransferred: liquidationFee,
        positionFee: positionFee,
        fundingRate: fundingRate,
        pnlDelta: pnlDelta,
        realizedFundingRate: realizedFundingRate,
        realizedPnl: realizedPnl,
    })
    // verify empty position
    await ctx.store.insert(position)

    let totalPosition: TotalPosition = await ctx.store.findOne(TotalPosition, { where: { indexAssetId: log.index_asset.bits, isLong: log.is_long }})
    if (!totalPosition) {
        throw new Error('Total position not found')
    }
    totalPosition.collateralAmout = totalPosition.collateralAmout - collateralDelta //TODO
    totalPosition.size = totalPosition.size - sizeDelta
    totalPosition.lastTimestamp = getUTCBlockTime(block)
    await ctx.store.upsert(totalPosition)
}


run(dataSource, database, async ctx => {
    if (E2E_TEST_LOG) {
        // E2E test log indicating that the indexer started successfully
        console.log("Indexer run started")
    }
    let blocks = ctx.blocks.map(augmentBlock)

    for (let block of blocks) {
        for (let receipt of block.receipts) {
            if (receipt.contract === undefined) {
                // something went wrong
                continue
            }
            // vault pricefeed
            if (receipt.contract.toLowerCase() === VAULT_PRICEFEED_ADDRESS.toLowerCase()) {
                // events::SetPrice
                if (receipt.rb === 6508751692018611352n) {
                    await handlePriceUpdate(receipt, block, ctx)
                } else {
                    // drop unsupported event
                    continue
                }
            }
            // vault
            if (receipt.contract.toLowerCase() === VAULT_ADDRESS.toLowerCase()) {
                // events::AddLiquidity
                if (receipt.rb === 3102420689146076761n) {
                    await handleAddLiquidity(receipt, block, ctx)
                // events::RemoveLiquidity
                } else if (receipt.rb === 683494322165434932n) {
                    await handleRemoveLiquidity(receipt, block, ctx)
                // events::IncreasePosition
                } else if (receipt.rb === 16595060151443604364n) {
                    await handleIncreasePosition(receipt, block, ctx)
                // events::DecreasePosition
                } else if (receipt.rb === 17276184846747919138n) {
                    await handleDecreasePosition(receipt, block, ctx)
                // events::ClosePosition
                } else if (receipt.rb === 1607443183907089103n) {
                    await handleClosePosition(receipt, block, ctx)
                // events::LiquidatePosition
                } else if (receipt.rb === 7908178656321864902n) {
                    await handleLiquidatePosition(receipt, block, ctx)
                } else {
                    // drop unsupported event
                    continue
                }
            }
        }
    }
})
