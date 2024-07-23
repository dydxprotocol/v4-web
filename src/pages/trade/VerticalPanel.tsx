import { useEffect, useRef, useState } from 'react';

import { TradeLayouts } from '@/constants/layout';
import { STRING_KEYS } from '@/constants/localization';
import {
  ORDERBOOK_HEADER_HEIGHT,
  ORDERBOOK_MAX_ROWS_PER_SIDE,
  ORDERBOOK_MIN_ROWS_PER_SIDE,
  ORDERBOOK_PAGE_HEIGHT_RATIO,
  ORDERBOOK_ROW_HEIGHT,
} from '@/constants/orderbook';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Tabs } from '@/components/Tabs';
import { CanvasOrderbook } from '@/views/CanvasOrderbook/CanvasOrderbook';
import { LiveTrades } from '@/views/tables/LiveTrades';

enum Tab {
  Orderbook = 'Orderbook',
  Trades = 'Trades',
}

const HISTOGRAM_SIDES_BY_LAYOUT = {
  [TradeLayouts.Default]: 'left',
  [TradeLayouts.Alternative]: 'right',
  [TradeLayouts.Reverse]: 'right',
} as const;

export const VerticalPanel = ({ tradeLayout }: { tradeLayout: TradeLayouts }) => {
  const stringGetter = useStringGetter();
  const [value, setValue] = useState(Tab.Orderbook);
  const [numRowsToShow, setNumRowsToShow] = useState(ORDERBOOK_MAX_ROWS_PER_SIDE);
  const [prevHeight, setPrevHeight] = useState<number | undefined>(undefined);

  const canvasOrderbookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateNumRows = () => {
      // Calculates the number of rows the orderbook should render on each side
      const viewportHeight = window.innerHeight;
      const orderbookHeight = canvasOrderbookRef.current?.clientHeight;

      // The initial calculation calculates the number of rows we should render based on the current window height.
      const verticalPanelHeight = Math.floor(viewportHeight * ORDERBOOK_PAGE_HEIGHT_RATIO);
      const minNumRowsToRender = Math.floor(
        (verticalPanelHeight - ORDERBOOK_ROW_HEIGHT) / (2 * ORDERBOOK_ROW_HEIGHT)
      );

      // The second calculation checks if there is extra vertical space (relevant to large windows) that is not being
      // otherwise used (the parent will flex-grow to fill the space); if so, it calculates the updated number of rows we
      // can now render
      let maxNumRowsToRender = minNumRowsToRender;
      if (orderbookHeight) {
        maxNumRowsToRender = Math.max(
          Math.floor(
            (orderbookHeight - ORDERBOOK_HEADER_HEIGHT - ORDERBOOK_ROW_HEIGHT) /
              (2 * ORDERBOOK_ROW_HEIGHT)
          ),
          maxNumRowsToRender
        );
      }

      const didWindowSizeIncrease = prevHeight && viewportHeight >= prevHeight;
      const numRows = Math.max(
        Math.min(
          didWindowSizeIncrease && orderbookHeight && orderbookHeight < viewportHeight
            ? Math.max(minNumRowsToRender, maxNumRowsToRender)
            : Math.min(minNumRowsToRender, maxNumRowsToRender),
          ORDERBOOK_MAX_ROWS_PER_SIDE
        ),
        ORDERBOOK_MIN_ROWS_PER_SIDE
      );

      setNumRowsToShow(numRows);
      setPrevHeight(viewportHeight);
    };

    calculateNumRows();
    window.addEventListener('resize', calculateNumRows);

    return () => window.removeEventListener('resize', calculateNumRows);

    // We intentionally want to update the listener only when the canvas orderbook height changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasOrderbookRef.current?.clientHeight]);

  return (
    <Tabs
      fullWidthTabs
      value={value}
      onValueChange={(v: Tab) => {
        setValue(v);
      }}
      items={[
        {
          asChild: true,
          content: (
            <CanvasOrderbook
              rowsPerSide={numRowsToShow}
              histogramSide={HISTOGRAM_SIDES_BY_LAYOUT[tradeLayout]}
            />
          ),
          label: stringGetter({ key: STRING_KEYS.ORDERBOOK_SHORT }),
          value: Tab.Orderbook,
          forceMount: true,
          ref: canvasOrderbookRef,
        },
        {
          content: <LiveTrades histogramSide={HISTOGRAM_SIDES_BY_LAYOUT[tradeLayout]} />,
          label: stringGetter({ key: STRING_KEYS.TRADES }),
          value: Tab.Trades,
        },
      ]}
      withTransitions={false}
    />
  );
};
