import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Panel } from '@/components/Panel';
import { TradingRewardsChart } from '@/views/charts/TradingRewardsChart';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getOnboardingState } from '@/state/accountSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';

export const TradingRewardsChartPanel = () => {
  const stringGetter = useStringGetter();
  const selectedLocale = useSelector(getSelectedLocale);
  const onboardingState = useSelector(getOnboardingState); 

  // xcxc make sure reconnecting wallet refreshes chart data

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
                'No trading rewards'
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
  position: relative;
  height: 20rem;
`;

const $EmptyChart = styled.div`
  display: grid;
  cursor: default;
`;

const $EmptyCard = styled.div`
  width: 16.75rem;
  ${layoutMixins.column};
  font: var(--font-base-book);
  gap: 1rem;
  margin: auto;
  padding: 2rem 1rem;
  text-align: center;
`;
