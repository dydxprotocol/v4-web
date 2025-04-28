import type { RootState } from '@/state/_store';
import { useAppSelector } from '@/state/appTypes';

export const useAppSelectorWithArgs = <ReturnType, ExtraArgTypes extends any[]>(
  selector: (state: RootState, ...args: ExtraArgTypes) => ReturnType,
  ...args: ExtraArgTypes
): ReturnType => {
  return useAppSelector((s) => selector(s, ...args));
};
