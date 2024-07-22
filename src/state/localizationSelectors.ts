import { get } from 'lodash';

import {
  EN_LOCALE_DATA,
  LocaleData,
  StringGetterFunction,
  SupportedLocales,
} from '@/constants/localization';

import formatString from '@/lib/formatString';

import { type RootState } from './_store';
import { createAppSelector } from './appTypes';

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
    if (isLocaleLoaded) {
      let formattedString = props.fallback ?? '';

      if (localeData || EN_LOCALE_DATA) {
        if (props.key) {
          const localeString = get(localeData, props.key);
          const englishString = get(EN_LOCALE_DATA, props.key);

          // Fallback to english whenever a key doesn't exist for other languages
          formattedString = localeString || englishString;
        }
      }

      return formatString(formattedString, props?.params);
    }

    return '';
  };
};

/**
 * @param state
 * @returns
 */
export const getLocaleStringGetter = createAppSelector(
  [getSelectedLocaleData, getIsLocaleLoaded],
  getStringGetterForLocaleData
);
