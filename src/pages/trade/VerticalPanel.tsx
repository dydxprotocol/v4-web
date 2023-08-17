import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { TradeLayouts } from '@/constants/layout';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { Tabs } from '@/components/Tabs';

import { Orderbook, orderbookMixins, OrderbookScrollBehavior } from '@/views/tables/Orderbook';
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
  const [scrollBehavior, setScrollBehavior] = useState<OrderbookScrollBehavior>('snapToCenter');

  const marketId = useSelector(getCurrentMarketId);

  useEffect(() => {
    setScrollBehavior('snapToCenter');
  }, [marketId]);

  return (
    <Styled.Tabs
      fullWidthTabs
      value={value}
      onValueChange={(value: Tab) => {
        setScrollBehavior('snapToCenter');
        setValue(value);
      }}
      items={[
        {
          content: <Orderbook histogramSide={HISTOGRAM_SIDES_BY_LAYOUT[tradeLayout]} />,
          label: stringGetter({ key: STRING_KEYS.ORDERBOOK_SHORT }),
          value: Tab.Orderbook,
        },
        {
          content: <LiveTrades histogramSide={HISTOGRAM_SIDES_BY_LAYOUT[tradeLayout]} />,
          label: stringGetter({ key: STRING_KEYS.TRADES }),
          value: Tab.Trades,
        },
      ]}
      onWheel={() => setScrollBehavior('free')}
      withTransitions={false}
      isShowingOrderbook={value === Tab.Orderbook}
      scrollBehavior={scrollBehavior}
      // style={{
      //   scrollSnapType: {
      //     'snapToCenter': 'y mandatory',
      //     'free': 'none',
      //     'snapToCenterUnlessHovered': 'none',
      //   }[scrollBehavior],
      // }}
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Tabs = styled(Tabs)<{
  isShowingOrderbook: boolean;
  scrollBehavior: OrderbookScrollBehavior;
}>`
  ${orderbookMixins.scrollArea}
`;
