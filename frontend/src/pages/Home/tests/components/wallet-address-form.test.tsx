import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WalletAddressForm } from '../../src/components/wallet-address-form.component';

describe('WalletAddressForm', () => {
  it('renders form with label and input', () => {
    const mockSubmit = vi.fn();
    render(<WalletAddressForm onSubmit={mockSubmit} />);

    expect(screen.getByText('Wallet Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument();
    expect(screen.getByText('Get Positions')).toBeInTheDocument();
  });

  it('shows loading state when submitting', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<WalletAddressForm onSubmit={mockSubmit} />);

    const input = screen.getByPlaceholderText('0x...');
    const button = screen.getByText('Get Positions');

    await user.type(input, '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    await user.click(button);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('calls onSubmit with valid address', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn().mockResolvedValue(undefined);

    render(<WalletAddressForm onSubmit={mockSubmit} />);

    const input = screen.getByPlaceholderText('0x...');
    const button = screen.getByText('Get Positions');

    const validAddress = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    await user.type(input, validAddress);
    await user.click(button);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(validAddress);
    });
  });

  it('returns to normal state after submission completes', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn().mockResolvedValue(undefined);

    render(<WalletAddressForm onSubmit={mockSubmit} />);

    const input = screen.getByPlaceholderText('0x...');
    const button = screen.getByText('Get Positions');

    await user.type(input, '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Get Positions')).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });
});
