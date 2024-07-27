import { useCallback, useEffect, useRef, useState } from 'react';

import { TradeLayouts } from '@/constants/layout';
import { STRING_KEYS } from '@/constants/localization';
import { ORDERBOOK_HEADER_HEIGHT, ORDERBOOK_ROW_HEIGHT } from '@/constants/orderbook';

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
  const [rowsPerSide, setRowsPerSide] = useState<number | undefined>(undefined);

  const canvasOrderbookRef = useRef<HTMLDivElement>(null);
  const canvasOrderbook = canvasOrderbookRef.current;

  const calculateNumRows = useCallback((orderbookHeight: number) => {
    const maxNumRowsToRender = Math.floor(
      (orderbookHeight - ORDERBOOK_HEADER_HEIGHT - ORDERBOOK_ROW_HEIGHT) /
        (2 * ORDERBOOK_ROW_HEIGHT)
    );
    setRowsPerSide(maxNumRowsToRender);
  }, []);

  useEffect(() => {
    if (canvasOrderbook) {
      const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.contentBoxSize[0]) {
            calculateNumRows(entry.contentBoxSize[0].blockSize);
          } else {
            calculateNumRows(entry.contentRect.height);
          }
        });
      });

      resizeObserver.observe(canvasOrderbook);
    }
  }, [calculateNumRows, canvasOrderbook]);

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
              histogramSide={HISTOGRAM_SIDES_BY_LAYOUT[tradeLayout]}
              rowsPerSide={rowsPerSide}
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
