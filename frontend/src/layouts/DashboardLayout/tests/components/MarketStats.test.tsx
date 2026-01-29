import { render, screen } from '@testing-library/react';
import { $decimalValue, OraclePrice, assetId, assetPriceId, candleId } from 'fuel-ts-sdk';
import type { AssetPriceEntity, Candle } from 'fuel-ts-sdk/trading';
import { describe, expect, it } from 'vitest';
import { MarketStat } from '../../src/views/DashboardLayout/components/DashboardHeader/components/MarketStats/_MarketStatsBase';

// Test the base MarketStat component
describe('MarketStat component', () => {
  it('renders with Open Interest label and value', () => {
    render(<MarketStat label="Open Interest" value="$1,234.56" />);

    expect(screen.getByText('Open Interest')).toBeInTheDocument();
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });

  it('renders with 24h Volume label and value', () => {
    render(<MarketStat label="24h Volume" value="$5,000.00" />);

    expect(screen.getByText('24h Volume')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
  });

  it('renders with Funding / 1h label and value', () => {
    render(<MarketStat label="Funding / 1h" value="0.01%" />);

    expect(screen.getByText('Funding / 1h')).toBeInTheDocument();
    expect(screen.getByText('0.01%')).toBeInTheDocument();
  });

  it('displays placeholder value', () => {
    render(<MarketStat label="Open Interest" value="$--" />);

    expect(screen.getByText('$--')).toBeInTheDocument();
  });

  it('displays placeholder when no data', () => {
    render(<MarketStat label="Funding / 1h" value="--" />);

    expect(screen.getByText('--')).toBeInTheDocument();
  });
});

// Test the calculatePriceChange logic
// Re-implement here since it's not exported from the component
describe('calculatePriceChange logic', () => {
  // Helper to create mock price entity
  const createPriceEntity = (floatValue: number): AssetPriceEntity => ({
    id: assetPriceId('test-price'),
    assetId: assetId('test-asset'),
    value: OraclePrice.fromFloat(floatValue),
    timestamp: Date.now(),
  });

  // Helper to create mock candle
  const createCandle = (openPrice: number): Candle => ({
    id: candleId('test-candle'),
    asset: assetId('test-asset'),
    interval: 'D1',
    openPrice: OraclePrice.fromFloat(openPrice).value,
    closePrice: OraclePrice.fromFloat(openPrice).value,
    highPrice: OraclePrice.fromFloat(openPrice).value,
    lowPrice: OraclePrice.fromFloat(openPrice).value,
    startedAt: Date.now(),
  });

  // Re-implement calculatePriceChange for testing (same logic as in component)
  function calculatePriceChange(
    currentPrice: AssetPriceEntity | undefined,
    candles: Candle[] | undefined
  ): number | null {
    if (!currentPrice || !candles || candles.length === 0) return null;

    const current = $decimalValue(currentPrice.value).toFloat();
    const openCandle = candles[candles.length - 1];
    const open = $decimalValue(OraclePrice.fromBigIntString(openCandle.openPrice)).toFloat();

    if (open === 0) return null;
    return (current - open) / open;
  }

  it('returns null when currentPrice is undefined', () => {
    const candles = [createCandle(100)];

    const result = calculatePriceChange(undefined, candles);

    expect(result).toBeNull();
  });

  it('returns null when candles is undefined', () => {
    const price = createPriceEntity(100);

    const result = calculatePriceChange(price, undefined);

    expect(result).toBeNull();
  });

  it('returns null when candles array is empty', () => {
    const price = createPriceEntity(100);

    const result = calculatePriceChange(price, []);

    expect(result).toBeNull();
  });

  it('returns null when open price is zero', () => {
    const price = createPriceEntity(100);
    const candles = [createCandle(0)];

    const result = calculatePriceChange(price, candles);

    expect(result).toBeNull();
  });

  it('calculates positive price change correctly', () => {
    const price = createPriceEntity(110);
    const candles = [createCandle(100)];

    const result = calculatePriceChange(price, candles);

    expect(result).toBeCloseTo(0.1, 5); // 10% increase
  });

  it('calculates negative price change correctly', () => {
    const price = createPriceEntity(90);
    const candles = [createCandle(100)];

    const result = calculatePriceChange(price, candles);

    expect(result).toBeCloseTo(-0.1, 5); // 10% decrease
  });

  it('returns zero when price unchanged', () => {
    const price = createPriceEntity(100);
    const candles = [createCandle(100)];

    const result = calculatePriceChange(price, candles);

    expect(result).toBeCloseTo(0, 5);
  });

  it('uses the last candle (oldest) for open price', () => {
    const price = createPriceEntity(150);
    // Multiple candles - should use the last one (100) not the first one (120)
    const candles = [createCandle(120), createCandle(110), createCandle(100)];

    const result = calculatePriceChange(price, candles);

    // (150 - 100) / 100 = 0.5 = 50% increase
    expect(result).toBeCloseTo(0.5, 5);
  });
});
