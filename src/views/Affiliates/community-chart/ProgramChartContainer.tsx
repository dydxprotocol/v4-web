import { useState } from 'react';

import { useOutletContext } from 'react-router-dom';
import styled from 'styled-components';

import { IProgramStats } from '@/constants/affiliates';
import { AffiliatesProgramMetric } from '@/constants/charts';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { Tabs } from '@/components/Tabs';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { ProgramHistoricalChart } from './ProgramHistoricalChart';

export const CommunityChartContainer = () => {
  const [chartMetric, setChartMetric] = useState(AffiliatesProgramMetric.ReferredVolume);
  const stringGetter = useStringGetter();
  const selectedLocale = useAppSelector(getSelectedLocale);
  const { programStats } = useOutletContext<{ programStats: IProgramStats }>();

  return (
    <div tw="flex flex-col">
      <$Tabs
        dividerStyle="underline"
        value={chartMetric}
        onValueChange={setChartMetric}
        items={[
          {
            value: AffiliatesProgramMetric.ReferredVolume,
            label: stringGetter({ key: STRING_KEYS.VOLUME_REFERRED }),
          },
          {
            value: AffiliatesProgramMetric.AffiliateEarnings,
            label: stringGetter({ key: STRING_KEYS.AFFILIATE_EARNINGS }),
          },
          {
            value: AffiliatesProgramMetric.ReferredUsers,
            label: stringGetter({ key: STRING_KEYS.USERS_REFERRED }),
          },
          {
            value: AffiliatesProgramMetric.ReferredTrades,
            label: stringGetter({ key: STRING_KEYS.TRADES_REFERRED }),
          },
        ]}
      />
      <$ChartContainer tw="bg-color-layer-3 p-2">
        <ProgramHistoricalChart
          {...{ programStats }}
          selectedChartMetric={chartMetric}
          selectedLocale={selectedLocale}
          slotEmpty={
            <div tw="grid cursor-default">
              <$EmptyCard>
                <Icon iconName={IconName.OrderPending} tw="text-[3em]" />
                {stringGetter({
                  key: STRING_KEYS.AFFILIATE_CHART_EMPTY_STATE,
                })}
              </$EmptyCard>
            </div>
          }
          tw="h-20 [--trading-rewards-line-color:--color-positive]"
        />
      </$ChartContainer>
    </div>
  );
};

const $Tabs = styled(Tabs)`
  --color-border: transparent;
  margin-bottom: 0.5rem;
` as typeof Tabs;

const $ChartContainer = styled.div`
  ${layoutMixins.contentSectionDetached}
  border-radius: 0.625rem;

  @media ${breakpoints.desktopSmall} {
    border-radius: 0;
  }
`;

const $EmptyCard = styled.div`
  width: 16.75rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: auto;
  gap: 1rem;

  font: var(--font-base-book);
  color: var(--color-text-0);
`;
