import { useSdk } from './useSdk';

export function useTradingSdk() {
  const client = useSdk();
  return client.trading;
}
