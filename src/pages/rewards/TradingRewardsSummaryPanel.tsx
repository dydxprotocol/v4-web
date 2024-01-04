import styled, { AnyStyledComponent } from 'styled-components';
import { shallowEqual, useSelector } from 'react-redux';

import { STRING_KEYS } from '@/constants/localization';
import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';
import { useStringGetter, useTokenConfigs } from '@/hooks';

import { AssetIcon } from '@/components/AssetIcon';
import { Details } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';

import { getHistoricalTradingRewards } from '@/state/accountSelectors';
import { HistoricalTradingReward } from '@/constants/abacus';

export const TradingRewardsSummaryPanel = () => {
  const stringGetter = useStringGetter();
  const historicalTradingRewards = useSelector(getHistoricalTradingRewards, shallowEqual);
  const currentWeekTradingReward = historicalTradingRewards?.get('WEEKLY')?.firstOrNull();
  const { chainTokenLabel } = useTokenConfigs();

  return (
    <Styled.Panel
      slotHeader={
        <Styled.Header>
          <Styled.Title>Trading Rewards Summary</Styled.Title>
        </Styled.Header>
      }
    >
      <Styled.Content>
        <Styled.ComingSoon>{stringGetter({ key: STRING_KEYS.COMING_SOON })}</Styled.ComingSoon>
        {
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
                      slotRight={<AssetIcon symbol={chainTokenLabel} />}
                      type={OutputType.Asset}
                      value={currentWeekTradingReward?.amount}
                    />
                    <Styled.TimePeriod>
                      <Output
                        type={OutputType.Date}
                        value={1701388800000} // {currentWeekTradingReward?.startedAtInMilliseconds}
                        timeOptions={{ useUTC: true }}
                      />
                      →
                      <Output
                        type={OutputType.Date}
                        value={1704067199000} // {currentWeekTradingReward?.endedAtInMilliseconds}
                        timeOptions={{ useUTC: true }}
                      />
                    </Styled.TimePeriod>
                  </Styled.Column>
                ),
              },
              // TODO(@aforaleka): add all-time when supported
            ]}
          />
        }
      </Styled.Content>
    </Styled.Panel>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Panel = styled(Panel)`
  --panel-paddingX: 1.5rem;
  --panel-paddingY: 1.25rem;

  @media ${breakpoints.tablet} {
    --panel-paddingY: 1.5rem;
  }
`;

Styled.Header = styled.div`
  ${layoutMixins.spacedRow}
  gap: 1rem;
  padding: var(--panel-paddingY) var(--panel-paddingX) 0;
`;

Styled.Title = styled.h3`
  ${layoutMixins.inlineRow}
  font: var(--font-medium-book);
  color: var(--color-text-2);

  img {
    font-size: 1.5rem;
  }
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
    gap: 1rem;

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

Styled.ComingSoon = styled.div`
  color: var(--color-text-0);
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
  gap: 0.5rem;
`;
