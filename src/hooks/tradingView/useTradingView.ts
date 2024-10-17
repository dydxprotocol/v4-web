import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo } from 'react';

import isEmpty from 'lodash/isEmpty';
import {
  type IBasicDataFeed,
  LanguageCode,
  ResolutionString,
  TradingTerminalWidgetOptions,
  widget as Widget,
} from 'public/tradingview/';

import { DEFAULT_RESOLUTION } from '@/constants/candles';
import { TOGGLE_ACTIVE_CLASS_NAME } from '@/constants/charts';
import { STRING_KEYS, SUPPORTED_LOCALE_BASE_TAGS } from '@/constants/localization';
import { StatsigFlags } from '@/constants/statsig';
import { tooltipStrings } from '@/constants/tooltips';
import type { TvWidget } from '@/constants/tvchart';

import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getAppColorMode, getAppTheme } from '@/state/configsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';
import { updateChartConfig } from '@/state/tradingView';
import { getTvChartConfig } from '@/state/tradingViewSelectors';

import { getSavedResolution, getWidgetOptions, getWidgetOverrides } from '@/lib/tradingView/utils';

import { useAllStatsigGateValues, useStatsigGateValue } from '../useStatsig';
import { useStringGetter } from '../useStringGetter';
import { useURLConfigs } from '../useURLConfigs';
import { useTradingViewLimitOrder } from './useTradingViewLimitOrder';

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
  tickSizeDecimals,
  datafeed,
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
  tickSizeDecimals?: number;
  datafeed: IBasicDataFeed;
}) => {
  const stringGetter = useStringGetter();
  const urlConfigs = useURLConfigs();
  const featureFlags = useAllStatsigGateValues();
  const dispatch = useAppDispatch();

  const appTheme = useAppSelector(getAppTheme);
  const appColorMode = useAppSelector(getAppColorMode);

  const marketId = useAppSelector(getCurrentMarketId);
  const selectedLocale = useAppSelector(getSelectedLocale);
  const selectedNetwork = useAppSelector(getSelectedNetwork);

  const savedTvChartConfig = useAppSelector(getTvChartConfig);
  const ffEnableOrderbookCandles = useStatsigGateValue(StatsigFlags.ffEnableOhlc);

  const savedResolution = useMemo(
    () => getSavedResolution({ savedConfig: savedTvChartConfig }),
    [savedTvChartConfig]
  );

  const initializeToggle = useCallback(
    ({
      toggleRef,
      tvWidget,
      isOn,
      setToggleOn,
      label,
      tooltip,
    }: {
      toggleRef: React.MutableRefObject<HTMLElement | null>;
      tvWidget: TvWidget;
      isOn: boolean;
      setToggleOn: Dispatch<SetStateAction<boolean>>;
      label: string;
      tooltip: string;
    }) => {
      toggleRef.current = tvWidget.createButton();
      toggleRef.current.innerHTML = `<span>${label}</span> <div class="toggle"></div>`;
      toggleRef.current.setAttribute('title', tooltip);
      if (isOn) {
        toggleRef.current.classList.add(TOGGLE_ACTIVE_CLASS_NAME);
      }
      toggleRef.current.onclick = () => setToggleOn((prev) => !prev);
    },
    []
  );

  const tradingViewLimitOrder = useTradingViewLimitOrder(marketId, tickSizeDecimals);

  useEffect(() => {
    if (marketId) {
      const widgetOptions = getWidgetOptions();
      const widgetOverrides = getWidgetOverrides({ appTheme, appColorMode });

      const options: TradingTerminalWidgetOptions = {
        ...widgetOptions,
        ...widgetOverrides,
        datafeed,
        interval: (savedResolution ?? DEFAULT_RESOLUTION) as ResolutionString,
        locale: SUPPORTED_LOCALE_BASE_TAGS[selectedLocale] as LanguageCode,
        symbol: marketId,
        saved_data: !isEmpty(savedTvChartConfig) ? savedTvChartConfig : undefined,
        auto_save_delay: 1,
      };

      const tvChartWidget = new Widget(options);
      tvWidgetRef.current = tvChartWidget;

      tvChartWidget.onChartReady(() => {
        // Initialize additional right-click-menu options
        tvWidgetRef.current?.onContextMenu(tradingViewLimitOrder);

        tvWidgetRef.current?.headerReady().then(() => {
          if (tvWidgetRef.current) {
            // Order Lines
            initializeToggle({
              toggleRef: orderLineToggleRef,
              tvWidget: tvWidgetRef.current,
              isOn: orderLinesToggleOn,
              setToggleOn: setOrderLinesToggleOn,
              label: stringGetter({
                key: STRING_KEYS.ORDER_LINES,
              }),
              tooltip: stringGetter({
                key: STRING_KEYS.ORDER_LINES_TOOLTIP,
              }),
            });

            if (ffEnableOrderbookCandles) {
              // Orderbook Candles (OHLC)
              const getOhlcTooltipString = tooltipStrings.ohlc;
              const { title: ohlcTitle, body: ohlcBody } = getOhlcTooltipString({
                stringGetter,
                stringParams: {},
                urlConfigs,
                featureFlags,
              });

              initializeToggle({
                toggleRef: orderbookCandlesToggleRef,
                tvWidget: tvWidgetRef.current,
                isOn: orderbookCandlesToggleOn,
                setToggleOn: setOrderbookCandlesToggleOn,
                label: `${ohlcTitle}*`,
                tooltip: ohlcBody as string,
              });
            }

            // Buy/Sell Marks
            initializeToggle({
              toggleRef: buySellMarksToggleRef,
              tvWidget: tvWidgetRef.current,
              isOn: buySellMarksToggleOn,
              setToggleOn: setBuySellMarksToggleOn,
              label: stringGetter({
                key: STRING_KEYS.BUYS_SELLS_TOGGLE,
              }),
              tooltip: stringGetter({
                key: STRING_KEYS.BUYS_SELLS_TOGGLE_TOOLTIP,
              }),
            });
          }
        });

        tvWidgetRef?.current?.subscribe('onAutoSaveNeeded', () =>
          tvWidgetRef?.current?.save((chartConfig: object) => {
            dispatch(updateChartConfig(chartConfig));
          })
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
    datafeed,
    tickSizeDecimals !== undefined,
    orderLineToggleRef,
    orderbookCandlesToggleRef,
    buySellMarksToggleRef,
    setBuySellMarksToggleOn,
    setOrderLinesToggleOn,
    setOrderbookCandlesToggleOn,
    orderbookCandlesToggleOn,
    tvWidgetRef,
  ]);

  return { savedResolution };
};
