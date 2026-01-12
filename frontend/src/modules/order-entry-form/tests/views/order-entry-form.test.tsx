import { signal } from '@preact/signals-react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OrderEntryForm } from '../../src/views/order-entry-form.component';

describe('OrderEntryForm', () => {
  const defaultProps = {
    quoteAssetName: 'BTC',
    userBalanceInBaseAsset: 10000,
    currentQuoteAssetPrice: signal(50000),
    currentBaseAssetPrice: signal(1),
    onSubmitSuccessful: vi.fn(),
    onSubmitFailure: vi.fn(),
  };

  it('renders the form', () => {
    render(<OrderEntryForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: /LONG/i })).toBeInTheDocument();
  });

  it('displays the correct asset names', () => {
    render(<OrderEntryForm {...defaultProps} />);

    expect(screen.getAllByText(/BTC/).length).toBeGreaterThan(0);
  });

  it('renders size input', () => {
    render(<OrderEntryForm {...defaultProps} />);

    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<OrderEntryForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: /LONG/i })).toBeInTheDocument();
  });
});
