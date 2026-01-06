import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OrderEntryForm } from '../../src/views/order-entry-form.component';

describe('OrderEntryForm', () => {
  const defaultProps = {
    baseAssetName: 'BTC',
    quoteAssetName: 'USD',
    userBalanceInQuoteAsset: 10000,
    userBalanceInBaseAsset: 0.5,
    currentQuoteAssetPrice: 50000,
    onSubmitSuccessful: vi.fn(),
    onSubmitFailure: vi.fn(),
  };

  it('renders the form', () => {
    render(<OrderEntryForm {...defaultProps} />);

    // Check that a combobox is rendered (order mode select)
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays the correct asset names', () => {
    render(<OrderEntryForm {...defaultProps} />);

    expect(screen.getAllByText(/BTC/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/USD/).length).toBeGreaterThan(0);
  });

  it('renders size input', () => {
    render(<OrderEntryForm {...defaultProps} />);

    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<OrderEntryForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: /BUY STARBOARD TOKEN/i })).toBeInTheDocument();
  });
});
