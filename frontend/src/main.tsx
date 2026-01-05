import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import App from './App.tsx';
import { NetworkSwitchContextProvider } from './contexts/network-switch';
import { getIndexerUrl } from './lib/env';
import { FuelTsSdkProvider } from './lib/fuel-ts-sdk';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NetworkSwitchContextProvider>
      {(networkSwitch) => (
        <FuelTsSdkProvider
          indexerUrl={getIndexerUrl(networkSwitch.getCurrentNetwork())}
          key={networkSwitch.getCurrentNetwork()}
        >
          <Theme appearance="dark">
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </Theme>
        </FuelTsSdkProvider>
      )}
    </NetworkSwitchContextProvider>
  </StrictMode>
);
