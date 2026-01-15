import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import App from './App.tsx';
import { NetworkSwitchContextProvider } from './contexts/NetworkSwitchContext/index.ts';
import { WalletContextProvider } from './contexts/WalletContext/WalletContextProvider.tsx';
import { FuelTsSdkProvider } from './lib/fuel-ts-sdk';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletContextProvider>
      <NetworkSwitchContextProvider>
        {(networkSwitch) => (
          <FuelTsSdkProvider key={networkSwitch.getCurrentNetwork()}>
            <Theme appearance="dark">
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </Theme>
          </FuelTsSdkProvider>
        )}
      </NetworkSwitchContextProvider>
    </WalletContextProvider>
  </StrictMode>
);
