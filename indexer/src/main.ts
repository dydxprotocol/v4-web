import { run } from '@subsquid/batch-processor';
import { Block, Receipt, augmentBlock } from '@subsquid/fuel-objects';
import { DataSourceBuilder } from '@subsquid/fuel-stream';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import { BN, DateTime, Interface } from 'fuels';
import priceOracleAbi from './abis/stork-mock-abi.json' with { type: 'json' };
import vaultAbi from './abis/vault-abi.json' with { type: 'json' };
import {
  Liquidity,
  Position,
  PositionChange,
  PositionKey,
  Price,
} from './model/generated/index.js';

export const priceOracleInterface = new Interface(priceOracleAbi);
export const vaultInterface = new Interface(vaultAbi);

// Environment variables
export const GATEWAY_URL = process.env.GATEWAY_URL ?? '';
export const GRAPHQL_URL = process.env.GRAPHQL_URL ?? '';
export const VAULT_PRICEFEED_ADDRESS = process.env.VAULT_PRICEFEED_ADDRESS ?? '';
export const VAULT_ADDRESS = process.env.VAULT_ADDRESS ?? '';
export const FROM_BLOCK = process.env.FROM_BLOCK ?? '';

const LOG_TYPE_SET_PRICE = 'enum stork_sway_sdk::events::StorkEvent';
const LOG_TYPE_ADD_LIQUIDITY = 'struct events::AddLiquidity';
const LOG_TYPE_REMOVE_LIQUIDITY = 'struct events::RemoveLiquidity';
const LOG_TYPE_REGISTER_POSITION_BY_KEY = 'struct events::RegisterPositionByKey';
const LOG_TYPE_INCREASE_POSITION = 'struct events::IncreasePosition';
const LOG_TYPE_DECREASE_POSITION = 'struct events::DecreasePosition';
const LOG_TYPE_CLOSE_POSITION = 'struct events::ClosePosition';
const LOG_TYPE_LIQUIDATE_POSITION = 'struct events::LiquidatePosition';

if (!GRAPHQL_URL || !VAULT_PRICEFEED_ADDRESS || !VAULT_ADDRESS) {
  throw new Error('Environment variables not set');
}

let dataSourceBuilder = new DataSourceBuilder()
  .setGraphql({
    url: GRAPHQL_URL,
    strideConcurrency: 3,
    strideSize: 10,
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
  });

if (GATEWAY_URL) {
  dataSourceBuilder = dataSourceBuilder.setGateway(GATEWAY_URL);
}

if (FROM_BLOCK) {
  dataSourceBuilder = dataSourceBuilder.setBlockRange({ from: parseInt(FROM_BLOCK, 10) });
}

const dataSource = dataSourceBuilder.build();

const database = new TypeormDatabase();

const typeNameByLogId: Record<number, string> = {};
priceOracleAbi.loggedTypes.forEach((loggedType) => {
  const logId = loggedType.logId;
  const concreteTypeId = loggedType.concreteTypeId;
  const typeName = priceOracleAbi.concreteTypes.find(
    (concreteType) => concreteType.concreteTypeId === concreteTypeId
  )?.type;
  if (typeName) {
    typeNameByLogId[Number(logId)] = typeName;
  }
});
vaultAbi.loggedTypes.forEach((loggedType) => {
  const logId = loggedType.logId;
  const concreteTypeId = loggedType.concreteTypeId;
  const typeName = vaultAbi.concreteTypes.find(
    (concreteType) => concreteType.concreteTypeId === concreteTypeId
  )?.type;
  if (typeName) {
    typeNameByLogId[Number(logId)] = typeName;
  }
});
// Check if all expected log types are present in the type name by log id map
[
  LOG_TYPE_SET_PRICE,
  LOG_TYPE_ADD_LIQUIDITY,
  LOG_TYPE_REMOVE_LIQUIDITY,
  LOG_TYPE_REGISTER_POSITION_BY_KEY,
  LOG_TYPE_INCREASE_POSITION,
  LOG_TYPE_DECREASE_POSITION,
  LOG_TYPE_CLOSE_POSITION,
  LOG_TYPE_LIQUIDATE_POSITION,
].forEach((logType) => {
  if (!Object.values(typeNameByLogId).includes(logType)) {
    throw new Error(`Log type ${logType} not found`);
  }
});

function getUTCBlockTime(block: Block): number {
  return DateTime.fromTai64(block.header.time.toString()).toUnixSeconds();
}

