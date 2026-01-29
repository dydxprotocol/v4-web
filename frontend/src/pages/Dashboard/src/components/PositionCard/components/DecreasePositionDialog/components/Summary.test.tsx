import { render, screen } from '@testing-library/react';
import { PositionSize } from 'fuel-ts-sdk/trading';
import { describe, expect, it } from 'vitest';
import { Summary } from './Summary';

describe('Summary', () => {
  it('renders decrease amount and remaining size labels', () => {
    render(
      <Summary
        decreaseAmount=""
        totalPositionSize={PositionSize.fromFloat(1000)}
        assetSymbol="USDC"
      />
    );

    expect(screen.getByText('Decrease Amount')).toBeInTheDocument();
    expect(screen.getByText('Remaining Size')).toBeInTheDocument();
  });

  it('shows full position size as remaining when no decrease amount', () => {
    render(
      <Summary
        decreaseAmount=""
        totalPositionSize={PositionSize.fromFloat(1000)}
        assetSymbol="USDC"
      />
    );

    // formatNumber without decimals option doesn't force .00 suffix
    expect(screen.getByText(/1,000/)).toBeInTheDocument();
  });

  it('calculates remaining size correctly', () => {
    render(
      <Summary
        decreaseAmount="300"
        totalPositionSize={PositionSize.fromFloat(1000)}
        assetSymbol="USDC"
      />
    );

    // Decrease amount shows 300
    expect(screen.getByText(/300/)).toBeInTheDocument();
    // Remaining should be 700
    expect(screen.getByText(/700/)).toBeInTheDocument();
  });

  it('shows zero remaining when decrease equals total', () => {
    render(
      <Summary
        decreaseAmount="1000"
        totalPositionSize={PositionSize.fromFloat(1000)}
        assetSymbol="USDC"
      />
    );

    expect(screen.getByText(/1,000/)).toBeInTheDocument();
    // Check the remaining size shows 0 - use textContent matching
    expect(screen.getByText('Remaining Size').nextElementSibling?.textContent).toMatch(/^0\s/);
  });

  it('handles decimal decrease amounts', () => {
    render(
      <Summary
        decreaseAmount="100.5"
        totalPositionSize={PositionSize.fromFloat(500)}
        assetSymbol="USDC"
      />
    );

    expect(screen.getByText(/100\.5/)).toBeInTheDocument();
    expect(screen.getByText(/399\.5/)).toBeInTheDocument();
  });

  it('shows 0 for empty decrease amount', () => {
    render(
      <Summary
        decreaseAmount=""
        totalPositionSize={PositionSize.fromFloat(500)}
        assetSymbol="USDC"
      />
    );

    // Empty decrease amount displays as "0" - check the decrease amount value
    expect(screen.getByText('Decrease Amount').nextElementSibling?.textContent).toMatch(/^0\s/);
  });
});
