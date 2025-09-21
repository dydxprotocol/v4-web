import {run} from '@subsquid/batch-processor'
import {augmentBlock, Block, Receipt} from '@subsquid/fuel-objects'
import {DataSourceBuilder, FieldSelection} from '@subsquid/fuel-stream'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import { Interface } from 'fuels';
import {Price, PositionKey, Position, TotalPosition, Liquidity, TotalLiquidity, PositionChange} from './model/generated'
import vaultPricefeedAbi from './abis/vault-pricefeed-abi.json'
import vaultAbi from './abis/vault-abi.json'

export const vaultPricefeedInterface = new Interface(vaultPricefeedAbi);
export const vaultInterface = new Interface(vaultAbi);

// Environment variables
export const GATEWAY_URL = process.env.GATEWAY_URL ?? "";
export const GRAPHQL_URL = process.env.GRAPHQL_URL ?? "";
export const VAULT_PRICEFEED_ADDRESS = process.env.VAULT_PRICEFEED_ADDRESS ?? "";
export const VAULT_ADDRESS = process.env.VAULT_ADDRESS ?? "";
export const FROM_BLOCK = process.env.FROM_BLOCK ?? "";

if (!GATEWAY_URL || !GRAPHQL_URL || !VAULT_PRICEFEED_ADDRESS || !VAULT_ADDRESS || !FROM_BLOCK) {
  throw new Error('Environment variables not set');
}

const dataSource = new DataSourceBuilder()
    .setGateway(GATEWAY_URL)
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
    .setBlockRange({from: 41914611})
    .build()

const database = new TypeormDatabase()

function getUTCBlockTime(block: Block): number {
    return Number(block.header.time - 4611686018427387894n)
}

async function handleVaultPricefeed(receipt: Receipt<{receipt: {rb: true, data: true}}>, _block: Block, ctx: any) {
    const logs = vaultPricefeedInterface.decodeLog(receipt.data!, receipt.rb!.toString())
    const log = logs[0]
    const price: Price = new Price({
        id: receipt.id,
        assetId: log.asset.bits,
        price: log.price.price.toString(),
        timestamp: log.price.publish_time.toNumber(),
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

    const currentPosition: Position = await ctx.store.findOne(Position, { where: { positionKey: positionKey, latest: true }})
    let collateral;
    let size;
    if (currentPosition) {
        currentPosition.latest = false
        await ctx.store.upsert(currentPosition)
        collateral = BigInt(currentPosition.collateralAmout) + collateralDelta
        size = BigInt(currentPosition.size) + sizeDelta
    } else {
        collateral = collateralDelta
        size = sizeDelta
    }
    const position: Position = new Position({
        id: receipt.id,
        positionKey: positionKey,
        collateralAmout: collateral.toString(),
        size: size.toString(),
        timestamp: getUTCBlockTime(block),
        latest: true,
        change: PositionChange.INCREASE,
    })
    await ctx.store.insert(position)

    let totalPosition: TotalPosition = await ctx.store.findOne(TotalPosition, { where: { indexAssetId: log.index_asset.bits, isLong: log.is_long }})
    if (totalPosition) {
        totalPosition.collateralAmout = (BigInt(totalPosition.collateralAmout) + collateralDelta).toString()
        totalPosition.size = (BigInt(totalPosition.size) + sizeDelta).toString()
        totalPosition.lastTimestamp = getUTCBlockTime(block)
        await ctx.store.upsert(totalPosition)
    } else {
        totalPosition = new TotalPosition({
            id: receipt.id, // another value?
            indexAssetId: log.index_asset.bits,
            isLong: log.is_long,
            collateralAmout: collateral.toString(),
            size: size.toString(),
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

    const currentPosition: Position = await ctx.store.findOne(Position, { where: { positionKey: positionKey, latest: true }})
    if (!currentPosition) {
        throw new Error('Position not found')
    }
    currentPosition.latest = false
    await ctx.store.upsert(currentPosition)

    const collateral = BigInt(currentPosition.collateralAmout) - collateralDelta
    const size = BigInt(currentPosition.size) - sizeDelta
    const position: Position = new Position({
        id: receipt.id,
        positionKey: positionKey,
        collateralAmout: collateral.toString(),
        size: size.toString(),
        timestamp: getUTCBlockTime(block),
        latest: true,
        change: PositionChange.DECREASE,
    })
    await ctx.store.insert(position)

    let totalPosition: TotalPosition = await ctx.store.findOne(TotalPosition, { where: { indexAssetId: log.index_asset.bits, isLong: log.is_long }})
    if (totalPosition) {
        totalPosition.collateralAmout = (BigInt(totalPosition.collateralAmout) - collateralDelta).toString()
        totalPosition.size = (BigInt(totalPosition.size) - sizeDelta).toString()
        totalPosition.lastTimestamp = getUTCBlockTime(block)
        await ctx.store.upsert(totalPosition)
    } else {
        totalPosition = new TotalPosition({
            id: receipt.id, // another value?
            indexAssetId: log.index_asset.bits,
            isLong: log.is_long,
            collateralAmout: collateral.toString(),
            size: size.toString(),
            lastTimestamp: getUTCBlockTime(block),
        })
        await ctx.store.insert(totalPosition)
    }
}

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

    const currentPosition: Position = await ctx.store.findOne(Position, { where: { positionKey: positionKey, latest: true }})
    if (!currentPosition) {
        throw new Error('Position not found')
    }
    currentPosition.latest = false
    await ctx.store.upsert(currentPosition)

    const collateral = BigInt(currentPosition.collateralAmout) - collateralDelta
    const size = BigInt(currentPosition.size) - sizeDelta
    const position: Position = new Position({
        id: receipt.id,
        positionKey: positionKey,
        collateralAmout: collateral.toString(),
        size: size.toString(),
        timestamp: getUTCBlockTime(block),
        latest: true,
        change: PositionChange.LIQUIDATE,
    })
    // verify empty position
    await ctx.store.insert(position)

    let totalPosition: TotalPosition = await ctx.store.findOne(TotalPosition, { where: { indexAssetId: log.index_asset.bits, isLong: log.is_long }})
    if (totalPosition) {
        totalPosition.collateralAmout = (BigInt(totalPosition.collateralAmout) - collateralDelta).toString()
        totalPosition.size = (BigInt(totalPosition.size) - sizeDelta).toString()
        totalPosition.lastTimestamp = getUTCBlockTime(block)
        await ctx.store.upsert(totalPosition)
    } else {
        totalPosition = new TotalPosition({
            id: receipt.id, // another value?
            indexAssetId: log.index_asset.bits,
            isLong: log.is_long,
            collateralAmout: collateral.toString(),
            size: size.toString(),
            lastTimestamp: getUTCBlockTime(block),
        })
        await ctx.store.insert(totalPosition)
    }
}


run(dataSource, database, async ctx => {
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
                if (receipt.rb === 14330585920385934824n) {
                    await handleVaultPricefeed(receipt, block, ctx)
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