function generateId(receipt: Receipt<{ receipt: { rb: true; data: true } }>, block: Block): string {
  return `${block.header.height}-${receipt.transactionIndex}-${receipt.index}`;
}

async function handlePriceUpdate(
  receipt: Receipt<{ receipt: { rb: true; data: true } }>,
  block: Block,
  ctx: any
) {
  const logs = priceOracleInterface.decodeLog(receipt.data!, receipt.rb!.toString());
  const log = logs[0];
  const [asset, value] = log.ValueUpdate;
  const underlying = value.quantized_value.underlying;
  const priceValue = underlying.upper
    .mul(new BN('18446744073709551616'))
    .add(underlying.lower)
    .sub(new BN('170141183460469231731687303715884105728'))
    .abs();
  const timestampNs = BigInt(value.timestamp_ns.toString());
  const timestampSec = Number(timestampNs / 1_000_000_000n);
  const price: Price = new Price({
    id: generateId(receipt, block),
    asset,
    price: BigInt(priceValue.toString()),
    timestamp: timestampSec,
  });
  await ctx.store.insert(price);
}

async function handleAddLiquidity(
  receipt: Receipt<{ receipt: { rb: true; data: true } }>,
  block: Block,
  ctx: any
) {
  const logs = vaultInterface.decodeLog(receipt.data!, receipt.rb!.toString());
  const log = logs[0];
  const account = log.account.Address.bits;
  // the user transfers in
  const baseAssetIn = BigInt(log.base_asset_amount.toString());
  const lpAsset = BigInt(log.lp_asset_amount.toString());
  const fee = BigInt(log.fee.toString());

  const currentLiquidity: Liquidity | null = await ctx.store.findOne(Liquidity, {
    where: { account, latest: true },
  });
  let lpAssetBalance = lpAsset;
  const baseAsset = baseAssetIn - fee;
  if (currentLiquidity) {
    currentLiquidity.latest = false;
    await ctx.store.upsert(currentLiquidity);
    lpAssetBalance = currentLiquidity.lpAssetBalance + lpAsset;
  }
  const liquidity: Liquidity = new Liquidity({
    id: generateId(receipt, block),
    account,
    lpAssetBalance,
    baseAsset,
    lpAsset,
    fee,
    timestamp: getUTCBlockTime(block),
    latest: true,
  });
  await ctx.store.insert(liquidity);
}

async function handleRemoveLiquidity(
  receipt: Receipt<{ receipt: { rb: true; data: true } }>,
  block: Block,
  ctx: any
) {
  const logs = vaultInterface.decodeLog(receipt.data!, receipt.rb!.toString());
  const log = logs[0];
  const account = log.account.Address.bits;
  // the amount transferred out to the user
  const baseAssetOut = BigInt(log.base_asset_amount.toString());
  const lpAsset = BigInt(log.lp_asset_amount.toString());
  const fee = BigInt(log.fee.toString());

  const currentLiquidity: Liquidity | null = await ctx.store.findOne(Liquidity, {
    where: { account, latest: true },
  });
  if (!currentLiquidity) {
    throw new Error('Liquidity not found');
  }
  currentLiquidity.latest = false;
  await ctx.store.upsert(currentLiquidity);
  // the amount substracted from the liquidity pool
  const lpAssetBalance = currentLiquidity.lpAssetBalance - lpAsset;
  const baseAsset = baseAssetOut + fee;
  const liquidity: Liquidity = new Liquidity({
    id: generateId(receipt, block),
    account,
    lpAssetBalance,
    baseAsset: -baseAsset,
    lpAsset: -lpAsset,
    fee,
    timestamp: getUTCBlockTime(block),
    latest: true,
  });
  await ctx.store.insert(liquidity);
}

async function handleRegisterPositionByKey(
  receipt: Receipt<{ receipt: { rb: true; data: true } }>,
  _block: Block,
  ctx: any
) {
  const logs = vaultInterface.decodeLog(receipt.data!, receipt.rb!.toString());
  const log = logs[0];
  const positionKey = log.position_key;
  let positionKeyRecord: PositionKey | null = await ctx.store.findOne(PositionKey, {
    where: { id: positionKey },
  });
  if (!positionKeyRecord) {
    positionKeyRecord = new PositionKey({
      id: positionKey,
      account: log.account.Address.bits,
      indexAssetId: log.index_asset,
      isLong: log.is_long,
    });
    await ctx.store.insert(positionKeyRecord);
  }
}

