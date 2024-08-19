import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
import isEmpty from 'lodash/isEmpty';
import {
  LanguageCode,
  ResolutionString,
  widget as Widget,
} from 'public/tradingview/charting_library';
import { shallowEqual } from 'react-redux';

import { DEFAULT_RESOLUTION } from '@/constants/candles';
import { LocalStorageKey } from '@/constants/localStorage';
import { STRING_KEYS, SUPPORTED_LOCALE_BASE_TAGS, TOOLTIP_STRING_KEYS } from '@/constants/localization';
import type { TvWidget } from '@/constants/tvchart';

import { store } from '@/state/_store';
import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getAppColorMode, getAppTheme } from '@/state/configsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { getCurrentMarketId, getMarketIds } from '@/state/perpetualsSelectors';

import { getDydxDatafeed } from '@/lib/tradingView/dydxfeed';
import { getSavedResolution, getWidgetOptions, getWidgetOverrides } from '@/lib/tradingView/utils';

import { useDydxClient } from '../useDydxClient';
import { useEnvFeatures } from '../useEnvFeatures';
import { useLocalStorage } from '../useLocalStorage';
import { useLocaleSeparators } from '../useLocaleSeparators';
import { useAllStatsigGateValues } from '../useStatsig';
import { useStringGetter } from '../useStringGetter';
import { useURLConfigs } from '../useURLConfigs';

/**
 * @description Hook to initialize TradingView Chart
 */
