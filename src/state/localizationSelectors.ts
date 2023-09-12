import { createSelector } from 'reselect';
import _ from 'lodash';

import { EN_LOCALE_DATA, LocaleData, SupportedLocales } from '@/constants/localization';

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
export const getStringGetterForLocaleData = (localeData: LocaleData) => {
  return ({
    key,
    params = {},
  }: {
    key: any;
    params?: { [key: string]: string | React.ReactNode };
  }): string | Array<string | React.ReactNode> => {
    // Fallback to english whenever a key doesn't exist for other languages
    const formattedString: string = _.get(localeData, key) || _.get(EN_LOCALE_DATA, key) || '';

    return formatString(formattedString, params);
  };
};

/**
 * @param state
 * @returns
 */
export const getLocaleStringGetter = createSelector(
  [getSelectedLocaleData],
  getStringGetterForLocaleData
);
