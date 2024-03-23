import React, { useEffect } from 'react';

import isEmpty from 'lodash/isEmpty';
import { LanguageCode, ResolutionString, widget } from 'public/tradingview/charting_library';
import { shallowEqual, useSelector } from 'react-redux';

import { DEFAULT_RESOLUTION } from '@/constants/candles';
import { LocalStorageKey } from '@/constants/localStorage';
import { SUPPORTED_LOCALE_BASE_TAGS, STRING_KEYS } from '@/constants/localization';
import type { TvWidget } from '@/constants/tvchart';

import { useDydxClient, useLocalStorage, useStringGetter } from '@/hooks';

import { store } from '@/state/_store';
import { getSelectedNetwork } from '@/state/appSelectors';
import { getAppTheme, getAppColorMode } from '@/state/configsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { getCurrentMarketId, getMarketIds } from '@/state/perpetualsSelectors';

import { getDydxDatafeed } from '@/lib/tradingView/dydxfeed';
import { getSavedResolution, getWidgetOptions, getWidgetOverrides } from '@/lib/tradingView/utils';

/**
 * @description Hook to initialize TradingView Chart
 */
export const useTradingView = ({
  tvWidgetRef,
  displayButtonRef,
  setIsChartReady,
}: {
  tvWidgetRef: React.MutableRefObject<TvWidget | null>;
  displayButtonRef: React.MutableRefObject<HTMLElement | null>;
  setIsChartReady: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const stringGetter = useStringGetter();

  const appTheme = useSelector(getAppTheme);
  const appColorMode = useSelector(getAppColorMode);

  const marketId = useSelector(getCurrentMarketId);
  const selectedLocale = useSelector(getSelectedLocale);
  const selectedNetwork = useSelector(getSelectedNetwork);
  const { getCandlesForDatafeed } = useDydxClient();

  const [savedTvChartConfig, setTvChartConfig] = useLocalStorage<object | undefined>({
    key: LocalStorageKey.TradingViewChartConfig,
    defaultValue: undefined,
  });

  const savedResolution = getSavedResolution({ savedConfig: savedTvChartConfig });

  useEffect(() => {
    const widgetOptions = getWidgetOptions();
    const widgetOverrides = getWidgetOverrides({ appTheme, appColorMode });
    const options = {
      ...widgetOptions,
      ...widgetOverrides,
      datafeed: getDydxDatafeed(store, getCandlesForDatafeed),
      interval: (savedResolution || DEFAULT_RESOLUTION) as ResolutionString,
      locale: SUPPORTED_LOCALE_BASE_TAGS[selectedLocale] as LanguageCode,
      symbol: marketId,
      saved_data: !isEmpty(savedTvChartConfig) ? savedTvChartConfig : undefined,
    };

    const tvChartWidget = new widget(options);
    tvWidgetRef.current = tvChartWidget;

    tvWidgetRef.current.onChartReady(() => {
      tvWidgetRef.current?.headerReady().then(() => {
        if (displayButtonRef && tvWidgetRef.current) {
          displayButtonRef.current = tvWidgetRef.current.createButton();
          displayButtonRef.current.innerHTML = `<span>${stringGetter({
            key: STRING_KEYS.ORDER_LINES,
          })}</span> <div class="displayOrdersButton-toggle"></div>`;
          displayButtonRef.current.setAttribute(
            'title',
            stringGetter({ key: STRING_KEYS.ORDER_LINES_TOOLTIP })
          );
        }
      });

      tvWidgetRef?.current?.subscribe('onAutoSaveNeeded', () =>
        tvWidgetRef?.current?.save((chartConfig: object) => setTvChartConfig(chartConfig))
      );

      setIsChartReady(true);
    });

    return () => {
      displayButtonRef.current?.remove();
      displayButtonRef.current = null;
      tvWidgetRef.current?.remove();
      tvWidgetRef.current = null;
      setIsChartReady(false);
    };
  }, [selectedLocale, selectedNetwork]);

  return { savedResolution };
};
