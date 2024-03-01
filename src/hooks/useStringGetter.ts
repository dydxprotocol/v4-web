import { useSelector, shallowEqual } from 'react-redux';

import type { ReactNode } from 'react';

import type { StringGetterFunction } from '@/constants/localization';

import { getIsLocaleLoaded, getLocaleStringGetter } from '@/state/localizationSelectors';

export const useStringGetter = (): StringGetterFunction<{
  [key: string]: string | number | ReactNode;
}> => {
  const isLocaleLoaded = useSelector(getIsLocaleLoaded);
  const stringGetterFunction = useSelector(getLocaleStringGetter, shallowEqual);
  return isLocaleLoaded ? stringGetterFunction : () => '';
};
