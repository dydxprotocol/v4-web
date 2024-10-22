import React, { useEffect } from 'react';

import isEmpty from 'lodash/isEmpty';
import {
  LanguageCode,
  ResolutionString,
  TradingTerminalWidgetOptions,
  widget as Widget,
} from 'public/tradingview/';
import { useDispatch } from 'react-redux';

import { DEFAULT_RESOLUTION } from '@/constants/candles';
import { SUPPORTED_LOCALE_BASE_TAGS } from '@/constants/localization';
import type { TvWidget } from '@/constants/tvchart';

import { useAppSelector } from '@/state/appTypes';
import { getAppColorMode, getAppTheme } from '@/state/configsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { updateLaunchableMarketsChartConfig } from '@/state/tradingView';
import { getTvChartConfig } from '@/state/tradingViewSelectors';

import { getLaunchableMarketDatafeed } from '@/lib/tradingView/launchableMarketFeed';
import { getSavedResolution, getWidgetOptions, getWidgetOverrides } from '@/lib/tradingView/utils';

import { useMetadataService } from '../useLaunchableMarkets';

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
  const dispatch = useDispatch();
  const appTheme = useAppSelector(getAppTheme);
  const appColorMode = useAppSelector(getAppColorMode);

  const selectedLocale = useAppSelector(getSelectedLocale);

  const savedTvChartConfig = useAppSelector((s) => getTvChartConfig(s, true));

  const savedResolution = getSavedResolution({ savedConfig: savedTvChartConfig }) ?? undefined;

  const { data: metadataServiceData, isLoading: isDataLoading } = useMetadataService();

  useEffect(() => {
    if (marketId && !isDataLoading) {
      const widgetOptions = getWidgetOptions(true);
      const widgetOverrides = getWidgetOverrides({ appTheme, appColorMode });

      const options: TradingTerminalWidgetOptions = {
        ...widgetOptions,
        ...widgetOverrides,
        datafeed: getLaunchableMarketDatafeed(metadataServiceData),
        interval: (savedResolution ?? DEFAULT_RESOLUTION) as ResolutionString,
        locale: SUPPORTED_LOCALE_BASE_TAGS[selectedLocale] as LanguageCode,
        symbol: marketId,
        saved_data: !isEmpty(savedTvChartConfig) ? savedTvChartConfig : undefined,
        auto_save_delay: 1,
        disabled_features: [...(widgetOptions?.disabled_features ?? []), 'chart_scroll'],
      };

      const tvChartWidget = new Widget(options);
      tvWidgetRef.current = tvChartWidget;

      tvChartWidget.onChartReady(() => {
        tvWidgetRef?.current?.subscribe('onAutoSaveNeeded', () =>
          tvWidgetRef?.current?.save((chartConfig: object) => {
            dispatch(updateLaunchableMarketsChartConfig(chartConfig));
          })
        );

        setIsChartReady(true);
      });
    }

    return () => {
      tvWidgetRef.current?.remove();
      tvWidgetRef.current = null;
      setIsChartReady(false);
    };
  }, [dispatch, !!marketId, selectedLocale, setIsChartReady, tvWidgetRef, isDataLoading]);

  return { savedResolution };
};