export const useTradingView = ({
  tvWidgetRef,
  orderLineToggleRef,
  orderLinesToggleOn,
  setOrderLinesToggleOn,
  orderbookCandlesToggleRef,
  orderbookCandlesToggleOn,
  setOrderbookCandlesToggleOn,
  buySellMarksToggleRef,
  buySellMarksToggleOn,
  setBuySellMarksToggleOn,
  setIsChartReady,
}: {
  tvWidgetRef: React.MutableRefObject<TvWidget | null>;
  orderLineToggleRef: React.MutableRefObject<HTMLElement | null>;
  orderLinesToggleOn: boolean;
  setOrderLinesToggleOn: Dispatch<SetStateAction<boolean>>;
  orderbookCandlesToggleRef: React.MutableRefObject<HTMLElement | null>;
  orderbookCandlesToggleOn: boolean;
  setOrderbookCandlesToggleOn: Dispatch<SetStateAction<boolean>>;
  buySellMarksToggleRef: React.MutableRefObject<HTMLElement | null>;
  buySellMarksToggleOn: boolean;
  setBuySellMarksToggleOn: Dispatch<SetStateAction<boolean>>;
  setIsChartReady: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const stringGetter = useStringGetter();
  const urlConfigs = useURLConfigs();
  const featureFlags = useAllStatsigGateValues();
  const { isOhlcEnabled } = useEnvFeatures();
  const { group, decimal } = useLocaleSeparators();

  const appTheme = useAppSelector(getAppTheme);
  const appColorMode = useAppSelector(getAppColorMode);

  const marketId = useAppSelector(getCurrentMarketId);
  const marketIds = useAppSelector(getMarketIds, shallowEqual);
  const selectedLocale = useAppSelector(getSelectedLocale);
  const selectedNetwork = useAppSelector(getSelectedNetwork);

  const { getCandlesForDatafeed, getMarketTickSize } = useDydxClient();

  const [savedTvChartConfig, setTvChartConfig] = useLocalStorage<object | undefined>({
    key: LocalStorageKey.TradingViewChartConfig,
    defaultValue: undefined,
  });

  const savedResolution = getSavedResolution({ savedConfig: savedTvChartConfig });

  const [initialPriceScale, setInitialPriceScale] = useState<number | null>(null);

  const hasMarkets = marketIds.length > 0;
  const hasPriceScaleInfo = initialPriceScale !== null || hasMarkets;

  const initializeToggle = useCallback(
    ({
      toggleRef,
      tvWidget,
      isOn,
      setToggleOn,
      labelStringKey,
      tooltipStringKey,
    }: {
      toggleRef: React.MutableRefObject<HTMLElement | null>;
      tvWidget: TvWidget;
      isOn: boolean;
      setToggleOn: Dispatch<SetStateAction<boolean>>;
      labelStringKey: string;
      tooltipStringKey: string;
    }) => {
      toggleRef.current = tvWidget.createButton();
      toggleRef.current.innerHTML = `<span>${stringGetter({
        key: labelStringKey,
      })}</span> <div class="toggle"></div>`;
      toggleRef.current.setAttribute('title', stringGetter({ key: tooltipStringKey }));
      if (isOn) {
        toggleRef.current.classList.add('toggle-active');
      }
      toggleRef.current.onclick = () => setToggleOn((prev) => !prev);
    },
    [stringGetter]
  );

  useEffect(() => {
    // we only need tick size from current market for the price scale settings
    // if markets haven't been loaded via abacus, get the current market info from indexer
    (async () => {
      if (marketId && !hasPriceScaleInfo) {
        const marketTickSize = await getMarketTickSize(marketId);
        const priceScale = BigNumber(10).exponentiatedBy(
          BigNumber(marketTickSize).decimalPlaces() ?? 2
        );
        setInitialPriceScale(priceScale.toNumber());
      }
    })();
  }, [marketId, hasPriceScaleInfo, getMarketTickSize]);

  useEffect(() => {
    if (marketId && hasPriceScaleInfo) {
      const widgetOptions = getWidgetOptions();
      const widgetOverrides = getWidgetOverrides({ appTheme, appColorMode });
      const options = {
        ...widgetOptions,
        ...widgetOverrides,
        datafeed: getDydxDatafeed(
          store,
          getCandlesForDatafeed,
          initialPriceScale,
          orderbookCandlesToggleOn,
          { decimal, group },
          selectedLocale,
          stringGetter
        ),
        interval: (savedResolution ?? DEFAULT_RESOLUTION) as ResolutionString,
        locale: SUPPORTED_LOCALE_BASE_TAGS[selectedLocale] as LanguageCode,
        symbol: marketId,
        saved_data: !isEmpty(savedTvChartConfig) ? savedTvChartConfig : undefined,
        auto_save_delay: 1,
      };

      const tvChartWidget = new Widget(options);
      tvWidgetRef.current = tvChartWidget;

      tvWidgetRef.current?.onChartReady(() => {
        tvWidgetRef.current?.headerReady().then(() => {
          if (tvWidgetRef.current) {
            if (orderLineToggleRef) {
              initializeToggle({
                toggleRef: orderLineToggleRef,
                tvWidget: tvWidgetRef.current,
                isOn: orderLinesToggleOn,
                setToggleOn: setOrderLinesToggleOn,
                labelStringKey: STRING_KEYS.ORDER_LINES,
                tooltipStringKey: STRING_KEYS.ORDER_LINES_TOOLTIP,
              });
            }
            if (isOhlcEnabled && orderbookCandlesToggleRef) {
              initializeToggle({
                toggleRef: buySellMarksToggleRef,
                tvWidget: tvWidgetRef.current,
                isOn: orderbookCandlesToggleOn,
                setToggleOn: setOrderbookCandlesToggleOn,
                labelStringKey: TOOLTIP_STRING_KEYS.OHLC_TITLE, 
                tooltipStringKey: TOOLTIP_STRING_KEYS.OHLC_BODY, 
              });
            }
            if (buySellMarksToggleRef) {
              initializeToggle({
                toggleRef: buySellMarksToggleRef,
                tvWidget: tvWidgetRef.current,
                isOn: setBuySellMarksToggleOn,
                setToggleOn: setBuySellMarksToggleOn,
                labelStringKey: STRING_KEYS.BUYS_SELLS_TOGGLE,
                tooltipStringKey: STRING_KEYS.BUYS_SELLS_TOGGLE_TOOLTIP,
              });
            }
          }
        });

        tvWidgetRef?.current?.subscribe('onAutoSaveNeeded', () =>
          tvWidgetRef?.current?.save((chartConfig: object) => setTvChartConfig(chartConfig))
        );

        setIsChartReady(true);
      });
    }

    return () => {
      orderLineToggleRef.current?.remove();
      orderLineToggleRef.current = null;
      orderbookCandlesToggleRef.current?.remove();
      orderbookCandlesToggleRef.current = null;
      buySellMarksToggleRef.current?.remove();
      buySellMarksToggleRef.current = null;
      tvWidgetRef.current?.remove();
      tvWidgetRef.current = null;
      setIsChartReady(false);
    };
  }, [
    selectedLocale,
    selectedNetwork,
    !!marketId,
    hasPriceScaleInfo,
    orderbookCandlesToggleOn,
    orderLineToggleRef,
    orderbookCandlesToggleRef,
    buySellMarksToggleRef,
    setBuySellMarksToggleOn,
    setOrderLinesToggleOn,
    setOrderbookCandlesToggleOn,
    tvWidgetRef
  ]);

  return { savedResolution };
};
