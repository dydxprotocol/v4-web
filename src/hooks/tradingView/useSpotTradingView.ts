import { Dispatch, SetStateAction, useEffect, useMemo } from 'react';

import { isEmpty } from 'lodash';
import {
  LanguageCode,
  ResolutionString,
  TradingTerminalWidgetOptions,
  widget as Widget,
} from 'public/tradingview/';

import { DEFAULT_RESOLUTION } from '@/constants/candles';
import { SUPPORTED_LOCALE_MAP } from '@/constants/localization';
import type { TvWidget } from '@/constants/tvchart';

import { useEndpointsConfig } from '@/hooks/useEndpointsConfig';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getAppColorMode, getAppTheme } from '@/state/appUiConfigsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { updateSpotChartConfig } from '@/state/tradingView';
import { getTvChartConfig } from '@/state/tradingViewSelectors';

import { getSpotDatafeed } from '@/lib/tradingView/spotDatafeed';
import { getSavedResolution, getWidgetOptions, getWidgetOverrides } from '@/lib/tradingView/utils';

import { useBreakpoints } from '../useBreakpoints';
import { useSimpleUiEnabled } from '../useSimpleUiEnabled';

export const useSpotTradingView = ({
  setTvWidget,
  symbol,
}: {
  setTvWidget: Dispatch<SetStateAction<TvWidget | undefined>>;
  symbol: string;
}) => {
  const dispatch = useAppDispatch();
  const { isTablet } = useBreakpoints();
  const appTheme = useAppSelector(getAppTheme);
  const appColorMode = useAppSelector(getAppColorMode);
  const selectedLocale = useAppSelector(getSelectedLocale);
  const isSimpleUi = useSimpleUiEnabled();
  const { spotCandleService } = useEndpointsConfig();

  const savedTvChartConfig = useAppSelector((state) => getTvChartConfig(state, false, true));

  const savedResolution = useMemo(
    () => getSavedResolution({ savedConfig: savedTvChartConfig }),
    [savedTvChartConfig]
  );

  useEffect(() => {
    if (!symbol || !spotCandleService) {
      return () => {};
    }

    const widgetOptions = getWidgetOptions(false, isSimpleUi, isTablet, true);
    const widgetOverrides = getWidgetOverrides({ appTheme, appColorMode, isSimpleUi });
    const languageCode = SUPPORTED_LOCALE_MAP[selectedLocale].baseTag;

    const options: TradingTerminalWidgetOptions = {
      ...widgetOptions,
      ...widgetOverrides,
      datafeed: getSpotDatafeed(spotCandleService),
      interval: (savedResolution ?? DEFAULT_RESOLUTION) as ResolutionString,
      locale: languageCode as LanguageCode,
      symbol,
      saved_data: !isEmpty(savedTvChartConfig) ? savedTvChartConfig : undefined,
      auto_save_delay: 1,
    };

    const tvChartWidget = new Widget(options);
    setTvWidget(tvChartWidget);

    tvChartWidget.onChartReady(() => {
      tvChartWidget.subscribe('onAutoSaveNeeded', () =>
        tvChartWidget.save((chartConfig: object) => {
          dispatch(updateSpotChartConfig(chartConfig));
        })
      );
    });

    return () => {
      tvChartWidget.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedLocale,
    symbol,
    spotCandleService,
    setTvWidget,
    isSimpleUi,
    isTablet,
    savedResolution,
    dispatch,
  ]);
};