async function handleIncreasePosition(
  receipt: Receipt<{ receipt: { rb: true; data: true } }>,
  block: Block,
  ctx: any
) {
  const logs = vaultInterface.decodeLog(receipt.data!, receipt.rb!.toString());
  const log = logs[0];
  const positionKey = log.key;
  const positionKeyRecord: PositionKey | null = await ctx.store.findOne(PositionKey, {
    where: { id: positionKey },
  });
  if (!positionKeyRecord) {
    throw new Error('Position key not found - need to register position first');
  }
  const collateralDelta = BigInt(log.collateral_delta.toString());
  const sizeDelta = BigInt(log.size_delta.toString());
  const outAveragePrice = BigInt(log.out_average_price.toString());
  const outLiquidityFee = BigInt(log.out_liquidity_fee.toString());
  const outProtocolFee = BigInt(log.out_protocol_fee.toString());
  const fundingRateHasProfit = log.funding_rate_has_profit === true;
  const fundingRateRawStr = log.funding_rate.toString();
  const fundingRate = fundingRateHasProfit ? BigInt(fundingRateRawStr) : -BigInt(fundingRateRawStr);
  const outFundingRateRawStr = log.out_funding_rate.toString();
  const outFundingRate = fundingRateHasProfit ? BigInt(outFundingRateRawStr) : -BigInt(outFundingRateRawStr);
  const pnlDeltaHasProfit = log.pnl_delta_has_profit === true;
  const pnlDeltaRawStr = log.pnl_delta.toString();
  const pnlDelta = pnlDeltaHasProfit ? BigInt(pnlDeltaRawStr) : -BigInt(pnlDeltaRawStr);
  const outPnlDeltaRawStr = log.out_pnl_delta.toString();
  const outPnlDelta = pnlDeltaHasProfit ? BigInt(outPnlDeltaRawStr) : -BigInt(outPnlDeltaRawStr);

  const currentPosition: Position | null = await ctx.store.findOne(Position, {
    where: { positionKey: positionKeyRecord, latest: true },
  });
  let collateral = BigInt(0);
  let size = BigInt(0);
  let realizedFundingRate = BigInt(0);
  let realizedPnl = BigInt(0);
  if (currentPosition) {
    currentPosition.latest = false;
    await ctx.store.upsert(currentPosition);
    // LIQUIDATE and CLOSE are final statuses, so we don't need to aggregate values
    if (currentPosition.change !== PositionChange.LIQUIDATE && currentPosition.change !== PositionChange.CLOSE) {
        collateral = currentPosition.collateral;
        size = currentPosition.size;
        realizedFundingRate = currentPosition.realizedFundingRate;
        realizedPnl = currentPosition.realizedPnl;
      }
  }
  // Aggregate values incrementally
  collateral = collateral + collateralDelta + outFundingRate + outPnlDelta - outLiquidityFee - outProtocolFee;
  size = size + sizeDelta;
  realizedFundingRate = realizedFundingRate + outFundingRate;
  realizedPnl = realizedPnl + outPnlDelta;
  const position: Position = new Position({
    id: generateId(receipt, block),
    positionKey: positionKeyRecord,
    collateral,
    size,
    timestamp: getUTCBlockTime(block),
    latest: true,
    change: PositionChange.INCREASE,
    collateralDelta,
    sizeDelta,
    outAveragePrice,
    outLiquidityFee,
    outProtocolFee,
    outLiquidationFee: BigInt(0),
    fundingRate,
    outFundingRate,
    pnlDelta,
    outPnlDelta,
    outAmount: BigInt(0),
    realizedFundingRate,
    realizedPnl,
  });
  await ctx.store.insert(position);
}

