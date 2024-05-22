import { useMemo } from 'react';

import { shallowEqual } from 'react-redux';

import type { RootState } from '@/state/_store';
import { useAppSelector } from '@/state/appTypes';

export const useParameterizedSelector = <ReturnType, ExtraArgTypes extends any[]>(
  selectorFactory: () => (state: RootState, ...args: ExtraArgTypes) => ReturnType,
  ...args: ExtraArgTypes
): ReturnType => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selector = useMemo(selectorFactory, []);
  return useAppSelector((s) => selector(s, ...args), shallowEqual);
};
