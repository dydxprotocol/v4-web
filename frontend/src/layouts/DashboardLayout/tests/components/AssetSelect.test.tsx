import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { assetId } from 'fuel-ts-sdk';
import type { AssetEntity } from 'fuel-ts-sdk/trading';
import { beforeEach, describe, expect, it, vi } from 'vitest';
// Import after mocking
import { AssetSelect } from '../../src/views/DashboardLayout/components/DashboardHeader/components/AssetSelect';

// Mock the SDK hooks
const mockWatchAsset = vi.fn();
const mockGetAllAssets = vi.fn();
const mockGetWatchedAsset = vi.fn();

vi.mock('@/lib/fuel-ts-sdk', () => ({
  useTradingSdk: () => ({
    getAllAssets: mockGetAllAssets,
    getWatchedAsset: mockGetWatchedAsset,
    watchAsset: mockWatchAsset,
  }),
  useSdkQuery: (selector: () => unknown) => selector(),
}));

const mockAssets: AssetEntity[] = [
  {
    assetId: assetId('btc-asset-id'),
    symbol: 'BTCUSD',
    name: 'Bitcoin',
    decimals: 9,
  },
  {
    assetId: assetId('eth-asset-id'),
    symbol: 'ETHUSD',
    name: 'Ethereum',
    decimals: 9,
  },
  {
    assetId: assetId('usdc-asset-id'),
    symbol: 'USDC',
    name: 'USD Coin',
    isBaseAsset: true, // This should be filtered out
    decimals: 6,
  },
];

describe('AssetSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllAssets.mockReturnValue(mockAssets);
    mockGetWatchedAsset.mockReturnValue(mockAssets[0]); // Bitcoin selected
  });

  it('renders the currently selected asset name', () => {
    render(<AssetSelect />);

    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
  });

  it('renders asset icon for selected asset', () => {
    render(<AssetSelect />);

    const icon = screen.getByAltText('BTCUSD');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', 'https://verified-assets.fuel.network/images/solvBTC.webp');
  });

  it('filters out base assets from the list', async () => {
    const user = userEvent.setup();
    render(<AssetSelect />);

    // Open dropdown
    await user.click(screen.getByRole('combobox'));

    // Base asset (USDC) should not appear in the dropdown
    expect(screen.queryByText('USD Coin')).not.toBeInTheDocument();

    // Non-base assets should appear
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });

  it('shows dropdown with available assets when clicked', async () => {
    const user = userEvent.setup();
    render(<AssetSelect />);

    await user.click(screen.getByRole('combobox'));

    // Both non-base assets should be visible
    expect(screen.getByRole('option', { name: /Bitcoin/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Ethereum/i })).toBeInTheDocument();
  });

  it('calls watchAsset when a different asset is selected', async () => {
    const user = userEvent.setup();
    render(<AssetSelect />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /Ethereum/i }));

    expect(mockWatchAsset).toHaveBeenCalledWith('eth-asset-id');
  });

  it('displays asset icons in dropdown options', async () => {
    const user = userEvent.setup();
    render(<AssetSelect />);

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByAltText('ETHUSD')).toHaveAttribute(
      'src',
      'https://verified-assets.fuel.network/images/eth.svg'
    );
  });

  it('renders empty when no watched asset', () => {
    mockGetWatchedAsset.mockReturnValue(undefined);

    const { container } = render(<AssetSelect />);

    // The select should still render but without selected value content
    expect(container.querySelector('[role="combobox"]')).toBeInTheDocument();
  });

  it('handles empty assets list', async () => {
    mockGetAllAssets.mockReturnValue([]);
    const user = userEvent.setup();

    render(<AssetSelect />);

    await user.click(screen.getByRole('combobox'));

    // No options should be available
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});
