import styled, { AnyStyledComponent } from 'styled-components';
import { shallowEqual, useSelector } from 'react-redux';

import { STRING_KEYS } from '@/constants/localization';
import { layoutMixins } from '@/styles/layoutMixins';
import { useStringGetter, useTokenConfigs } from '@/hooks';

import { AssetIcon } from '@/components/AssetIcon';
import { ComingSoon } from '@/components/ComingSoon';
import { Details } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';

import { getHistoricalTradingRewards } from '@/state/accountSelectors';

export const TradingRewardsSummaryPanel = () => {
  const stringGetter = useStringGetter();
  const historicalTradingRewards = useSelector(getHistoricalTradingRewards, shallowEqual);
  const currentWeekTradingReward = historicalTradingRewards?.get('WEEKLY')?.firstOrNull();
  const { chainTokenLabel } = useTokenConfigs();

  return (
    <Panel slotHeader={<Styled.Header>{stringGetter({ key: STRING_KEYS.TRADING_REWARDS_SUMMARY })}</Styled.Header>}>
      <Styled.Content>
        {currentWeekTradingReward ? (
          <Styled.TradingRewardsDetails
            layout="grid"
            items={[
              {
                key: 'week',
                label: (
                  <Styled.Label>
                    <h4>{stringGetter({ key: STRING_KEYS.THIS_WEEK })}</h4>
                  </Styled.Label>
                ),
                value: (
                  <Styled.Column>
                    <Output
                      slotRight={<Styled.AssetIcon symbol={chainTokenLabel} />}
                      type={OutputType.Asset}
                      value={currentWeekTradingReward.amount}
                    />
                    <Styled.TimePeriod>
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
                    </Styled.TimePeriod>
                  </Styled.Column>
                ),
              },
              // TODO(@aforaleka): add all-time when supported
            ]}
          />
        ) : (
          <ComingSoon />
        )}
      </Styled.Content>
    </Panel>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Header = styled.div`
  padding: var(--panel-paddingY) var(--panel-paddingX) 0;
  font: var(--font-medium-book);
  color: var(--color-text-2);
`;

Styled.Content = styled.div`
  ${layoutMixins.flexColumn}
  gap: 0.75rem;
`;

Styled.TradingRewardsDetails = styled(Details)`
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

Styled.Label = styled.div`
  ${layoutMixins.spacedRow}

  font: var(--font-base-book);
  color: var(--color-text-1);
`;

Styled.TimePeriod = styled.div`
  ${layoutMixins.inlineRow}

  &, output {
    color: var(--color-text-0);
    font: var(--font-small-book);
  }
`;

Styled.Column = styled.div`
  ${layoutMixins.flexColumn}
  gap: 0.33rem;
`;

Styled.AssetIcon = styled(AssetIcon)`
  margin-left: 0.5ch;
`;
