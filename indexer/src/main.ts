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
  TotalLiquidity,
  TotalPosition,
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
  const provider = log.account.Address.bits;
  // the user transfers in
  const stableDetla = BigInt(log.base_asset_amount.toString());
  const lpAmountDelta = BigInt(log.lp_asset_amount.toString());
  const fee = BigInt(log.fee.toString());

  const currentLiquidity: Liquidity | null = await ctx.store.findOne(Liquidity, {
    where: { provider, latest: true },
  });
  if (currentLiquidity) {
    currentLiquidity.latest = false;
    await ctx.store.upsert(currentLiquidity);
  }
  // the liquidity pool gets the amount
  const stable = stableDetla - fee;
  const lpAmount = lpAmountDelta;
  const liquidity: Liquidity = new Liquidity({
    id: generateId(receipt, block),
    provider,
    stable,
    lpAmount,
    fee,
    timestamp: getUTCBlockTime(block),
    latest: true,
  });
  await ctx.store.insert(liquidity);

  let totalLiquidity: TotalLiquidity | null = await ctx.store.findOne(TotalLiquidity, {
    where: { id: '1' },
  });
  if (totalLiquidity) {
    totalLiquidity.stable = totalLiquidity.stable + stableDetla - fee;
    totalLiquidity.lpAmount += lpAmountDelta;
    totalLiquidity.lastTimestamp = getUTCBlockTime(block);
    await ctx.store.upsert(totalLiquidity);
  } else {
    totalLiquidity = new TotalLiquidity({
      id: '1',
      stable: stableDetla - fee,
      lpAmount: lpAmountDelta,
      lastTimestamp: getUTCBlockTime(block),
    });
    await ctx.store.insert(totalLiquidity);
  }
}

