import { useEffect } from 'react';

import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Details } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';

import { getHistoricalTradingRewardsForCurrentWeek } from '@/state/accountSelectors';

import abacusStateManager from '@/lib/abacus';

export const TradingRewardsSummaryPanel = () => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();
  const currentWeekTradingReward = useSelector(
    getHistoricalTradingRewardsForCurrentWeek,
    shallowEqual
  );

  useEffect(() => {
    abacusStateManager.refreshHistoricalTradingRewards();
  }, []);

  return !currentWeekTradingReward ? null : (
    <Panel
      slotHeader={<$Header>{stringGetter({ key: STRING_KEYS.TRADING_REWARDS_SUMMARY })}</$Header>}
    >
      <$Content>
        <$TradingRewardsDetails
          layout="grid"
          items={[
            {
              key: 'week',
              label: (
                <$Label>
                  <h4>{stringGetter({ key: STRING_KEYS.THIS_WEEK })}</h4>
                </$Label>
              ),
              value: (
                <$Column>
                  <Output
                    slotRight={<$AssetIcon symbol={chainTokenLabel} />}
                    type={OutputType.Asset}
                    value={currentWeekTradingReward.amount}
                  />
                  <$TimePeriod>
                    <Output
                      type={OutputType.Date}
                      value={currentWeekTradingReward.startedAtInMilliseconds}
                      timeOptions={{ useUTC: true }}
                    />
                    →
                    <Output
                      type={OutputType.Date}
                      value={currentWeekTradingReward.endedAtInMilliseconds}
                      timeOptions={{ useUTC: true }}
                    />
                  </$TimePeriod>
                </$Column>
              ),
            },
            // TODO(@aforaleka): add all-time when supported
          ]}
        />
      </$Content>
    </Panel>
  );
};
const $Header = styled.div`
  padding: var(--panel-paddingY) var(--panel-paddingX) 0;
  font: var(--font-medium-book);
  color: var(--color-text-2);
`;

const $Content = styled.div`
  ${layoutMixins.flexColumn}
  gap: 0.75rem;
`;

const $TradingRewardsDetails = styled(Details)`
  --details-item-backgroundColor: var(--color-layer-6);

  grid-template-columns: 1fr; // TODO(@aforaleka): change to 1fr 1fr when all-time is supported
  gap: 1rem;

  > div {
    gap: 0.5rem;
    padding: 1rem;
    border-radius: 0.75em;
    background-color: var(--color-layer-5);
  }

  dt {
    width: 100%;
  }

  output {
    color: var(--color-text-2);
    font: var(--font-large-book);
  }
`;

const $Label = styled.div`
  ${layoutMixins.spacedRow}

  font: var(--font-base-book);
  color: var(--color-text-1);
`;

const $TimePeriod = styled.div`
  ${layoutMixins.inlineRow}

  &, output {
    color: var(--color-text-0);
    font: var(--font-small-book);
  }
`;

const $Column = styled.div`
  ${layoutMixins.flexColumn}
  gap: 0.33rem;
`;

const $AssetIcon = styled(AssetIcon)`
  margin-left: 0.5ch;
`;
