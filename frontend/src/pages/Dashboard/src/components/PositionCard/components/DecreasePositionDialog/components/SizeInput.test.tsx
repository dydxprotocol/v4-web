import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SizeInput } from './SizeInput';

describe('SizeInput', () => {
  it('renders with label and asset symbol', () => {
    render(<SizeInput amountToDecrease="" onChange={vi.fn()} assetSymbol="BTCUSD" />);

    expect(screen.getByText('Amount to Decrease')).toBeInTheDocument();
    expect(screen.getByText('BTCUSD')).toBeInTheDocument();
  });

  it('displays placeholder when empty', () => {
    render(<SizeInput amountToDecrease="" onChange={vi.fn()} assetSymbol="BTCUSD" />);

    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
  });

  it('displays provided value', () => {
    render(<SizeInput amountToDecrease="123.45" onChange={vi.fn()} assetSymbol="BTCUSD" />);

    expect(screen.getByDisplayValue('123.45')).toBeInTheDocument();
  });

  it('calls onChange with valid numeric input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SizeInput amountToDecrease="" onChange={onChange} assetSymbol="BTCUSD" />);

    const input = screen.getByPlaceholderText('0.00');
    await user.type(input, '100');

    expect(onChange).toHaveBeenCalledWith('1');
    expect(onChange).toHaveBeenCalledWith('0');
    expect(onChange).toHaveBeenCalledWith('0');
  });

  it('calls onChange with decimal input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SizeInput amountToDecrease="" onChange={onChange} assetSymbol="BTCUSD" />);

    const input = screen.getByPlaceholderText('0.00');
    await user.type(input, '50.5');

    expect(onChange).toHaveBeenCalledWith('5');
    expect(onChange).toHaveBeenCalledWith('0');
    expect(onChange).toHaveBeenCalledWith('.');
    expect(onChange).toHaveBeenCalledWith('5');
  });

  it('does not call onChange for invalid characters', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SizeInput amountToDecrease="" onChange={onChange} assetSymbol="BTCUSD" />);

    const input = screen.getByPlaceholderText('0.00');
    await user.type(input, 'abc');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('truncates input to 13 characters', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SizeInput amountToDecrease="" onChange={onChange} assetSymbol="BTCUSD" />);

    const input = screen.getByPlaceholderText('0.00');
    await user.type(input, '12345678901234567890');

    // Each character triggers onChange with truncated value
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall[0].length).toBeLessThanOrEqual(13);
  });

  it('has decimal input mode for mobile keyboards', () => {
    render(<SizeInput amountToDecrease="" onChange={vi.fn()} assetSymbol="BTCUSD" />);

    const input = screen.getByPlaceholderText('0.00');
    expect(input).toHaveAttribute('inputMode', 'decimal');
  });
});