async function handleRemoveLiquidity(
  receipt: Receipt<{ receipt: { rb: true; data: true } }>,
  block: Block,
  ctx: any
) {
  const logs = vaultInterface.decodeLog(receipt.data!, receipt.rb!.toString());
  const log = logs[0];
  const provider = log.account.Address.bits;
  // the amount transferred out to the user
  const stableDetla = BigInt(log.base_asset_amount.toString());
  const lpAmountDelta = BigInt(log.lp_asset_amount.toString());
  const fee = BigInt(log.fee.toString());

  const currentLiquidity: Liquidity | null = await ctx.store.findOne(Liquidity, {
    where: { provider, latest: true },
  });
  if (!currentLiquidity) {
    throw new Error('Liquidity not found');
  }
  currentLiquidity.latest = false;
  await ctx.store.upsert(currentLiquidity);
  // the amount substracted from the liquidity pool
  // For remove, store the amount removed (base_asset_amount + fee) and lp_asset_amount
  const stable = stableDetla + fee;
  const lpAmount = lpAmountDelta;
  const liquidity: Liquidity = new Liquidity({
    id: generateId(receipt, block),
    provider,
    stable: -stable,
    lpAmount: -lpAmount,
    fee,
    timestamp: getUTCBlockTime(block),
    latest: true,
  });
  await ctx.store.insert(liquidity);

  const totalLiquidity: TotalLiquidity | null = await ctx.store.findOne(TotalLiquidity, {
    where: { id: '1' },
  });
  if (totalLiquidity) {
    totalLiquidity.stable = totalLiquidity.stable - stableDetla - fee;
    totalLiquidity.lpAmount -= lpAmountDelta;
    totalLiquidity.lastTimestamp = getUTCBlockTime(block);
    await ctx.store.upsert(totalLiquidity);
  } else {
    throw new Error('Total liquidity not found');
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
  } else {
    // check consistency ?
  }
  const collateralDeltaStr = log.collateral_delta.toString();
  const sizeDeltaStr = log.size_delta.toString();
  const collateralDelta = BigInt(collateralDeltaStr);
  const sizeDelta = BigInt(sizeDeltaStr);
  const positionFeeStr = log.position_fee.toString();
  const positionFee = BigInt(positionFeeStr);
  const fundingRateHasProfit = log.funding_rate_has_profit === true;
  const fundingRateRawStr = log.funding_rate.toString();
  const fundingRate = fundingRateHasProfit ? BigInt(fundingRateRawStr) : -BigInt(fundingRateRawStr);

  const currentPosition: Position | null = await ctx.store.findOne(Position, {
    where: { positionKey: positionKeyRecord, latest: true },
  });
  let collateral;
  let size;
  let realizedFundingRate = BigInt(0);
  let realizedPnl = BigInt(0);
  if (currentPosition) {
    currentPosition.latest = false;
    await ctx.store.upsert(currentPosition);
    collateral = currentPosition.collateralAmount;
    size = currentPosition.size;
    realizedFundingRate = currentPosition.realizedFundingRate;
    realizedPnl = currentPosition.realizedPnl;
  } else {
    collateral = BigInt(0);
    size = BigInt(0);
    realizedFundingRate = BigInt(0);
    realizedPnl = BigInt(0);
  }
  collateral = collateral + collateralDelta + fundingRate - positionFee;
  size += sizeDelta;
  realizedFundingRate += fundingRate;
  const position: Position = new Position({
    id: generateId(receipt, block),
    positionKey,
    collateralAmount: collateral,
    size,
    timestamp: getUTCBlockTime(block),
    latest: true,
    change: PositionChange.INCREASE,
    collateralTransferred: collateralDelta,
    positionFee,
    fundingRate,
    pnlDelta: BigInt(0),
    realizedFundingRate,
    realizedPnl,
  });
  await ctx.store.insert(position);

  let totalPosition: TotalPosition | null = await ctx.store.findOne(TotalPosition, {
    where: { indexAssetId: log.index_asset, isLong: log.is_long },
  });
  if (totalPosition) {
    totalPosition.collateralAmount =
      totalPosition.collateralAmount + collateralDelta + fundingRate - positionFee;
    totalPosition.size += sizeDelta;
    totalPosition.lastTimestamp = getUTCBlockTime(block);
    await ctx.store.upsert(totalPosition);
  } else {
    totalPosition = new TotalPosition({
      id: `${log.index_asset}-${log.is_long}`,
      indexAssetId: log.index_asset,
      isLong: log.is_long,
      collateralAmount: collateral,
      size,
      lastTimestamp: getUTCBlockTime(block),
    });
    await ctx.store.insert(totalPosition);
  }
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
  } else {
    // check consistency ?
  }
  const collateralDeltaStr = log.collateral_delta.toString();
  const sizeDeltaStr = log.size_delta.toString();
  const collateralDelta = BigInt(collateralDeltaStr);
  const sizeDelta = BigInt(sizeDeltaStr);
  const positionFeeStr = log.position_fee.toString();
  const positionFee = BigInt(positionFeeStr);
  const fundingRateHasProfit = log.funding_rate_has_profit === true;
  const fundingRateRawStr = log.funding_rate.toString();
  const fundingRate = fundingRateHasProfit ? BigInt(fundingRateRawStr) : -BigInt(fundingRateRawStr);
  const pnlDeltaHasProfit = log.pnl_delta_has_profit === true;
  const pnlDeltaRawStr = log.pnl_delta.toString();
  const pnlDelta = pnlDeltaHasProfit ? BigInt(pnlDeltaRawStr) : -BigInt(pnlDeltaRawStr);

  const currentPosition: Position | null = await ctx.store.findOne(Position, {
    where: { positionKey: positionKeyRecord, latest: true },
  });
  if (!currentPosition) {
    throw new Error('Position not found');
  }
  currentPosition.latest = false;
  await ctx.store.upsert(currentPosition);

  let collateral = currentPosition.collateralAmount;
  const size = currentPosition.size - sizeDelta;
  const realizedFundingRate = currentPosition.realizedFundingRate + fundingRate;
  const realizedPnl = currentPosition.realizedPnl + pnlDelta;

  collateral = collateral + fundingRate + pnlDelta - positionFee;
  let collateralTransferred;
  if (size === BigInt(0)) {
    // close the position
    collateralTransferred = collateral;
    collateral = BigInt(0);
  } else {
    const collateralTarget = collateral - collateralDelta;
    if (collateral > collateralTarget) {
      collateralTransferred = collateral - collateralTarget;
      collateral = collateralTarget;
    } else {
      collateralTransferred = BigInt(0);
    }
  }

  const position: Position = new Position({
    id: generateId(receipt, block),
    positionKey,
    collateralAmount: collateral,
    size,
    timestamp: getUTCBlockTime(block),
    latest: true,
    change: PositionChange.DECREASE,
    collateralTransferred,
    positionFee,
    fundingRate,
    pnlDelta,
    realizedFundingRate,
    realizedPnl,
  });
  await ctx.store.insert(position);

  const totalPosition: TotalPosition | null = await ctx.store.findOne(TotalPosition, {
    where: { indexAssetId: log.index_asset, isLong: log.is_long },
  });
  if (!totalPosition) {
    throw new Error('Total position not found');
  }
  const collateralDiff = BigInt(currentPosition.collateralAmount) - collateral;
  totalPosition.collateralAmount -= collateralDiff;
  totalPosition.size -= sizeDelta;
  totalPosition.lastTimestamp = getUTCBlockTime(block);
  await ctx.store.upsert(totalPosition);
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

  const collateralDeltaStr = log.collateral.toString();
  const sizeDeltaStr = log.size.toString();
  const collateralDelta = BigInt(collateralDeltaStr);
  const sizeDelta = BigInt(sizeDeltaStr);
  const positionFeeStr = log.position_fee.toString();
  const positionFee = BigInt(positionFeeStr);
  const liquidationFeeStr = log.liquidation_fee.toString();
  const liquidationFee = BigInt(liquidationFeeStr);
  const fundingRateHasProfit = log.funding_rate_has_profit === true;
  const fundingRateRawStr = log.funding_rate.toString();
  const fundingRate = fundingRateHasProfit ? BigInt(fundingRateRawStr) : -BigInt(fundingRateRawStr);
  const pnlDeltaHasProfit = log.pnl_delta_has_profit === true;
  const pnlDeltaRawStr = log.pnl_delta.toString();
  const pnlDelta = pnlDeltaHasProfit ? BigInt(pnlDeltaRawStr) : -BigInt(pnlDeltaRawStr);

  const currentPosition: Position | null = await ctx.store.findOne(Position, {
    where: { positionKey: positionKeyRecord, latest: true },
  });
  if (!currentPosition) {
    throw new Error('Position not found');
  }
  currentPosition.latest = false;
  await ctx.store.upsert(currentPosition);

  const realizedFundingRate = currentPosition.realizedFundingRate + fundingRate;
  const realizedPnl = currentPosition.realizedPnl + pnlDelta;
  // must be: currentPosition.collateralAmount == collateralDelta
  // must be: currentPosition.size == sizeDelta
  const position: Position = new Position({
    id: generateId(receipt, block),
    positionKey,
    collateralAmount: BigInt(0),
    size: BigInt(0),
    timestamp: getUTCBlockTime(block),
    latest: true,
    change: PositionChange.LIQUIDATE,
    collateralTransferred: liquidationFee,
    positionFee,
    fundingRate,
    pnlDelta,
    realizedFundingRate,
    realizedPnl,
  });
  // verify empty position
  await ctx.store.insert(position);

  const totalPosition: TotalPosition | null = await ctx.store.findOne(TotalPosition, {
    where: { indexAssetId: log.index_asset, isLong: log.is_long },
  });
  if (!totalPosition) {
    throw new Error('Total position not found');
  }
  totalPosition.collateralAmount -= collateralDelta;
  totalPosition.size -= sizeDelta;
  totalPosition.lastTimestamp = getUTCBlockTime(block);
  await ctx.store.upsert(totalPosition);
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
