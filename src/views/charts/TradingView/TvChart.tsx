import { useCallback, useRef } from 'react';

import { IChartingLibraryWidget } from 'public/charting_library';

import { DEFAULT_MARKETID } from '@/constants/markets';

import { useBuySellMarks } from '@/hooks/tradingView/useBuySellMarks';
import { useChartLines } from '@/hooks/tradingView/useChartLines';
import { useChartMarketAndResolution } from '@/hooks/tradingView/useChartMarketAndResolution';
import { useTradingView } from '@/hooks/tradingView/useTradingView';
import { useTradingViewTheme } from '@/hooks/tradingView/useTradingViewTheme';
import { useTradingViewToggles } from '@/hooks/tradingView/useTradingViewToggles';
import { useBreakpoints } from '@/hooks/useBreakpoints';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';

import { testFlags } from '@/lib/testFlags';

import { BaseTvChart } from './BaseTvChart';

export const TvChart = () => {
  const currentMarketId: string = useAppSelector(getCurrentMarketId) ?? DEFAULT_MARKETID;

  // const [tvWidget, setTvWidget] = useState<TvWidget>();
  const tvWidgetRef = useRef<IChartingLibraryWidget | undefined>(undefined);
  const tvWidget = tvWidgetRef.current;

  const setTvWidget = useCallback((widget: IChartingLibraryWidget) => {
    tvWidgetRef.current = widget;
  }, []);

  const { isTablet } = useBreakpoints();
  const isSimpleUi = isTablet && testFlags.simpleUi;

  const orderLineToggleRef = useRef<HTMLElement | null>(null);
  const orderLineToggle = orderLineToggleRef.current;

  const buySellMarksToggleRef = useRef<HTMLElement | null>(null);
  const buySellMarksToggle = buySellMarksToggleRef.current;

  const {
    orderLinesToggleOn,
    setOrderLinesToggleOn,
    setBuySellMarksToggleOn,
    buySellMarksToggleOn,
  } = useTradingViewToggles();

  useTradingView({
    setTvWidget,
    orderLineToggleRef,
    orderLinesToggleOn,
    setOrderLinesToggleOn,
    buySellMarksToggleRef,
    buySellMarksToggleOn,
    setBuySellMarksToggleOn,
  });

  useChartMarketAndResolution({
    currentMarketId,
    tvWidget,
  });

  const { chartLines } = useChartLines({
    tvWidget,
    orderLineToggle,
    orderLinesToggleOn,
  });

  useBuySellMarks({
    buySellMarksToggle,
    buySellMarksToggleOn,
    tvWidget,
  });
  useTradingViewTheme({ tvWidget, chartLines });

  return <BaseTvChart tvWidget={tvWidget} isSimpleUi={isSimpleUi} />;
};
