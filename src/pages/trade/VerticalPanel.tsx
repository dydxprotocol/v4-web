import { useState } from 'react';

import { TradeLayouts } from '@/constants/layout';
import { STRING_KEYS } from '@/constants/localization';

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
          content: <CanvasOrderbook histogramSide={HISTOGRAM_SIDES_BY_LAYOUT[tradeLayout]} />,
          label: stringGetter({ key: STRING_KEYS.ORDERBOOK_SHORT }),
          value: Tab.Orderbook,
          forceMount: true,
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
