import { shallowEqual } from 'react-redux';

import type { StringGetterFunction } from '@/constants/localization';

import { useAppSelector } from '@/state/appTypes';
import { getLocaleStringGetter } from '@/state/localizationSelectors';

export const useStringGetter = (): StringGetterFunction => {
  const stringGetterFunction = useAppSelector(getLocaleStringGetter, shallowEqual);
  return stringGetterFunction;
};
