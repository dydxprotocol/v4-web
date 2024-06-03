import { useEffect } from 'react';

import { THEME_NAMES } from '@/constants/styles/colors';
import type { ChartLine, TvWidget } from '@/constants/tvchart';

import { useAppSelector } from '@/state/appTypes';
import { AppColorMode, AppTheme } from '@/state/configs';
import { getAppColorMode, getAppTheme } from '@/state/configsSelectors';

import { assertNever } from '@/lib/assertNever';
import { getChartLineColors, getWidgetOverrides } from '@/lib/tradingView/utils';

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
  chartLines,
  tvWidget,
  isWidgetReady,
}: {
  chartLines: Record<string, ChartLine>;
  tvWidget: TvWidget | null;
  isWidgetReady?: boolean;
}) => {
  const appTheme: AppTheme = useAppSelector(getAppTheme);
  const appColorMode: AppColorMode = useAppSelector(getAppColorMode);

  useEffect(() => {
    if (tvWidget && isWidgetReady) {
      tvWidget.changeTheme?.(THEME_NAMES[appTheme]).then(() => {
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
                break;
              default:
                assertNever(appTheme);
                break;
            }
          }
        }

        // eslint-disable-next-line @typescript-eslint/naming-convention
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
        Object.values(chartLines).forEach(({ chartLineType, line }) => {
          const { maybeQuantityColor, borderColor, backgroundColor, textColor, textButtonColor } =
            getChartLineColors({ chartLineType, appTheme, appColorMode });

          if (maybeQuantityColor) {
            line.setLineColor(maybeQuantityColor).setQuantityBackgroundColor(maybeQuantityColor);
          }

          line
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
