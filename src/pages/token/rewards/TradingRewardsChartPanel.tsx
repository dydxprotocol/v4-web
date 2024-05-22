import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Icon, IconName } from '@/components/Icon';
import { Panel } from '@/components/Panel';
import { TradingRewardsChart } from '@/views/charts/TradingRewardsChart';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

export const TradingRewardsChartPanel = () => {
  const stringGetter = useStringGetter();
  const selectedLocale = useAppSelector(getSelectedLocale);
  const onboardingState = useAppSelector(getOnboardingState);

  return (
    <Panel>
      <$TradingRewardsChart
        selectedLocale={selectedLocale}
        slotEmpty={
          <$EmptyChart>
            <$EmptyCard>
              {onboardingState !== OnboardingState.AccountConnected ? (
                <>
                  <p>
                    {stringGetter({
                      key: {
                        [OnboardingState.Disconnected]: STRING_KEYS.CONNECT_YOUR_WALLET_EXTENDED,
                        [OnboardingState.WalletConnected]: STRING_KEYS.MISSING_KEYS_DESCRIPTION,
                      }[onboardingState],
                    })}
                  </p>
                  <OnboardingTriggerButton />
                </>
              ) : (
                <>
                  <$EmptyIcon iconName={IconName.OrderPending} />
                  {stringGetter({
                    key: STRING_KEYS.TRADING_REWARD_CHART_EMPTY_STATE,
                  })}
                </>
              )}
            </$EmptyCard>
          </$EmptyChart>
        }
      />
    </Panel>
  );
};

const $TradingRewardsChart = styled(TradingRewardsChart)`
  --trading-rewards-line-color: var(--color-positive);
  height: 20rem;
`;

const $EmptyChart = styled.div`
  display: grid;
  cursor: default;
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

const $EmptyIcon = styled(Icon)`
  font-size: 3em;
`;
