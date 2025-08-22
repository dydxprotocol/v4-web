import { useMemo, useState } from 'react';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Tabs } from '@/components/Tabs';
import { CurrentMarketDetails } from '@/views/MarketDetails/CurrentMarketDetails';
import { LaunchableMarketDetails } from '@/views/MarketDetails/LaunchableMarketDetails';
import { MarketLinks } from '@/views/MarketLinks';
/* import { DepthChart } from '@/views/charts/DepthChart'; */
import { FundingChart } from '@/views/charts/FundingChart';
import { TvChart } from '@/views/charts/TradingView/TvChart';
import { TvChartLaunchable } from '@/views/charts/TradingView/TvChartLaunchable';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';
/* import { tradeFormActions } from '@/state/tradeForm'; */

/* import { MustBigNumber } from '@/lib/numbers'; */

enum Tab {
  Price = 'Price',
    /* NOTE: disabled for proof-of-concept */
    /* Depth = 'Depth', */
  Funding = 'Funding',
  Details = 'Details',
}

export const InnerPanel = ({ launchableMarketId }: { launchableMarketId?: string }) => {
  const stringGetter = useStringGetter();
  const selectedLocale = useAppSelector(getSelectedLocale);
  const dispatch = useAppDispatch();

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
        /* {
  *   content: (
  *     <DepthChart
  *       onChartClick={({ side, price, size }) => {
  *         dispatch(tradeFormActions.setLimitPrice(MustBigNumber(price).toString(10)));
  *         dispatch(tradeFormActions.setSide(side));
  *         dispatch(tradeFormActions.setSizeToken(MustBigNumber(size).toString(10)));
  *       }}
  *       stringGetter={stringGetter}
  *       selectedLocale={selectedLocale}
  *     />
  *   ),
  *   label: stringGetter({ key: STRING_KEYS.DEPTH_CHART_SHORT }),
  *   value: Tab.Depth,
  * }, */
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
  }, [
      /* dispatch, */
    launchableMarketId,
    selectedLocale,
    stringGetter
  ]);

  return (
    <Tabs
      value={value}
      onValueChange={setValue}
      dividerStyle="underline"
      items={innerPanelItems}
      slotToolbar={<MarketLinks launchableMarketId={launchableMarketId} />}
      withTransitions={false}
    />
  );
};
