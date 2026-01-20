import { $decimalValue } from '@sdk/shared/models/DecimalValue';
import { describe, expect, it } from 'vitest';
import { calculateTotalSize } from '../../src/Positions/domain/calculations/calculateTotalSize';
import { PositionSize } from '../../src/Positions/domain/positionsDecimals';
import { createOpenLongPosition, createOpenShortPosition } from '../test-fixtures/positions';

describe('calculateTotalSize', () => {
  it('returns zero for empty array', () => {
    const result = calculateTotalSize([]);

    expect(result.value).toBe('0');
    expect(result.decimals).toBe(6);
  });

  it('returns size of single position', () => {
    const positions = [createOpenLongPosition({ size: PositionSize.fromFloat(1000) })];

    const result = calculateTotalSize(positions);

    expect($decimalValue(result).toFloat()).toBeCloseTo(1000, 2);
  });

  it('sums sizes of multiple positions', () => {
    const positions = [
      createOpenLongPosition({ size: PositionSize.fromFloat(1000) }),
      createOpenLongPosition({ size: PositionSize.fromFloat(2000) }),
      createOpenLongPosition({ size: PositionSize.fromFloat(500) }),
    ];

    const result = calculateTotalSize(positions);

    expect($decimalValue(result).toFloat()).toBeCloseTo(3500, 2);
  });

  it('handles positions with different sides', () => {
    const positions = [
      createOpenLongPosition({ size: PositionSize.fromFloat(1000) }),
      createOpenShortPosition({ size: PositionSize.fromFloat(2000) }),
    ];

    const result = calculateTotalSize(positions);

    // Both sizes are positive values, so they add up
    expect($decimalValue(result).toFloat()).toBeCloseTo(3000, 2);
  });

  it('handles very small sizes', () => {
    const positions = [
      createOpenLongPosition({ size: PositionSize.fromFloat(0.000001) }),
      createOpenLongPosition({ size: PositionSize.fromFloat(0.000002) }),
    ];

    const result = calculateTotalSize(positions);

    expect($decimalValue(result).toFloat()).toBeCloseTo(0.000003, 6);
  });

  it('handles large sizes', () => {
    const positions = [
      createOpenLongPosition({ size: PositionSize.fromFloat(1000000) }),
      createOpenLongPosition({ size: PositionSize.fromFloat(2000000) }),
    ];

    const result = calculateTotalSize(positions);

    expect($decimalValue(result).toFloat()).toBeCloseTo(3000000, 0);
  });

  it('returns PositionSize type with correct decimals', () => {
    const positions = [createOpenLongPosition({ size: PositionSize.fromFloat(100) })];

    const result = calculateTotalSize(positions);

    expect(result.decimals).toBe(PositionSize.decimals);
  });
});
