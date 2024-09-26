import { Keplr } from '@keplr-wallet/types';

declare global {
  interface Window {
    keplr?: Keplr;
    // need to add web3-react-phantom to get Phantom wallet import
    phantom?: any;
  }
}
