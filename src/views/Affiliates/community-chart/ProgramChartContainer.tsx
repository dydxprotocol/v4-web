import { useState } from 'react';

import styled from 'styled-components';

import { IProgramStats } from '@/constants/affiliates';
import { AffiliatesProgramMetric } from '@/constants/charts';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { Tabs } from '@/components/Tabs';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { ProgramHistoricalChart } from './ProgramHistoricalChart';

interface CommunityChartContainerProps {
  programStats: IProgramStats;
}

export const CommunityChartContainer = ({ programStats }: CommunityChartContainerProps) => {
  const [chartMetric, setChartMetric] = useState(AffiliatesProgramMetric.ReferredVolume);
  const stringGetter = useStringGetter();
  const selectedLocale = useAppSelector(getSelectedLocale);

  return (
    <div className="notTablet:px-1">
      <Tabs
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

      <$ChartContainer className="bg-color-layer-3 p-2">
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

const $ChartContainer = styled.div`
  ${layoutMixins.contentSectionDetached}
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