async function handleDecreasePosition(
  receipt: Receipt<{ receipt: { rb: true; data: true } }>,
  block: Block,
  ctx: any
) {
  const logs = vaultInterface.decodeLog(receipt.data!, receipt.rb!.toString());
  const log = logs[0];
  const positionKey = log.key;
  const positionKeyRecord: PositionKey | null = await ctx.store.findOne(PositionKey, {
    where: { id: positionKey },
  });
  if (!positionKeyRecord) {
    throw new Error('Position key not found');
  }
  const collateralDelta = BigInt(log.collateral_delta.toString());
  const sizeDelta = BigInt(log.size_delta.toString());
  const outAveragePrice = BigInt(log.out_average_price.toString());
  const outLiquidityFee = BigInt(log.out_liquidity_fee.toString());
  const outProtocolFee = BigInt(log.out_protocol_fee.toString());
  const fundingRateHasProfit = log.funding_rate_has_profit === true;
  const fundingRateRawStr = log.funding_rate.toString();
  const fundingRate = fundingRateHasProfit ? BigInt(fundingRateRawStr) : -BigInt(fundingRateRawStr);
  const outFundingRateRawStr = log.out_funding_rate.toString();
  const outFundingRate = fundingRateHasProfit ? BigInt(outFundingRateRawStr) : -BigInt(outFundingRateRawStr);
  const pnlDeltaHasProfit = log.pnl_delta_has_profit === true;
  const pnlDeltaRawStr = log.pnl_delta.toString();
  const pnlDelta = pnlDeltaHasProfit ? BigInt(pnlDeltaRawStr) : -BigInt(pnlDeltaRawStr);
  const outPnlDeltaRawStr = log.out_pnl_delta.toString();
  const outPnlDelta = pnlDeltaHasProfit ? BigInt(outPnlDeltaRawStr) : -BigInt(outPnlDeltaRawStr);
  const outAmount = BigInt(log.amount_out.toString());

  const currentPosition: Position | null = await ctx.store.findOne(Position, {
    where: { positionKey: positionKeyRecord, latest: true },
  });
  if (!currentPosition) {
    throw new Error('Position not found');
  }
  currentPosition.latest = false;
  await ctx.store.upsert(currentPosition);

  // Aggregate values incrementally
  const collateral = currentPosition.collateral + outFundingRate + outPnlDelta - outLiquidityFee - outProtocolFee - outAmount;
  const size = currentPosition.size - sizeDelta;
  const realizedFundingRate = currentPosition.realizedFundingRate + outFundingRate;
  const realizedPnl = currentPosition.realizedPnl + outPnlDelta;

  const position: Position = new Position({
    id: generateId(receipt, block),
    positionKey: positionKeyRecord,
    collateral,
    size,
    timestamp: getUTCBlockTime(block),
    latest: true,
    change: PositionChange.DECREASE,
    collateralDelta,
    sizeDelta,
    outAveragePrice,
    outLiquidityFee,
    outProtocolFee,
    outLiquidationFee: BigInt(0),
    fundingRate,
    outFundingRate,
    pnlDelta,
    outPnlDelta,
    outAmount,
    realizedFundingRate,
    realizedPnl,
  });
  await ctx.store.insert(position);
}

// The ClosePosition event goes right after the DecreasePosition event
// so just update the status
async function handleClosePosition(
  receipt: Receipt<{ receipt: { rb: true; data: true } }>,
  _block: Block,
  ctx: any
) {
  const logs = vaultInterface.decodeLog(receipt.data!, receipt.rb!.toString());
  const log = logs[0];
  const positionKey = log.key;
  const positionKeyRecord: PositionKey | null = await ctx.store.findOne(PositionKey, {
    where: { id: positionKey },
  });
  if (!positionKeyRecord) {
    throw new Error('Position key not found');
  }
  const currentPosition: Position | null = await ctx.store.findOne(Position, {
    where: { positionKey: positionKeyRecord, latest: true },
  });
  if (!currentPosition) {
    throw new Error('Position not found');
  }
  currentPosition.change = PositionChange.CLOSE;
  await ctx.store.upsert(currentPosition);
  // verify empty position
}

