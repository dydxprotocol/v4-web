import { useState } from 'react';

import { Trigger } from '@radix-ui/react-tabs';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { Tabs } from '@/components/Tabs';
import { ToggleButton } from '@/components/ToggleButton';
import { AccountInfo } from '@/views/AccountInfo';
import { CanvasOrderbook } from '@/views/CanvasOrderbook/CanvasOrderbook';
import { DepthChart } from '@/views/charts/DepthChart';
import { FundingChart } from '@/views/charts/FundingChart';
import { TvChart } from '@/views/charts/TradingView/TvChart';
import { LiveTrades } from '@/views/tables/LiveTrades';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { isTruthy } from '@/lib/isTruthy';

enum Tab {
  Account = 'Account',
  Price = 'Price',
  Depth = 'Depth',
  Funding = 'Funding',
  OrderBook = 'OrderBook',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  LiveTrades = 'LiveTrades',
}

const TabButton = ({ value, label, icon }: { value: Tab; label: string; icon: IconName }) => (
  <Trigger asChild value={value}>
    <$TabButton>
      <Icon iconName={icon} size="1.375rem" />
      <span>{label}</span>
    </$TabButton>
  </Trigger>
);

export const MobileTopPanel = ({
  isViewingUnlaunchedMarket,
}: {
  isViewingUnlaunchedMarket?: boolean;
}) => {
  const stringGetter = useStringGetter();
  const selectedLocale = useAppSelector(getSelectedLocale);

  const [value, setValue] = useState(Tab.Price);

  const items = [
    {
      content: (
        <AccountInfo tw="[--account-info-section-height-deprecated:--tabContent-height] [--account-info-section-height:--tabContent-height]" />
      ),
      label: stringGetter({ key: STRING_KEYS.WALLET }),
      value: Tab.Account,
      icon: IconName.Coins,
    },
    {
      content: <TvChart />,
      forceMount: true,
      label: stringGetter({ key: STRING_KEYS.PRICE }),
      value: Tab.Price,
      icon: IconName.PriceChart,
    },
    !isViewingUnlaunchedMarket && {
      content: <DepthChart stringGetter={stringGetter} selectedLocale={selectedLocale} />,
      label: stringGetter({ key: STRING_KEYS.DEPTH_CHART_SHORT }),
      value: Tab.Depth,
      icon: IconName.DepthChart,
    },
    !isViewingUnlaunchedMarket && {
      content: <FundingChart selectedLocale={selectedLocale} />,
      label: stringGetter({ key: STRING_KEYS.FUNDING_RATE_CHART_SHORT }),
      value: Tab.Funding,
      icon: IconName.FundingChart,
    },
    !isViewingUnlaunchedMarket && {
      content: (
        <$ScrollableTableContainer>
          <CanvasOrderbook histogramSide="right" layout="horizontal" hideHeader />
        </$ScrollableTableContainer>
      ),
      label: stringGetter({ key: STRING_KEYS.ORDERBOOK_SHORT }),
      value: Tab.OrderBook,
      icon: IconName.Orderbook,
    },
    !isViewingUnlaunchedMarket && {
      content: (
        <$ScrollableTableContainer>
          <LiveTrades histogramSide="left" />
        </$ScrollableTableContainer>
      ),
      label: stringGetter({ key: STRING_KEYS.RECENT }),
      value: Tab.LiveTrades,
      icon: IconName.Clock,
    },
  ].filter(isTruthy);

  return (
    <$Tabs
      value={value}
      onValueChange={setValue}
      items={items.map((item) => ({
        ...item,
        customTrigger: (
          <TabButton key={item.value} label={item.label} value={item.value} icon={item.icon} />
        ),
      }))}
      side="bottom"
    />
  );
};
const $Tabs = styled(Tabs)`
  --scrollArea-height: 20rem;
  --stickyArea0-background: var(--color-layer-2);
  --tabContent-height: calc(20rem - 2rem - var(--tabs-currentHeight));

  min-height: 100%;

  gap: var(--border-width);

  > header {
    padding: 1rem 1.25rem;

    > [role='tablist'] {
      margin: auto;

      gap: 0.5rem;
    }
  }
` as typeof Tabs;

const $TabButton = styled(ToggleButton)`
  padding: 0 0.5rem;

  span {
    transition: 0.25s var(--ease-out-expo);
  }

  &[data-state='inactive'] {
    --button-width: var(--button-height);

    gap: 0;

    span {
      font-size: 0;
      opacity: 0;
    }
  }
`;
const $ScrollableTableContainer = styled.div`
  ${layoutMixins.scrollArea}
  --scrollArea-height: var(--tabContent-height);
  --stickyArea0-topGap: 0px;
`;
