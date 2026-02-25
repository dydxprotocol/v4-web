import { useState } from 'react';

import { Trigger } from '@radix-ui/react-tabs';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Tabs } from '@/components/Tabs';
import { ToggleButton } from '@/components/ToggleButton';
import { DepthChart } from '@/views/charts/DepthChart';
import { FundingChart } from '@/views/charts/FundingChart';
import { TvChart } from '@/views/charts/TradingView/TvChart';
import { LiveTrades } from '@/views/tables/LiveTrades';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { getSimpleStyledOutputType } from '@/lib/genericFunctionalComponentUtils';
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

const TabButton = ({ value, label }: { value: Tab; label: string }) => (
  <Trigger asChild value={value}>
    <$TabButton>
      <span>{label}</span>
    </$TabButton>
  </Trigger>
);

enum HeightMode {
  Short = 'Short',
  Normal = 'Normal',
  Mobile = 'Mobile',
}

export const MobileTopPanel = ({
  isViewingUnlaunchedMarket,
}: {
  isViewingUnlaunchedMarket?: boolean;
}) => {
  const stringGetter = useStringGetter();
  const selectedLocale = useAppSelector(getSelectedLocale);
  const { isTablet } = useBreakpoints();

  const [value, setValue] = useState(Tab.Price);

  const items = [
    {
      content: <TvChart />,
      forceMount: true,
      label: 'Chart', // TODO: stringGetter({ key: STRING_KEYS.CHART }),
      value: Tab.Price,
    },
    !isViewingUnlaunchedMarket && {
      content: <DepthChart stringGetter={stringGetter} selectedLocale={selectedLocale} />,
      label: stringGetter({ key: STRING_KEYS.DEPTH_CHART_SHORT }),
      value: Tab.Depth,
    },
    !isViewingUnlaunchedMarket && {
      content: (
        <$ScrollableTableContainer>
          <LiveTrades histogramSide="left" />
        </$ScrollableTableContainer>
      ),
      label: stringGetter({ key: STRING_KEYS.TRADES }),
      value: Tab.LiveTrades,
    },
    !isViewingUnlaunchedMarket && {
      content: <FundingChart selectedLocale={selectedLocale} />,
      label: stringGetter({ key: STRING_KEYS.FUNDING_RATE_CHART_SHORT }),
      value: Tab.Funding,
    },
  ].filter(isTruthy);

  return (
    <$Tabs
      value={value}
      $heightMode={
        isTablet ? HeightMode.Mobile : value === Tab.Account ? HeightMode.Short : HeightMode.Normal
      }
      onValueChange={setValue}
      items={items.map((item) => ({
        ...item,
        customTrigger: <TabButton key={item.value} label={item.label} value={item.value} />,
      }))}
      side="top"
    />
  );
};

type TabsStyleProps = { $heightMode?: HeightMode };
const TabsTypeTemp = getSimpleStyledOutputType(Tabs, {} as TabsStyleProps);

const $Tabs = styled(Tabs)<TabsStyleProps>`
  --scrollArea-height: ${({ $heightMode }) =>
    $heightMode === HeightMode.Mobile
      ? '23rem'
      : $heightMode === HeightMode.Short
        ? '19rem'
        : '27rem'};
  --stickyArea0-background: var(--color-layer-2);
  --tabContent-height: calc(var(--scrollArea-height) - 2rem - var(--tabs-currentHeight));

  min-height: 100%;

  gap: var(--border-width);

  > div > header {
    ${({ $heightMode }) => ($heightMode !== HeightMode.Mobile ? 'padding: 1rem 1.25rem;' : '')}

    > [role='tablist'] {
      margin: auto;

      gap: 0.5rem;
    }
  }
` as typeof TabsTypeTemp;

const $TabButton = styled(ToggleButton)`
  padding: 0 0.5rem;
  height: 2.25rem;

  span {
    transition: 0.25s var(--ease-out-expo);
  }
`;
const $ScrollableTableContainer = styled.div`
  ${layoutMixins.scrollArea}
  --scrollArea-height: var(--tabContent-height);
  --stickyArea0-topGap: 0px;
`;
