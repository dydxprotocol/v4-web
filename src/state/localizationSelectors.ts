import _ from 'lodash';
import { createSelector } from 'reselect';

import {
  EN_LOCALE_DATA,
  LocaleData,
  StringGetterFunction,
  SupportedLocales,
} from '@/constants/localization';

import formatString from '@/lib/formatString';

import type { RootState } from './_store';

/**
 * @param state
 * @returns
 */
export const getIsLocaleLoaded = (state: RootState): boolean => state.localization.isLocaleLoaded;

/**
 * @param state
 * @returns
 */
export const getSelectedLocaleData = (state: RootState): LocaleData =>
  state.localization.localeData;

/**
 * @param state
 * @returns
 */
export const getSelectedLocale = (state: RootState): SupportedLocales =>
  state.localization.selectedLocale;

/**
 * @param state
 * @returns
 */
export const getStringGetterForLocaleData = (
  localeData: LocaleData,
  isLocaleLoaded: boolean
): StringGetterFunction => {
  // @ts-expect-error TODO: formatString return doesn't match StringGetterFunction
  return (props) => {
    // Fallback to english whenever a key doesn't exist for other languages
    if (isLocaleLoaded) {
      const formattedString: string =
        localeData || EN_LOCALE_DATA
          ? _.get(localeData, props.key) || _.get(EN_LOCALE_DATA, props.key)
          : '';

      return formatString(formattedString, props?.params);
    }

    return '';
  };
};

/**
 * @param state
 * @returns
 */
export const getLocaleStringGetter = createSelector(
  [getSelectedLocaleData, getIsLocaleLoaded],
  getStringGetterForLocaleData
);