async function handleLiquidatePosition(
  receipt: Receipt<{ receipt: { rb: true; data: true } }>,
  block: Block,
  ctx: any
) {
  const logs = vaultInterface.decodeLog(receipt.data!, receipt.rb!.toString());
  const log = logs[0];
  const positionKey = log.key;
  const positionKeyRecord: PositionKey | null = await ctx.store.findOne(PositionKey, {
    where: { id: positionKey },
  });
  if (!positionKeyRecord) {
    throw new Error('Position key not found');
  }

  const outLiquidityFee = BigInt(log.out_liquidity_fee.toString());
  const outProtocolFee = BigInt(log.out_protocol_fee.toString());
  const outLiquidationFee = BigInt(log.out_liquidation_fee.toString());
  const fundingRateHasProfit = log.funding_rate_has_profit === true;
  const fundingRateRawStr = log.funding_rate.toString();
  const fundingRate = fundingRateHasProfit ? BigInt(fundingRateRawStr) : -BigInt(fundingRateRawStr);
  const outFundingRateRawStr = log.out_funding_rate.toString();
  const outFundingRate = fundingRateHasProfit ? BigInt(outFundingRateRawStr) : -BigInt(outFundingRateRawStr);
  const pnlDeltaHasProfit = log.pnl_delta_has_profit === true;
  const pnlDeltaRawStr = log.pnl_delta.toString();
  const pnlDelta = pnlDeltaHasProfit ? BigInt(pnlDeltaRawStr) : -BigInt(pnlDeltaRawStr);
  const outPnlDeltaRawStr = log.out_pnl_delta.toString();
  const outPnlDelta = pnlDeltaHasProfit ? BigInt(outPnlDeltaRawStr) : -BigInt(outPnlDeltaRawStr);

  const currentPosition: Position | null = await ctx.store.findOne(Position, {
    where: { positionKey: positionKeyRecord, latest: true },
  });
  if (!currentPosition) {
    throw new Error('Position not found');
  }
  currentPosition.latest = false;
  await ctx.store.upsert(currentPosition);

  // Aggregate values incrementally - position is fully liquidated
  const realizedFundingRate = currentPosition.realizedFundingRate + outFundingRate;
  const realizedPnl = currentPosition.realizedPnl + outPnlDelta;
  // Position is fully liquidated, so collateral and size become 0
  const collateralDelta = currentPosition.collateral + outFundingRate + outPnlDelta - outLiquidityFee - outProtocolFee - outLiquidationFee;
  // LiquidatePosition event does not have out_average_price, so copy from the current position
  const outAveragePrice = currentPosition.outAveragePrice;

  const position: Position = new Position({
    id: generateId(receipt, block),
    positionKey: positionKeyRecord,
    collateral: BigInt(0),
    size: BigInt(0),
    timestamp: getUTCBlockTime(block),
    latest: true,
    change: PositionChange.LIQUIDATE,
    collateralDelta,
    sizeDelta: currentPosition.size,
    outAveragePrice,
    outLiquidityFee,
    outProtocolFee,
    outLiquidationFee,
    fundingRate,
    outFundingRate,
    pnlDelta,
    outPnlDelta,
    outAmount: BigInt(0),
    realizedFundingRate,
    realizedPnl,
  });
  await ctx.store.insert(position);
}

run(dataSource, database, async (ctx) => {
  const blocks = ctx.blocks.map(augmentBlock);

  for (const block of blocks) {
    for (const receipt of block.receipts) {
      if (receipt.contract === undefined) {
        // something went wrong
        continue;
      }
      // vault pricefeed
      if (receipt.contract.toLowerCase() === VAULT_PRICEFEED_ADDRESS.toLowerCase()) {
        const logType = typeNameByLogId[Number(receipt.rb)];
        if (!logType) {
          // drop unsupported event
          continue;
        }
        // events::SetPrice
        if (logType === LOG_TYPE_SET_PRICE) {
          await handlePriceUpdate(receipt, block, ctx);
        } else {
          // drop unsupported event
          continue;
        }
      }
      // vault
      if (receipt.contract.toLowerCase() === VAULT_ADDRESS.toLowerCase()) {
        const logType = typeNameByLogId[Number(receipt.rb)];
        if (!logType) {
          // drop unsupported event
          continue;
        }
        // events::AddLiquidity
        if (logType === LOG_TYPE_ADD_LIQUIDITY) {
          await handleAddLiquidity(receipt, block, ctx);
          // events::RemoveLiquidity
        } else if (logType === LOG_TYPE_REMOVE_LIQUIDITY) {
          await handleRemoveLiquidity(receipt, block, ctx);
          // events::RegisterPositionByKey
        } else if (logType === LOG_TYPE_REGISTER_POSITION_BY_KEY) {
          await handleRegisterPositionByKey(receipt, block, ctx);
          // events::IncreasePosition
        } else if (logType === LOG_TYPE_INCREASE_POSITION) {
          await handleIncreasePosition(receipt, block, ctx);
          // events::DecreasePosition
        } else if (logType === LOG_TYPE_DECREASE_POSITION) {
          await handleDecreasePosition(receipt, block, ctx);
          // events::ClosePosition
        } else if (logType === LOG_TYPE_CLOSE_POSITION) {
          await handleClosePosition(receipt, block, ctx);
          // events::LiquidatePosition
        } else if (logType === LOG_TYPE_LIQUIDATE_POSITION) {
          await handleLiquidatePosition(receipt, block, ctx);
        } else {
          // drop unsupported event
          continue;
        }
      }
    }
  }
});
