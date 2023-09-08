import { useEffect } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import isEmpty from 'lodash/isEmpty';

import { LanguageCode, ResolutionString, widget } from 'public/tradingview/charting_library';

import { DEFAULT_RESOLUTION } from '@/constants/candles';
import { SUPPORTED_LOCALE_BASE_TAGS } from '@/constants/localization';
import { LocalStorageKey } from '@/constants/localStorage';
import { useDydxClient, useLocalStorage } from '@/hooks';
import { store } from '@/state/_store';

import { getSelectedNetwork } from '@/state/appSelectors';
import { getAppTheme } from '@/state/configsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { getCurrentMarketId, getMarketIds } from '@/state/perpetualsSelectors';

import { getDydxDatafeed } from '@/lib/tradingView/dydxfeed';
import { getSavedResolution, getWidgetOptions, getWidgetOverrides } from '@/lib/tradingView/utils';

/**
 * @description Hook to initialize TradingView Chart
 */
export const useTradingView = ({
  tvWidgetRef,
  setIsChartReady,
}: {
  tvWidgetRef: React.MutableRefObject<any>;
  setIsChartReady: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const marketId = useSelector(getCurrentMarketId);
  const appTheme = useSelector(getAppTheme);
  const marketIds = useSelector(getMarketIds, shallowEqual);
  const selectedLocale = useSelector(getSelectedLocale);
  const selectedNetwork = useSelector(getSelectedNetwork);
  const { getCandlesForDatafeed } = useDydxClient();

  const [savedTvChartConfig, setTvChartConfig] = useLocalStorage<object | undefined>({
    key: LocalStorageKey.TradingViewChartConfig,
    defaultValue: undefined,
  });

  const savedResolution = getSavedResolution({ savedConfig: savedTvChartConfig });
  const hasMarkets = marketIds.length > 0;

  useEffect(() => {
    if (hasMarkets) {
      const widgetOptions = getWidgetOptions();
      const widgetOverrides = getWidgetOverrides(appTheme);
      const options = {
        // debug: true,
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
  }, [getCandlesForDatafeed, hasMarkets, selectedLocale, selectedNetwork]);

  return { savedResolution };
};
