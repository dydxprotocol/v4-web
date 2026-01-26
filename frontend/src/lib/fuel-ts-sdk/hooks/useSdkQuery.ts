import { useSelector } from 'react-redux';
import { useSdk } from './useSdk';

export function useSdkQuery<T>(selector: (sdk: ReturnType<typeof useSdk>) => T): T {
  const sdk = useSdk();
  return useSelector(() => selector(sdk));
}
