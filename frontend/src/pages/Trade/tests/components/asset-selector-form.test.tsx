import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AssetSelectorForm } from '../../src/components/asset-selector-form.component';

describe('AssetSelectorForm', () => {
  it('renders form with label and input', () => {
    const mockSubmit = vi.fn();
    render(<AssetSelectorForm onSubmit={mockSubmit} />);

    expect(screen.getByText('Asset ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument();
    expect(screen.getByText('Load Asset')).toBeInTheDocument();
  });

  it('renders with default value when provided', () => {
    const mockSubmit = vi.fn();
    const defaultValue = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

    render(<AssetSelectorForm onSubmit={mockSubmit} defaultValue={defaultValue} />);

    const input = screen.getByPlaceholderText('0x...') as HTMLInputElement;
    expect(input.value).toBe(defaultValue);
  });

  it('shows loading state when submitting', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<AssetSelectorForm onSubmit={mockSubmit} />);

    const input = screen.getByPlaceholderText('0x...');
    const button = screen.getByText('Load Asset');

    await user.type(input, '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    await user.click(button);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('calls onSubmit with valid asset ID', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AssetSelectorForm onSubmit={mockSubmit} />);

    const input = screen.getByPlaceholderText('0x...');
    const button = screen.getByText('Load Asset');

    const validAssetId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    await user.type(input, validAssetId);
    await user.click(button);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
  });

  it('handles submission errors gracefully', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AssetSelectorForm onSubmit={mockSubmit} />);

    const input = screen.getByPlaceholderText('0x...');
    const button = screen.getByText('Load Asset');

    const validAssetId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    await user.type(input, validAssetId);
    await user.click(button);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to fetch candle data for this asset');
      expect(screen.getByText('Load Asset')).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('does not submit when input is empty', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();

    render(<AssetSelectorForm onSubmit={mockSubmit} />);

    const button = screen.getByText('Load Asset');
    await user.click(button);

    expect(mockSubmit).not.toHaveBeenCalled();
  });
});
