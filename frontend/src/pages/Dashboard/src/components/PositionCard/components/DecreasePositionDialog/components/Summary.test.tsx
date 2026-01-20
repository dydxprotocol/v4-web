import { render, screen } from '@testing-library/react';
import { PositionSize } from 'fuel-ts-sdk/trading';
import { describe, expect, it } from 'vitest';
import { Summary } from './Summary';

describe('Summary', () => {
  it('renders decrease amount and remaining size labels', () => {
    render(<Summary decreaseAmount="" totalPositionSize={PositionSize.fromFloat(1000)} />);

    expect(screen.getByText('Decrease Amount')).toBeInTheDocument();
    expect(screen.getByText('Remaining Size')).toBeInTheDocument();
  });

  it('shows full position size as remaining when no decrease amount', () => {
    render(<Summary decreaseAmount="" totalPositionSize={PositionSize.fromFloat(1000)} />);

    expect(screen.getByText('1,000.00 USDC')).toBeInTheDocument();
  });

  it('calculates remaining size correctly', () => {
    render(<Summary decreaseAmount="300" totalPositionSize={PositionSize.fromFloat(1000)} />);

    // Decrease amount shows 300
    expect(screen.getByText('300.00 USDC')).toBeInTheDocument();
    // Remaining should be 700
    expect(screen.getByText('700.00 USDC')).toBeInTheDocument();
  });

  it('shows zero remaining when decrease equals total', () => {
    render(<Summary decreaseAmount="1000" totalPositionSize={PositionSize.fromFloat(1000)} />);

    expect(screen.getByText('1,000.00 USDC')).toBeInTheDocument();
    expect(screen.getByText('0.00 USDC')).toBeInTheDocument();
  });

  it('handles decimal decrease amounts', () => {
    render(<Summary decreaseAmount="100.5" totalPositionSize={PositionSize.fromFloat(500)} />);

    expect(screen.getByText('100.50 USDC')).toBeInTheDocument();
    expect(screen.getByText('399.50 USDC')).toBeInTheDocument();
  });

  it('shows 0.00 for empty decrease amount', () => {
    render(<Summary decreaseAmount="" totalPositionSize={PositionSize.fromFloat(500)} />);

    expect(screen.getByText('0.00 USDC')).toBeInTheDocument();
  });
});
