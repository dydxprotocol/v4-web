import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AssetSizeInput } from '../../src/components/PositionSizeInputs/components/AssetSizeInput';
import { OrderEntryFormTestWrapper } from '../testUtils';

const defaultProps = {
  size: '100',
  onSizeChange: vi.fn(),
  onFocus: vi.fn(),
  usdPrice: 5000,
  assetName: 'BTC',
  label: 'Collateral',
  focused: false,
};

function renderAssetSizeInput(props = {}) {
  return render(
    <OrderEntryFormTestWrapper>
      <AssetSizeInput {...defaultProps} {...props} />
    </OrderEntryFormTestWrapper>
  );
}

describe('AssetSizeInput', () => {
  it('renders the label', () => {
    renderAssetSizeInput();
    expect(screen.getByText('Collateral')).toBeInTheDocument();
  });

  it('renders the asset name badge', () => {
    renderAssetSizeInput();
    expect(screen.getByText('BTC')).toBeInTheDocument();
  });

  it('displays the input value', () => {
    renderAssetSizeInput({ size: '250' });
    expect(screen.getByDisplayValue('250')).toBeInTheDocument();
  });

  it('displays USD price', () => {
    renderAssetSizeInput({ usdPrice: 12345.67 });
    expect(screen.getByText('$12345.67')).toBeInTheDocument();
  });

  it('calls onSizeChange when input changes', async () => {
    const onSizeChange = vi.fn();
    const user = userEvent.setup();

    renderAssetSizeInput({ onSizeChange, size: '' });

    const input = screen.getByPlaceholderText('0.0');
    await user.type(input, '500');

    expect(onSizeChange).toHaveBeenCalled();
  });

  it('calls onFocus when input is focused', async () => {
    const onFocus = vi.fn();
    const user = userEvent.setup();

    renderAssetSizeInput({ onFocus });

    const input = screen.getByPlaceholderText('0.0');
    await user.click(input);

    expect(onFocus).toHaveBeenCalled();
  });

  describe('leverage display', () => {
    it('shows leverage when provided', () => {
      renderAssetSizeInput({ leverage: 10 });
      expect(screen.getByText('Leverage: 10x')).toBeInTheDocument();
    });

    it('hides leverage when not provided', () => {
      renderAssetSizeInput();
      expect(screen.queryByText(/Leverage:/)).not.toBeInTheDocument();
    });
  });

  describe('error display', () => {
    it('shows error message when provided', () => {
      renderAssetSizeInput({ error: 'Insufficient balance' });
      expect(screen.getByText('Insufficient balance')).toBeInTheDocument();
    });

    it('hides error when not provided', () => {
      renderAssetSizeInput();
      expect(screen.queryByText('Insufficient balance')).not.toBeInTheDocument();
    });
  });

  describe('quick action buttons', () => {
    it('shows Half button when onHalf is provided and balance > 0', () => {
      const onHalf = vi.fn();
      renderAssetSizeInput({ onHalf });
      expect(screen.getByText('Half')).toBeInTheDocument();
    });

    it('shows Max button when onMax is provided and balance > 0', () => {
      const onMax = vi.fn();
      renderAssetSizeInput({ onMax });
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    it('calls onHalf when Half button is clicked', async () => {
      const onHalf = vi.fn();
      const user = userEvent.setup();

      renderAssetSizeInput({ onHalf });

      await user.click(screen.getByText('Half'));
      expect(onHalf).toHaveBeenCalled();
    });

    it('calls onMax when Max button is clicked', async () => {
      const onMax = vi.fn();
      const user = userEvent.setup();

      renderAssetSizeInput({ onMax });

      await user.click(screen.getByText('Max'));
      expect(onMax).toHaveBeenCalled();
    });

    it('hides quick actions when user balance is 0', () => {
      const onHalf = vi.fn();
      const onMax = vi.fn();

      render(
        <OrderEntryFormTestWrapper
          context={{
            quoteAssetName: 'USD',
            userBalanceInBaseAsset: 0,
            currentQuoteAssetPrice: { value: 50000 },
            currentBaseAssetPrice: { value: 50000 },
          }}
        >
          <AssetSizeInput {...defaultProps} onHalf={onHalf} onMax={onMax} />
        </OrderEntryFormTestWrapper>
      );

      expect(screen.queryByText('Half')).not.toBeInTheDocument();
      expect(screen.queryByText('Max')).not.toBeInTheDocument();
    });

    it('hides quick actions when neither onHalf nor onMax is provided', () => {
      renderAssetSizeInput();
      expect(screen.queryByText('Half')).not.toBeInTheDocument();
      expect(screen.queryByText('Max')).not.toBeInTheDocument();
    });
  });
});
