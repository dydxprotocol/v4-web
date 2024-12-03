import { Dispatch, SetStateAction, useEffect } from 'react';

import isEmpty from 'lodash/isEmpty';
import {
  LanguageCode,
  ResolutionString,
  TradingTerminalWidgetOptions,
  widget as Widget,
} from 'public/tradingview/';
import { useDispatch } from 'react-redux';

import { DEFAULT_RESOLUTION } from '@/constants/candles';
import { SUPPORTED_LOCALE_MAP } from '@/constants/localization';
import type { TvWidget } from '@/constants/tvchart';

import { useAppSelector } from '@/state/appTypes';
import { getAppColorMode, getAppTheme } from '@/state/appUiConfigsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { updateLaunchableMarketsChartConfig } from '@/state/tradingView';
import { getTvChartConfig } from '@/state/tradingViewSelectors';

import { getLaunchableMarketDatafeed } from '@/lib/tradingView/launchableMarketFeed';
import { getSavedResolution, getWidgetOptions, getWidgetOverrides } from '@/lib/tradingView/utils';

import { useMetadataService } from '../useMetadataService';

/**
 * @description Hook to initialize TradingView Chart
 */
export const useTradingViewLaunchable = ({
  tvWidget,
  setTvWidget,
  marketId,
}: {
  tvWidget?: TvWidget;
  setTvWidget: Dispatch<SetStateAction<TvWidget | undefined>>;
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
    if (marketId && !isDataLoading && !tvWidget) {
      const widgetOptions = getWidgetOptions(true);
      const widgetOverrides = getWidgetOverrides({ appTheme, appColorMode });
      const languageCode = SUPPORTED_LOCALE_MAP[selectedLocale].baseTag;

      const options: TradingTerminalWidgetOptions = {
        ...widgetOptions,
        ...widgetOverrides,
        datafeed: getLaunchableMarketDatafeed(metadataServiceData),
        interval: (savedResolution ?? DEFAULT_RESOLUTION) as ResolutionString,
        locale: languageCode as LanguageCode,
        symbol: marketId,
        saved_data: !isEmpty(savedTvChartConfig) ? savedTvChartConfig : undefined,
        auto_save_delay: 1,
        disabled_features: [...(widgetOptions.disabled_features ?? []), 'chart_scroll'],
      };

      const tvChartWidget = new Widget(options);
      setTvWidget(tvChartWidget);

      tvChartWidget.onChartReady(() => {
        tvChartWidget.subscribe('onAutoSaveNeeded', () =>
          tvChartWidget.save((chartConfig: object) => {
            dispatch(updateLaunchableMarketsChartConfig(chartConfig));
          })
        );
      });
    }

    return () => {
      tvWidget?.remove();
    };
  }, [dispatch, !!marketId, selectedLocale, isDataLoading, tvWidget, setTvWidget]);
};
