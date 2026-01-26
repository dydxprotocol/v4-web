import { useSdk } from './useSdk';

export function useAccountsSdk() {
  const client = useSdk();
  return client.accounts;
}
