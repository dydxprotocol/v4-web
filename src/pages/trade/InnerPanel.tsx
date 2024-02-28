import { useState } from 'react';

import { useSelector } from 'react-redux';

import { TradeInputField } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Tabs } from '@/components/Tabs';
import { MarketDetails } from '@/views/MarketDetails';
import { MarketLinks } from '@/views/MarketLinks';
import { DepthChart } from '@/views/charts/DepthChart';
import { FundingChart } from '@/views/charts/FundingChart';
import { TvChart } from '@/views/charts/TvChart';

import { getSelectedLocale } from '@/state/localizationSelectors';

import abacusStateManager from '@/lib/abacus';

enum Tab {
  Price = 'Price',
  Depth = 'Depth',
  Funding = 'Funding',
  Details = 'Details',
}

export const InnerPanel = () => {
  const stringGetter = useStringGetter();
  const selectedLocale = useSelector(getSelectedLocale);

  const [value, setValue] = useState(Tab.Price);

  return (
    <Tabs
      value={value}
      onValueChange={setValue}
      items={[
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
          content: <MarketDetails />,
          label: stringGetter({ key: STRING_KEYS.DETAILS }),
          value: Tab.Details,
        },
      ]}
      slotToolbar={<MarketLinks />}
      withTransitions={false}
    />
  );
};
