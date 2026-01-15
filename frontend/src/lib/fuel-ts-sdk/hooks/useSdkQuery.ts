import type { RootState } from 'fuel-ts-sdk/client';
import { useSelector } from 'react-redux';

export function useSdkQuery<T>(selector: (state: RootState) => T): T {
  return useSelector(selector);
}
