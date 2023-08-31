import { ReactNode } from 'react';

import {
  APP_STRING_KEYS,
  ERRORS_STRING_KEYS,
  LOCALE_DATA,
  TOOLTIPS,
  WARNINGS_STRING_KEYS,
} from '@dydxprotocol/v4-localization';

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
  TOOLTIPS: TOOLTIPS[SupportedLocales.EN],
};

export const STRING_KEYS = {
  ...APP_STRING_KEYS,
  ...ERRORS_STRING_KEYS,
  ...WARNINGS_STRING_KEYS,
};

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
  }: {
    stringGetter: StringGetterFunction;
    stringParams?: any;
  }) => {
    title: string;
    body: string;
    learnMoreLink?: string;
  };
};

export const ORDER_ERROR_CODE_MAP: { [key: number]: string } = {
  2000: '2000_FILL_OR_KILL_ORDER_COULD_NOT_BE_FULLY_FILLED',
  2001: '2001_REDUCE_ONLY_WOULD_INCREASE_POSITION_SIZE',
  2002: '2002_REDUCE_ONLY_WOULD_CHANGE_POSITION_SIDE',
  2003: '2003_POST_ONLY_WOULD_CROSS_MAKER_ORDER',
  3000: '3000_INVALID_ORDER_FLAGS',
  3001: '3001_INVALID_STATEFUL_ORDER_GOOD_TIL_BLOCK_TIME',
  3002: '3002_STATEFUL_ORDERS_CANNOT_REQUIRE_IMMEDIATE_EXECUTION',
  3003: '3003_TIME_EXCEEDS_GOOD_TIL_BLOCK_TIME',
  3004: '3004_GOOD_TIL_BLOCK_TIME_EXCEEDS_STATEFUL_ORDER_TIME_WINDOW',
  3005: '3005_STATEFUL_ORDER_ALREADY_EXISTS',
  3006: '3006_STATEFUL_ORDER_DOES_NOT_EXIST',
  3007: '3007_STATEFUL_ORDER_COLLATERALIZATION_CHECK_FAILED',
  3008: '3008_STATEFUL_ORDER_PREVIOUSLY_CANCELLED',
};
