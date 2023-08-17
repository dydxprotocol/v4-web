import { useSelector, shallowEqual } from 'react-redux';

import type { StringGetterFunction } from '@/constants/localization';

import { getIsLocaleLoaded, getLocaleStringGetter } from '@/state/localizationSelectors';

export const useStringGetter = (): StringGetterFunction => {
  const isLocaleLoaded = useSelector(getIsLocaleLoaded);
  const stringGetterFunction = useSelector(getLocaleStringGetter, shallowEqual);
  return isLocaleLoaded ? stringGetterFunction : () => '';
};
