import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import type { IChartingLibraryWidget, ThemeName } from 'public/tradingview/charting_library';

import { AppColorMode, AppTheme } from '@/state/configs';
import { getAppTheme, getAppColorMode } from '@/state/configsSelectors';
import { getOrderLines } from '@/state/perpetualsSelectors';

import { getWidgetOverrides, getOrderLineColors } from '@/lib/tradingView/utils';

/**
 * @description Method to define a type guard and check that an element is an IFRAME
 * @param element: HTMLElement
 * @returns boolean on whether the element is an IFRAME
 */
const isIFrame = (element: HTMLElement | null): element is HTMLIFrameElement =>
  element !== null && element.tagName === 'IFRAME';

/**
 * @description Hook to manage switching Themes
 * TradingView only handles 'Dark' | 'Light' themes.
 * In order to support our Classic along with Dark/Light, we are directly accessing the <html> within the iFrame.
 */
export const useTradingViewTheme = ({
  tvWidget,
  isWidgetReady,
}: {
  tvWidget: (IChartingLibraryWidget & { _id?: string; _ready?: boolean }) | null;
  isWidgetReady?: boolean;
}) => {
  const appTheme: AppTheme = useSelector(getAppTheme);
  const appColorMode: AppColorMode = useSelector(getAppColorMode);

  const orderLines = useSelector(getOrderLines);

  useEffect(() => {
    if (tvWidget && isWidgetReady) {
      tvWidget
        .changeTheme?.(
          {
            [AppTheme.Classic]: '',
            [AppTheme.Dark]: 'dark',
            [AppTheme.Light]: 'light',
          }[appTheme] as ThemeName
        )
        .then(() => {
          const tvChartId = tvWidget?._id;

          if (tvChartId) {
            const frame = document?.getElementById(tvChartId);

            if (isIFrame(frame) && frame.contentWindow) {
              const innerHtml = frame.contentWindow.document.documentElement;
              switch (appTheme) {
                case AppTheme.Classic:
                  innerHtml?.classList.remove('theme-dark', 'theme-light');
                  break;
                case AppTheme.Dark:
                  innerHtml?.classList.remove('theme-light');
                  innerHtml?.classList.add('theme-dark');
                  break;
                case AppTheme.Light:
                  innerHtml?.classList.remove('theme-dark');
                  innerHtml?.classList.add('theme-light');
              }
            }
          }

          const { overrides, studies_overrides } = getWidgetOverrides({ appTheme, appColorMode });
          tvWidget?.applyOverrides(overrides);
          tvWidget?.applyStudiesOverrides(studies_overrides);

          // Necessary to update existing indicators
          const volumeStudyId = tvWidget
            ?.activeChart()
            ?.getAllStudies()
            ?.find((x) => x.name === 'Volume')?.id;

          if (volumeStudyId) {
            const volume = tvWidget?.activeChart()?.getStudyById(volumeStudyId);
            volume.applyOverrides({
              'volume.color.0': studies_overrides['volume.volume.color.0'],
              'volume.color.1': studies_overrides['volume.volume.color.1'],
            });
          }

          // Necessary to update existing chart lines
          Object.entries(orderLines).forEach(([key, line]) => {
            const { orderColor, borderColor, backgroundColor, textColor, textButtonColor } =
              getOrderLineColors({ side: key.split('-')[0], appTheme, appColorMode });

            line
              .setLineColor(orderColor)
              .setQuantityBackgroundColor(orderColor)
              .setQuantityBorderColor(borderColor)
              .setBodyBackgroundColor(backgroundColor)
              .setBodyBorderColor(borderColor)
              .setBodyTextColor(textColor)
              .setQuantityTextColor(textButtonColor);
          });
        });
    }
  }, [appTheme, appColorMode, isWidgetReady]);
};
