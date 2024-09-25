import React, { useEffect } from 'react';

import isEmpty from 'lodash/isEmpty';
import {
  LanguageCode,
  ResolutionString,
  TradingTerminalWidgetOptions,
  widget as Widget,
} from 'public/tradingview/';

import { DEFAULT_RESOLUTION } from '@/constants/candles';
import { LocalStorageKey } from '@/constants/localStorage';
import { SUPPORTED_LOCALE_BASE_TAGS } from '@/constants/localization';
import type { TvWidget } from '@/constants/tvchart';

import { store } from '@/state/_store';
import { useAppSelector } from '@/state/appTypes';
import { getAppColorMode, getAppTheme } from '@/state/configsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { getTickSizeDecimalsFromPrice } from '@/lib/numbers';
import { getLaunchableMarketDatafeed } from '@/lib/tradingView/launchableMarketFeed';
import { getSavedResolution, getWidgetOptions, getWidgetOverrides } from '@/lib/tradingView/utils';

import { useMetadataServiceAssetFromId } from '../useLaunchableMarkets';
import { useLocalStorage } from '../useLocalStorage';

/**
 * @description Hook to initialize TradingView Chart
 */
export const useTradingViewLaunchable = ({
  tvWidgetRef,
  setIsChartReady,
  marketId,
}: {
  tvWidgetRef: React.MutableRefObject<TvWidget | null>;
  setIsChartReady: React.Dispatch<React.SetStateAction<boolean>>;
  marketId: string;
}) => {
  const appTheme = useAppSelector(getAppTheme);
  const appColorMode = useAppSelector(getAppColorMode);

  const selectedLocale = useAppSelector(getSelectedLocale);

  const [savedTvChartConfig, setTvChartConfig] = useLocalStorage<object | undefined>({
    key: LocalStorageKey.TradingViewChartConfigLaunchable,
    defaultValue: undefined,
  });

  const savedResolution = getSavedResolution({ savedConfig: savedTvChartConfig }) ?? undefined;
  const launchableAsset = useMetadataServiceAssetFromId(marketId);

  const tickSizeDecimals = getTickSizeDecimalsFromPrice(launchableAsset?.price ?? 0);

  useEffect(() => {
    if (marketId) {
      const widgetOptions = getWidgetOptions();
      const widgetOverrides = getWidgetOverrides({ appTheme, appColorMode });

      const options: TradingTerminalWidgetOptions = {
        ...widgetOptions,
        ...widgetOverrides,
        datafeed: getLaunchableMarketDatafeed(store, tickSizeDecimals),
        interval: (savedResolution ?? DEFAULT_RESOLUTION) as ResolutionString,
        locale: SUPPORTED_LOCALE_BASE_TAGS[selectedLocale] as LanguageCode,
        symbol: marketId,
        saved_data: !isEmpty(savedTvChartConfig) ? savedTvChartConfig : undefined,
        auto_save_delay: 1,
      };

      const tvChartWidget = new Widget(options);
      tvWidgetRef.current = tvChartWidget;

      tvChartWidget.onChartReady(() => {
        tvWidgetRef?.current?.subscribe('onAutoSaveNeeded', () =>
          tvWidgetRef?.current?.save((chartConfig: object) => setTvChartConfig(chartConfig))
        );

        setIsChartReady(true);
      });
    }

    return () => {
      tvWidgetRef.current?.remove();
      tvWidgetRef.current = null;
      setIsChartReady(false);
    };
  }, [
    appColorMode,
    appTheme,
    marketId,
    savedResolution,
    savedTvChartConfig,
    selectedLocale,
    setIsChartReady,
    setTvChartConfig,
    tvWidgetRef,
  ]);

  return { savedResolution };
};
