import type { AssetPriceEntity, Candle, MarketConfigEntity } from '@/Trading/src/Markets/domain';
import { OraclePrice, PercentageValue } from '@/shared/models/decimals';
import { assetId, assetPriceId, candleId, marketConfigId } from '@/shared/types';

/**
 * Create a test market config
 */
export function createTestMarketConfig(
  overrides: Partial<MarketConfigEntity> = {}
): MarketConfigEntity {
  const base: MarketConfigEntity = {
    id: marketConfigId('test-market-1'),
    asset: assetId('0xbtc'),
    initialMarginFraction: PercentageValue.fromFloat(5),
    maintenanceMarginFraction: PercentageValue.fromFloat(3),
    tickSizeDecimals: 2,
    stepSizeDecimals: 3,
  };
  return { ...base, ...overrides };
}

/**
 * Create a test asset price
 */
export function createTestAssetPrice(overrides: Partial<AssetPriceEntity> = {}): AssetPriceEntity {
  const base: AssetPriceEntity = {
    id: assetPriceId('price-btc-123'),
    assetId: assetId('0xbtc'),
    value: OraclePrice.fromFloat(50000),
    timestamp: Date.now(),
  };
  return { ...base, ...overrides };
}

/**
 * Create a test candle
 */
export function createTestCandle(overrides: Partial<Candle> = {}): Candle {
  const baseTime = Date.now();
  const base: Candle = {
    id: candleId(`candle-${baseTime}`),
    asset: assetId('0xbtc'),
    interval: 'M15' as const,
    startedAt: baseTime,
    openPrice: 50000n,
    closePrice: 50500n,
    highPrice: 51000n,
    lowPrice: 49000n,
  };
  return { ...base, ...overrides };
}

/**
 * Create a series of candles (OHLC data)
 */
export function createCandleSeries(count: number): Candle[] {
  const baseTime = Date.now() - count * 15 * 60 * 1000; // 15 min intervals
  const candles: Candle[] = [];

  for (let i = 0; i < count; i++) {
    const startedAt = baseTime + i * 15 * 60 * 1000;
    candles.push(
      createTestCandle({
        id: candleId(`candle-${startedAt}`),
        startedAt,
        closePrice: 50000n + BigInt(Math.floor(Math.random() * 1000)),
      })
    );
  }

  return candles;
}
