import { createSelector } from 'reselect';
import _ from 'lodash';

import formatString from '@/lib/formatString';
import { LocaleData, SupportedLocales } from '@/constants/localization';
import type { RootState } from './_store';

import enLocaleData from '@/localization/en';
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
    // TODO(@aforaleka) Temporary solution until new localization is implemented in trader-fe
    const formattedKey = key?.replace(/^APP\./, '');

    // Fallback to english whenever a key doesn't exist for other languages
    let formattedString: string =
      _.get(localeData, formattedKey) || _.get(enLocaleData, formattedKey) || '';

    return formatString(formattedString, params);;
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
