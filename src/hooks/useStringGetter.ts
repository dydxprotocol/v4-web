import { useSelector, shallowEqual } from 'react-redux';

import type { StringGetterFunction } from '@/constants/localization';

import { getLocaleStringGetter } from '@/state/localizationSelectors';

export const useStringGetter = (): StringGetterFunction => {
  const stringGetterFunction = useSelector(getLocaleStringGetter, shallowEqual);
  return stringGetterFunction;
};
