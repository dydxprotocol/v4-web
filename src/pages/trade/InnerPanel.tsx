import { useMemo, useState } from 'react';

import { TradeInputField } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Tabs } from '@/components/Tabs';
import { CurrentMarketDetails } from '@/views/MarketDetails/CurrentMarketDetails';
import { LaunchableMarketDetails } from '@/views/MarketDetails/LaunchableMarketDetails';
import { MarketLinks } from '@/views/MarketLinks';
import { DepthChart } from '@/views/charts/DepthChart';
import { FundingChart } from '@/views/charts/FundingChart';
import { TvChart } from '@/views/charts/TradingView/TvChart';
import { TvChartLaunchable } from '@/views/charts/TradingView/TvChartLaunchable';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import abacusStateManager from '@/lib/abacus';
import { testFlags } from '@/lib/testFlags';

enum Tab {
  Price = 'Price',
  Depth = 'Depth',
  Funding = 'Funding',
  Details = 'Details',
}

export const InnerPanel = ({ launchableMarketId }: { launchableMarketId?: string }) => {
  const stringGetter = useStringGetter();
  const selectedLocale = useAppSelector(getSelectedLocale);
  const { uiRefresh } = testFlags;

  const [value, setValue] = useState(Tab.Price);

  const innerPanelItems = useMemo(() => {
    if (launchableMarketId) {
      return [
        {
          content: <TvChartLaunchable marketId={launchableMarketId} />,
          forceMount: true,
          label: stringGetter({ key: STRING_KEYS.PRICE_CHART_SHORT }),
          value: Tab.Price,
        },
        {
          content: <LaunchableMarketDetails launchableMarketId={launchableMarketId} />,
          label: stringGetter({ key: STRING_KEYS.DETAILS }),
          value: Tab.Details,
        },
      ];
    }
    return [
      {
        content: <TvChart />,
        forceMount: true,
        label: stringGetter({ key: STRING_KEYS.PRICE_CHART_SHORT }),
        value: Tab.Price,
      },
      {
        content: (
          <DepthChart
            onChartClick={({ side, price, size }) => {
              abacusStateManager.setTradeValue({ field: TradeInputField.side, value: side });
              abacusStateManager.setTradeValue({
                field: TradeInputField.limitPrice,
                value: price,
              });
              abacusStateManager.setTradeValue({
                field: TradeInputField.size,
                value: size,
              });
            }}
            stringGetter={stringGetter}
            selectedLocale={selectedLocale}
          />
        ),
        label: stringGetter({ key: STRING_KEYS.DEPTH_CHART_SHORT }),
        value: Tab.Depth,
      },
      {
        content: <FundingChart selectedLocale={selectedLocale} />,
        label: stringGetter({ key: STRING_KEYS.FUNDING_RATE_CHART_SHORT }),
        value: Tab.Funding,
      },
      {
        content: <CurrentMarketDetails />,
        label: stringGetter({ key: STRING_KEYS.DETAILS }),
        value: Tab.Details,
      },
    ];
  }, [launchableMarketId, selectedLocale, stringGetter]);

  return (
    <Tabs
      value={value}
      onValueChange={setValue}
      dividerStyle={uiRefresh ? 'underline' : 'border'}
      items={innerPanelItems}
      slotToolbar={<MarketLinks launchableMarketId={launchableMarketId} />}
      withTransitions={false}
    />
  );
};
