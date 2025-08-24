import { useContinuousTradeGeneration } from '@/bonsai/websocket/trades';
import { Tabs } from '@/components/Tabs';
import { TradeLayouts } from '@/constants/layout';
import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks/useStringGetter';
import { LiveTrades } from '@/views/tables/LiveTrades';
import { useState } from 'react';
import styled from 'styled-components';


enum Tab {
    Orderbook = 'Orderbook',
    Trades = 'Trades',
}

// Define histogram sides mapping locally
const HISTOGRAM_SIDES_BY_LAYOUT = {
  [TradeLayouts.Default]: 'right',
  [TradeLayouts.Reverse]: 'left',
} as const;

export const VerticalPanel = ({ tradeLayout }: { tradeLayout: TradeLayouts }) => {
  const stringGetter = useStringGetter();
  const [value, setValue] = useState(Tab.Trades);


  // Continuous trade generation - starts automatically (no UI needed)
  useContinuousTradeGeneration(1000, true); // 1 second interval, auto-start enabled

  return (
    <$Tabs
      fullWidthTabs
      dividerStyle="underline"
      value={value}
      onValueChange={(v: Tab) => {
        setValue(v);
      }}
      items={[
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

const $Tabs = styled(Tabs)`
  --trigger-active-underline-backgroundColor: var(--color-layer-2);
` as typeof Tabs;
