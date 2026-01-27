import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import isEmpty from 'lodash/isEmpty';
import {
  LanguageCode,
  ResolutionString,
  TradingTerminalWidgetOptions,
  widget as Widget,
} from 'public/tradingview/';

import { DEFAULT_RESOLUTION } from '@/constants/candles';
import { TOGGLE_ACTIVE_CLASS_NAME } from '@/constants/charts';
import { STRING_KEYS, SUPPORTED_LOCALE_MAP } from '@/constants/localization';
import type { TvWidget } from '@/constants/tvchart';

import { store } from '@/state/_store';
import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getAppColorMode, getAppTheme } from '@/state/appUiConfigsSelectors';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { updateChartConfig } from '@/state/tradingView';
import { getTvChartConfig } from '@/state/tradingViewSelectors';

import { getDydxDatafeed } from '@/lib/tradingView/dydxfeed';
import { getSavedResolution, getWidgetOptions, getWidgetOverrides } from '@/lib/tradingView/utils';
import { orEmptyObj } from '@/lib/typeUtils';

import { useBreakpoints } from '../useBreakpoints';
import { useDydxClient } from '../useDydxClient';
import { useLocaleSeparators } from '../useLocaleSeparators';
import { useSimpleUiEnabled } from '../useSimpleUiEnabled';
import { useStringGetter } from '../useStringGetter';
import { useTradingViewLimitOrder } from './useTradingViewLimitOrder';

/**
 * @description Hook to initialize TradingView Chart
 */
export const useTradingView = ({
  setTvWidget,
  orderLineToggleRef,
  orderLinesToggleOn,
  setOrderLinesToggleOn,
  buySellMarksToggleRef,
  buySellMarksToggleOn,
  setBuySellMarksToggleOn,
}: {
  setTvWidget: Dispatch<SetStateAction<TvWidget | undefined>>;
  orderLineToggleRef: React.MutableRefObject<HTMLElement | null>;
  orderLinesToggleOn: boolean;
  setOrderLinesToggleOn: Dispatch<SetStateAction<boolean>>;
  buySellMarksToggleRef: React.MutableRefObject<HTMLElement | null>;
  buySellMarksToggleOn: boolean;
  setBuySellMarksToggleOn: Dispatch<SetStateAction<boolean>>;
}) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const { group, decimal } = useLocaleSeparators();

  const { isTablet } = useBreakpoints();
  const appTheme = useAppSelector(getAppTheme);
  const appColorMode = useAppSelector(getAppColorMode);

  const marketId = useAppSelector(getCurrentMarketId);
  const selectedLocale = useAppSelector(getSelectedLocale);
  const selectedNetwork = useAppSelector(getSelectedNetwork);

  const { getCandlesForDatafeed } = useDydxClient();

  const savedTvChartConfig = useAppSelector(getTvChartConfig);

  const savedResolution = useMemo(
    () => getSavedResolution({ savedConfig: savedTvChartConfig }),
    [savedTvChartConfig]
  );

  const { tickSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const initializeToggle = useCallback(
    ({
      toggleRef,
      widget,
      isOn,
      setToggleOn,
      label,
      tooltip,
    }: {
      toggleRef: React.MutableRefObject<HTMLElement | null>;
      widget: TvWidget;
      isOn: boolean;
      setToggleOn: Dispatch<SetStateAction<boolean>>;
      label: string;
      tooltip: string;
    }) => {
      toggleRef.current = widget.createButton();
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
  const isSimpleUi = useSimpleUiEnabled();

  useEffect(() => {
    if (marketId) {
      const widgetOptions = getWidgetOptions(false, isSimpleUi, isTablet);
      const widgetOverrides = getWidgetOverrides({ appTheme, appColorMode, isSimpleUi });
      const languageCode = SUPPORTED_LOCALE_MAP[selectedLocale].baseTag;

      const options: TradingTerminalWidgetOptions = {
        ...widgetOptions,
        ...widgetOverrides,
        datafeed: getDydxDatafeed(
          store,
          getCandlesForDatafeed,
          { decimal, group },
          selectedLocale,
          stringGetter
        ),
        interval: (savedResolution ?? DEFAULT_RESOLUTION) as ResolutionString,
        locale: languageCode as LanguageCode,
        symbol: marketId,
        saved_data: !isEmpty(savedTvChartConfig) ? savedTvChartConfig : undefined,
        auto_save_delay: 1,
      };

      const tvChartWidget = new Widget(options);
      setTvWidget(tvChartWidget);

      tvChartWidget.onChartReady(() => {
        // Initialize additional right-click-menu options
        tvChartWidget!.onContextMenu(tradingViewLimitOrder);

        tvChartWidget!.headerReady().then(() => {
          // Order Lines
          initializeToggle({
            toggleRef: orderLineToggleRef,
            widget: tvChartWidget!,
            isOn: orderLinesToggleOn,
            setToggleOn: setOrderLinesToggleOn,
            label: stringGetter({
              key: STRING_KEYS.ORDER_LINES,
            }),
            tooltip: stringGetter({
              key: STRING_KEYS.ORDER_LINES_TOOLTIP,
            }),
          });

          // Buy/Sell Marks
          initializeToggle({
            toggleRef: buySellMarksToggleRef,
            widget: tvChartWidget!,
            isOn: buySellMarksToggleOn,
            setToggleOn: setBuySellMarksToggleOn,
            label: stringGetter({
              key: STRING_KEYS.BUYS_SELLS_TOGGLE,
            }),
            tooltip: stringGetter({
              key: STRING_KEYS.BUYS_SELLS_TOGGLE_TOOLTIP,
            }),
          });
        });

        tvChartWidget!.subscribe('onAutoSaveNeeded', () =>
          tvChartWidget!.save((chartConfig: object) => {
            dispatch(updateChartConfig(chartConfig));
          })
        );
      });

      return () => {
        orderLineToggleRef.current?.remove();
        orderLineToggleRef.current = null;
        buySellMarksToggleRef.current?.remove();
        buySellMarksToggleRef.current = null;
        tvChartWidget.remove();
      };
    }
    return () => {};
  }, [
    selectedLocale,
    selectedNetwork,
    orderLineToggleRef,
    buySellMarksToggleRef,
    setBuySellMarksToggleOn,
    setOrderLinesToggleOn,
    setTvWidget,
    !!marketId,
    isSimpleUi,
    isTablet,
  ]);
};
