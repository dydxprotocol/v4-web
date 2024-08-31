import { Keplr } from '@keplr-wallet/types';

declare global {
  interface Window {
    keplr?: Keplr;
  }
}
