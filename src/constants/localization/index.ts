import enLocaleData from '@/localization/en';

import { APP_STRING_KEYS } from './app';
import { ERROR_STRING_KEYS } from './errors';
import { WARNING_STRING_KEYS } from './warnings';

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

export type LocaleData = typeof enLocaleData;

export type StringGetterFunction = (a: {
  key: string;
  params?: {
    [key: string]: string | React.ReactNode;
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

export const STRING_KEYS: Record<string, string> = {
  ...APP_STRING_KEYS,
  ...ERROR_STRING_KEYS,
  ...WARNING_STRING_KEYS,
};

export { TOOLTIP_STRING_KEYS } from './tooltips';

export type TooltipStrings = {
  [key: string]: ({
    stringGetter,
    stringParams,
  }: {
    stringGetter: StringGetterFunction;
    stringParams?: any;
  }) => {
    title: string;
    body: string;
    learnMoreLink?: string;
  };
};
