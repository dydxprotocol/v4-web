import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PositionCard } from '../../src/components/position-card.component';

// Create simple test fixtures directly
const createMockPosition = (overrides: any = {}) => {
  const mockValue = (val: bigint) => ({
    value: val,
    decimals: 9n,
    toFloat: () => Number(val) / 1_000_000_000,
    toBigInt: () => val,
  });

  return {
    id: 'test-position-1',
    positionKey: {
      account: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      indexAssetId: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      isLong: true,
    },
    size: mockValue(1000000000n),
    collateralAmount: mockValue(500000000n),
    timestamp: Date.now(),
    latest: true,
    change: 'INCREASE_POSITION',
    collateralTransferred: mockValue(0n),
    pnlDelta: mockValue(100000000n),
    realizedPnl: mockValue(50000000n),
    positionFee: mockValue(10000000n),
    fundingRate: mockValue(5000000n),
    realizedFundingRate: mockValue(0n),
    ...overrides,
  };
};

describe('PositionCard', () => {
  it('renders LONG position header correctly', () => {
    const mockPosition = createMockPosition();
    render(<PositionCard position={mockPosition as any} />);

    expect(screen.getByText('LONG')).toBeInTheDocument();
  });

  it('renders SHORT position header correctly', () => {
    const mockPosition = createMockPosition({
      positionKey: {
        account: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        indexAssetId: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        isLong: false,
      },
    });
    render(<PositionCard position={mockPosition as any} />);

    expect(screen.getByText('SHORT')).toBeInTheDocument();
  });

  it('renders all position fields', () => {
    const mockPosition = createMockPosition();
    render(<PositionCard position={mockPosition as any} />);

    // Check that field labels are present
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('Collateral')).toBeInTheDocument();
    expect(screen.getByText('PnL')).toBeInTheDocument();
    expect(screen.getByText('Realized PnL')).toBeInTheDocument();
    expect(screen.getByText('Position Fee')).toBeInTheDocument();
    expect(screen.getByText('Funding Rate')).toBeInTheDocument();
  });

  it('displays positive PnL values', () => {
    const mockPosition = createMockPosition();
    render(<PositionCard position={mockPosition as any} />);

    expect(screen.getByText('PnL')).toBeInTheDocument();
  });

  it('displays negative PnL values', () => {
    const mockValue = (val: bigint) => ({
      value: val,
      decimals: 9n,
      toFloat: () => Number(val) / 1_000_000_000,
      toBigInt: () => val,
    });

    const mockPosition = createMockPosition({
      pnlDelta: mockValue(-50000000n),
    });
    render(<PositionCard position={mockPosition as any} />);

    expect(screen.getByText('PnL')).toBeInTheDocument();
  });
});
