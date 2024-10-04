import { useCallback, useEffect, useRef, useState } from 'react';

import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { TradeLayouts } from '@/constants/layout';
import { STRING_KEYS } from '@/constants/localization';
import {
  ORDERBOOK_CONTROLS_HEIGHT,
  ORDERBOOK_MAX_ROWS_PER_SIDE,
  ORDERBOOK_HEADER_HEIGHT,
  ORDERBOOK_ROW_HEIGHT,
} from '@/constants/orderbook';

import { useCalculateOrderbookData } from '@/hooks/Orderbook/useOrderbookValues';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Tabs } from '@/components/Tabs';
import { CanvasOrderbook } from '@/views/CanvasOrderbook/CanvasOrderbook';
import { OrderbookControls } from '@/views/CanvasOrderbook/OrderbookControls';
import { LiveTrades } from '@/views/tables/LiveTrades';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketData } from '@/state/perpetualsSelectors';

import { testFlags } from '@/lib/testFlags';

enum Tab {
  Orderbook = 'Orderbook',
  Trades = 'Trades',
}

const HISTOGRAM_SIDES_BY_LAYOUT = {
  [TradeLayouts.Default]: 'right',
  [TradeLayouts.Reverse]: 'left',
} as const;

export const VerticalPanel = ({ tradeLayout }: { tradeLayout: TradeLayouts }) => {
  const stringGetter = useStringGetter();
  const [value, setValue] = useState(Tab.Orderbook);
  const [rowsPerSide, setRowsPerSide] = useState<number>(ORDERBOOK_MAX_ROWS_PER_SIDE);

  const { uiRefresh } = testFlags;

  const canvasOrderbookRef = useRef<HTMLDivElement>(null);
  const canvasOrderbook = canvasOrderbookRef.current;

  const { assetId: id } = useAppSelector(getCurrentMarketData, shallowEqual) ?? {};
  const { currentGrouping } = useCalculateOrderbookData({
    rowsPerSide,
  });

  const calculateNumRows = useCallback(
    (orderbookHeight: number) => {
      const maxNumRowsToRender = Math.floor(
        (orderbookHeight -
          ORDERBOOK_HEADER_HEIGHT -
          ORDERBOOK_ROW_HEIGHT -
          (uiRefresh ? 0 : ORDERBOOK_CONTROLS_HEIGHT)) /
          (2 * ORDERBOOK_ROW_HEIGHT)
      );
      setRowsPerSide(maxNumRowsToRender);
    },
    [uiRefresh]
  );

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.contentBoxSize[0]) {
          calculateNumRows(entry.contentBoxSize[0].blockSize);
        } else {
          calculateNumRows(entry.contentRect.height);
        }
      });
    });

    if (canvasOrderbook) {
      resizeObserver.observe(canvasOrderbook);
    }

    return () => {
      if (canvasOrderbook) {
        resizeObserver.unobserve(canvasOrderbook);
      } else {
        resizeObserver.disconnect();
      }
    };
  }, [calculateNumRows, canvasOrderbook]);

  return (
    <$Tabs
      fullWidthTabs
      dividerStyle={uiRefresh ? 'underline' : 'border'}
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
          slotToolbar: <OrderbookControls assetId={id} grouping={currentGrouping} />,
          ref: canvasOrderbookRef,
        },
        {
          content: <LiveTrades histogramSide={HISTOGRAM_SIDES_BY_LAYOUT[tradeLayout]} />,
          label: stringGetter({ key: STRING_KEYS.TRADES }),
          value: Tab.Trades,
          slotToolbar: <div />,
        },
      ]}
      withTransitions={false}
    />
  );
};

const $Tabs = styled(Tabs)`
  --toolbar-padding: 0;
  --toolbar-width: 50%;
`;
