import { useEffect, useRef, useState } from 'react';

import { TradeLayouts } from '@/constants/layout';
import { STRING_KEYS } from '@/constants/localization';
import { ORDERBOOK_MAX_ROWS_PER_SIDE, ORDERBOOK_ROW_HEIGHT } from '@/constants/orderbook';

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

// xcxc
const MIN_NUMBER_ROWS = 2;
const MAX_NUMBER_ROWS = 30;

export const VerticalPanel = ({ tradeLayout }: { tradeLayout: TradeLayouts }) => {
  const stringGetter = useStringGetter();
  const [value, setValue] = useState(Tab.Orderbook);
  const [maxNumRowsToShow, setMaxNumRowsToShow] = useState(ORDERBOOK_MAX_ROWS_PER_SIDE);
  const [prevHeight, setPrevHeight] = useState<number | undefined>(undefined);

  const canvasOrderbookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateNumRows = () => {
      const viewportHeight = window.innerHeight;
      const verticalPanelHeight = Math.floor((viewportHeight / 51) * 19);
      const numRows = Math.floor(
        (verticalPanelHeight - 2 * ORDERBOOK_ROW_HEIGHT) / (2 * ORDERBOOK_ROW_HEIGHT)
      );

      let secondRowsCalculation = numRows;

      if (canvasOrderbookRef.current && canvasOrderbookRef.current.clientHeight - 66 > 0) {
        secondRowsCalculation = Math.floor(
          (canvasOrderbookRef.current.clientHeight - 66 - ORDERBOOK_ROW_HEIGHT) /
            (2 * ORDERBOOK_ROW_HEIGHT)
        );
      }

      const newRows = Math.max(
        Math.min(
          prevHeight && viewportHeight >= prevHeight
            ? Math.max(numRows, secondRowsCalculation)
            : Math.min(numRows, secondRowsCalculation),
          MAX_NUMBER_ROWS
        ),
        MIN_NUMBER_ROWS
      );

      setMaxNumRowsToShow(newRows);
      setPrevHeight(viewportHeight);
    };

    calculateNumRows();
    window.addEventListener('resize', calculateNumRows);

    return () => window.removeEventListener('resize', calculateNumRows);
  }, [canvasOrderbookRef, prevHeight]);

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
              maxRowsPerSide={maxNumRowsToShow}
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
