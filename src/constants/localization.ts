import { ReactNode } from 'react';

import {
  APP_STRING_KEYS,
  ERRORS_STRING_KEYS,
  LOCALE_DATA,
  TOOLTIPS,
  WARNINGS_STRING_KEYS,
  NOTIFICATIONS_STRING_KEYS,
  NOTIFICATIONS,
} from '@dydxprotocol/v4-localization';

import { type LinksConfigs } from '@/hooks/useURLConfigs';

export { TOOLTIP_STRING_KEYS } from '@dydxprotocol/v4-localization';

export enum SupportedLocales {
  EN = 'en',
  ZH_CN = 'zh-CN',
  JA = 'ja',
  KO = 'ko',
  RU = 'ru',
  TR = 'tr',
  FR = 'fr',
  PT = 'pt',
  ES = 'es',
  DE = 'de',
}

export const EN_LOCALE_DATA = {
  ...LOCALE_DATA[SupportedLocales.EN],
  ...NOTIFICATIONS[SupportedLocales.EN],
  TOOLTIPS: TOOLTIPS[SupportedLocales.EN],
};

export const STRING_KEYS = {
  ...APP_STRING_KEYS,
  ...ERRORS_STRING_KEYS,
  ...WARNINGS_STRING_KEYS,
  ...NOTIFICATIONS_STRING_KEYS,
};

export const STRING_KEY_VALUES = Object.fromEntries(
  Object.values(STRING_KEYS).map((key) => [key, key])
);

export type StringKey = keyof typeof STRING_KEYS;

export type LocaleData = typeof EN_LOCALE_DATA;

export type StringGetterFunction = (a: {
  key: string;
  params?: {
    [key: string]: ReactNode;
  };
}) => string;

export const SUPPORTED_LOCALE_STRING_LABELS: { [key in SupportedLocales]: string } = {
  [SupportedLocales.EN]: 'English',
  [SupportedLocales.ZH_CN]: '中文',
  [SupportedLocales.JA]: '日本語',
  [SupportedLocales.KO]: '한국어',
  [SupportedLocales.RU]: 'русский',
  [SupportedLocales.TR]: 'Türkçe',
  [SupportedLocales.FR]: 'Français',
  [SupportedLocales.PT]: 'Português',
  [SupportedLocales.ES]: 'Español',
  [SupportedLocales.DE]: 'Deutsch',
};

export const SUPPORTED_LOCALE_BASE_TAGS = {
  [SupportedLocales.EN]: 'en',
  [SupportedLocales.ZH_CN]: 'zh',
  [SupportedLocales.JA]: 'ja',
  [SupportedLocales.KO]: 'ko',
  [SupportedLocales.RU]: 'ru',
  [SupportedLocales.TR]: 'tr',
  [SupportedLocales.FR]: 'fr',
  [SupportedLocales.PT]: 'pt',
  [SupportedLocales.ES]: 'es',
  [SupportedLocales.DE]: 'de',
};

export const SUPPORTED_BASE_TAGS_LOCALE_MAPPING = Object.fromEntries(
  Object.entries(SUPPORTED_LOCALE_BASE_TAGS).map(([locale, baseTag]) => [baseTag, locale])
);

export type TooltipStrings = {
  [key: string]: ({
    stringGetter,
    stringParams,
    urlConfigs,
  }: {
    stringGetter: StringGetterFunction;
    stringParams?: any;
    urlConfigs?: LinksConfigs;
  }) => {
    title: string;
    body: string;
    learnMoreLink?: string;
  };
};
