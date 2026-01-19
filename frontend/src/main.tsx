import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.tsx';
import { NetworkSwitchContextProvider } from './contexts/NetworkSwitchContext/index.ts';
import { WalletContextProvider } from './contexts/WalletContext/WalletContextProvider.tsx';
import { FuelTsSdkProvider } from './lib/fuel-ts-sdk';
import './lib/pipe';
import './lib/toBigInt';
import './styles/toastify.css';

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
    <ToastContainer position="bottom-right" theme="dark" />
  </StrictMode>
);
