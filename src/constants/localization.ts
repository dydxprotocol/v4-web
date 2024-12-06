import { Nullable } from '@dydxprotocol/v4-abacus';
import {
  APP_STRING_KEYS,
  ERRORS_STRING_KEYS,
  LOCALE_DATA,
  NOTIFICATIONS,
  NOTIFICATIONS_STRING_KEYS,
  TOOLTIPS,
  WARNINGS_STRING_KEYS,
} from '@dydxprotocol/v4-localization';

import { StatsigConfigType } from '@/constants/statsig';

import { type LinksConfigs } from '@/hooks/useURLConfigs';

import formatString from '@/lib/formatString';
import { objectFromEntries } from '@/lib/objectHelpers';

import environments from '../../public/configs/v1/env.json';

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

export type StringGetterParams = Record<string, any>;

export type StringGetterProps<T extends StringGetterParams> =
  | {
      key: string;
      params?: T;
      fallback?: string;
    }
  | {
      key?: Nullable<string>;
      params?: T;
      fallback: string;
    };

export type StringGetterFunction = <T extends StringGetterParams>(
  props: StringGetterProps<T>
) => T extends {
  [K in keyof T]: T[K] extends string | number ? any : T[K] extends JSX.Element ? any : never;
}
  ? string
  : ReturnType<typeof formatString>;

export const EU_LOCALES: SupportedLocales[] = [
  SupportedLocales.DE,
  SupportedLocales.PT,
  SupportedLocales.ES,
  SupportedLocales.FR,
];

// Deployer Restricted Locales read from environment configs.
// Filter to ensure we never remove EN
const DEPLOYER_RESTRICTED_LOCALES = environments.restrictedLocales.filter(
  (locale) => locale !== SupportedLocales.EN
) as SupportedLocales[];

export const SUPPORTED_LOCALES = [
  {
    locale: SupportedLocales.EN,
    baseTag: 'en',
    label: 'English',
    browserLanguage: 'en-US',
  },
  {
    locale: SupportedLocales.ZH_CN,
    baseTag: 'zh',
    label: '中文',
    browserLanguage: 'zh-CN',
  },
  {
    locale: SupportedLocales.JA,
    baseTag: 'ja',
    label: '日本語',
    browserLanguage: 'ja-JP',
  },
  {
    locale: SupportedLocales.KO,
    baseTag: 'ko',
    label: '한국어',
    browserLanguage: 'ko-KR',
  },
  {
    locale: SupportedLocales.RU,
    baseTag: 'ru',
    label: 'русский',
    browserLanguage: 'ru-RU',
  },
  {
    locale: SupportedLocales.TR,
    baseTag: 'tr',
    label: 'Türkçe',
    browserLanguage: 'tr-TR',
  },
  {
    locale: SupportedLocales.FR,
    baseTag: 'fr',
    label: 'Français',
    browserLanguage: 'fr-FR',
  },
  {
    locale: SupportedLocales.PT,
    baseTag: 'pt',
    label: 'Português',
    browserLanguage: 'pt-PT',
  },
  {
    locale: SupportedLocales.ES,
    baseTag: 'es',
    label: 'Español',
    browserLanguage: 'es-ES',
  },
  {
    locale: SupportedLocales.DE,
    baseTag: 'de',
    label: 'Deutsch',
    browserLanguage: 'de-DE',
  },
].filter(({ locale }) =>
  DEPLOYER_RESTRICTED_LOCALES.length ? !DEPLOYER_RESTRICTED_LOCALES.includes(locale) : true
);

// Map with locale as key and locale object as value
export const SUPPORTED_LOCALE_MAP = objectFromEntries(
  SUPPORTED_LOCALES.map((locale) => [locale.locale, locale])
);

export type TooltipStrings = {
  [key: string]: ({
    stringGetter,
    stringParams,
    urlConfigs,
    featureFlags,
  }: {
    stringGetter: StringGetterFunction;
    stringParams?: any;
    urlConfigs?: LinksConfigs;
    featureFlags?: StatsigConfigType;
  }) => {
    title?: React.ReactNode;
    body: React.ReactNode;
    learnMoreLink?: string;
  };
};
