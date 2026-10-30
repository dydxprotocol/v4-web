import { act, createElement } from 'react';

import { createRoot } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { StringGetterFunction } from '@/constants/localization';
import { ConnectorType, WalletInfo, wallets, WalletType } from '@/constants/wallets';

import { useDisplayedWallets } from '@/hooks/useDisplayedWallets';

import { resolveWagmiConnector } from '../wagmi';
import { getWalletName } from '../walletName';

const mocks = vi.hoisted(() => ({
  simple: false,
  walletConnect: vi.fn((options) => options),
  coinbaseWallet: vi.fn((options) => options),
}));

vi.mock('@/hooks/useMipdInjectedWallets', () => ({
  useMipdInjectedWallets: () => [],
  getMipdConnectorByRdns: vi.fn(),
}));
vi.mock('@/hooks/useSimpleUiEnabled', () => ({ useSimpleUiEnabled: () => mocks.simple }));
vi.mock('@privy-io/wagmi', () => ({ createConfig: vi.fn(() => ({})) }));
vi.mock('wagmi/connectors', () => ({
  walletConnect: mocks.walletConnect,
  coinbaseWallet: mocks.coinbaseWallet,
}));
vi.mock('../localStorage', () => ({
  getLocalStorage: ({ defaultValue }: { defaultValue: string }) => defaultValue,
}));
vi.mock('../network', () => ({ validateAgainstAvailableEnvironments: vi.fn() }));

const walletConnectConfig = {
  client: { name: 'Test dApp', description: 'Wallet selector test', iconUrl: '/test-icon.svg' },
  v2: { projectId: 'test-project-id' },
};
const oath: WalletInfo = {
  connectorType: ConnectorType.WalletConnect,
  name: WalletType.OathWallet,
};

beforeAll(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
});
afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  mocks.simple = false;
});

describe('Oath wallet selection', () => {
  it.each([false, true])(
    'lists Oath directly alongside generic WalletConnect (simple=%s)',
    async (simple) => {
      mocks.simple = simple;
      let displayed: WalletInfo[] = [];
      const Probe = () => {
        displayed = useDisplayedWallets();
        return null;
      };
      const container = document.createElement('div');
      const root = createRoot(container);
      await act(async () => {
        root.render(createElement(Probe));
      });
      expect(displayed.filter((wallet) => wallet.name === WalletType.OathWallet)).toEqual([oath]);
      expect(displayed).toContainEqual({
        connectorType: ConnectorType.WalletConnect,
        name: WalletType.WalletConnect2,
      });
      await act(async () => root.unmount());
    }
  );

  it('opens the existing QR connector without changing dApp metadata or installing an extension', () => {
    resolveWagmiConnector({ wallet: oath, walletConnectConfig });
    const options = mocks.walletConnect.mock.calls[0]?.[0];
    expect(options).toMatchObject({
      projectId: 'test-project-id',
      showQrModal: true,
      metadata: { name: 'Test dApp', description: 'Wallet selector test' },
      qrModalOptions: { themeMode: 'dark' },
    });
    expect(options.qrModalOptions.desktopWallets).toBeUndefined();
    expect(mocks.coinbaseWallet).not.toHaveBeenCalled();
  });

  it('preserves identical provider options for a subsequent generic connection', () => {
    resolveWagmiConnector({ wallet: oath, walletConnectConfig });
    resolveWagmiConnector({
      wallet: { connectorType: ConnectorType.WalletConnect, name: WalletType.WalletConnect2 },
      walletConnectConfig,
    });
    expect(mocks.walletConnect.mock.calls[1]?.[0]).toEqual(mocks.walletConnect.mock.calls[0]?.[0]);
  });

  it('preserves Oath branding and existing localized and injected names', () => {
    const getter = vi.fn(
      ({ key }: { key?: string }) => `translated:${key}`
    ) as unknown as StringGetterFunction;
    expect(getWalletName(oath, getter)).toBe('Oath Wallet');
    expect(getter).not.toHaveBeenCalled();
    expect(
      getWalletName(
        { connectorType: ConnectorType.Coinbase, name: WalletType.CoinbaseWallet },
        getter
      )
    ).toBe(`translated:${wallets[WalletType.CoinbaseWallet].stringKey}`);
    expect(
      getWalletName(
        {
          connectorType: ConnectorType.Injected,
          name: 'Injected example',
          rdns: 'example.wallet',
          icon: 'data:image/svg+xml,<svg/>',
        },
        getter
      )
    ).toBe('Injected example');
  });
});
