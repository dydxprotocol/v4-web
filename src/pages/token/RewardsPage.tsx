import { useState } from 'react';

import { BonsaiHooks } from '@/bonsai/ontology';
import { sumBy } from 'lodash';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import tw from 'twin.macro';

import { ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useEnableBonkPnlLeaderboard } from '@/hooks/useEnableBonkPnlLeaderboard';
import { usePerpetualsComplianceState } from '@/hooks/usePerpetualsComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { BackButton } from '@/components/BackButton';
import { DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { Tabs } from '@/components/Tabs';
import { TermsOfUseLink } from '@/components/TermsOfUseLink';

import { orEmptyObj } from '@/lib/typeUtils';

import { BonkPnlPanel } from './BonkPnlPanel';
import { CompetitionIncentivesPanel } from './CompetitionIncentivesPanel';
import { CompetitionLeaderboardPanel } from './CompetitionLeaderboardPanel';
import { GeoblockedPanel } from './GeoblockedPanel';
import { LaunchIncentivesPanel } from './LaunchIncentivesPanel';
import { RewardsHelpPanel } from './RewardsHelpPanel';
import { RewardsLeaderboardPanel } from './RewardsLeaderboardPanel';
import { StakingRewardPanel } from './StakingRewardPanel';
import { SwapAndStakingPanel } from './SwapAndStakingPanel';
import { UnbondingPanels } from './UnbondingPanels';

enum Tab {
  BonkPnl = 'BonkPnl',
  Rewards = 'Rewards',
  Competition = 'Competition',
}

const RewardsPage = () => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();
  const enableBonkPnlLeaderboard = useEnableBonkPnlLeaderboard();

  const { complianceState } = usePerpetualsComplianceState();
  const { isTablet } = useBreakpoints();

  const { usdcDenom } = useTokenConfigs();

  const [value, setValue] = useState(enableBonkPnlLeaderboard ? Tab.BonkPnl : Tab.Rewards);

  const { totalRewards } = orEmptyObj(BonsaiHooks.useStakingRewards().data);

  const totalUsdcRewards = sumBy(
    (totalRewards ?? EMPTY_ARR).filter((reward) => reward.denom === usdcDenom && reward.amount),
    (a) => a.amount
  );

  const showGeoblockedPanel = complianceState !== ComplianceStates.FULL_ACCESS;
  const showStakingRewardPanel = totalUsdcRewards > 0 && !showGeoblockedPanel;

  const stakingRewardPanel = <StakingRewardPanel usdcRewards={totalUsdcRewards} />;
  const legalDisclaimer = (
    <div tw="text-color-text-0 font-mini-book">
      {stringGetter({
        key: STRING_KEYS.TRADING_REWARDS_LEGAL_DISCLAIMER,
        params: {
          TERMS_OF_USE_LINK: <TermsOfUseLink isInline />,
        },
      })}
    </div>
  );

  const tabs = [
    ...(enableBonkPnlLeaderboard
      ? [
          {
            content: (
              <div tw="flexColumn gap-1.5">
                <BonkPnlPanel />
              </div>
            ),
            label: 'Bonk PNL',
            value: Tab.BonkPnl,
          },
        ]
      : []),
    {
      content: (
        <div tw="flexColumn gap-1.5">
          <LaunchIncentivesPanel />
          <RewardsLeaderboardPanel />
        </div>
      ),
      label: stringGetter({ key: STRING_KEYS.REWARDS }),
      value: Tab.Rewards,
    },
    {
      content: (
        <div tw="flexColumn gap-1.5">
          <CompetitionIncentivesPanel />
          <CompetitionLeaderboardPanel />
        </div>
      ),
      label: stringGetter({ key: STRING_KEYS.REBATES }),
      value: Tab.Competition,
    },
  ];

  return (
    <$Page>
      {isTablet ? (
        <div>
          <ContentSectionHeader
            title={stringGetter({ key: STRING_KEYS.TRADING_REWARDS })}
            slotLeft={<BackButton onClick={() => navigate(AppRoute.Profile)} />}
          />
          <$DetachedSection>
            {showGeoblockedPanel && <GeoblockedPanel />}
            {showStakingRewardPanel && stakingRewardPanel}
            <SwapAndStakingPanel />
            <UnbondingPanels />
            <LaunchIncentivesPanel />
            <RewardsHelpPanel />
            {legalDisclaimer}
          </$DetachedSection>
        </div>
      ) : (
        <$DetachedSection>
          <div tw="flex gap-1.5">
            <$Tabs
              fullWidthTabs
              dividerStyle="underline"
              value={value}
              onValueChange={(v: Tab) => {
                setValue(v);
              }}
              tw="flex-[2]"
              items={tabs}
              withTransitions={false}
            />
            <div tw="flexColumn flex-1 gap-1.5">
              {showGeoblockedPanel && <GeoblockedPanel />}
              {showStakingRewardPanel && stakingRewardPanel}
              <SwapAndStakingPanel />
              <UnbondingPanels />
              <RewardsHelpPanel />
              {legalDisclaimer}
            </div>
          </div>
        </$DetachedSection>
      )}
    </$Page>
  );
};

export default RewardsPage;

const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
  background-color: transparent;
  border-radius: 1rem;
  overflow: hidden;
`;

const $DetachedSection = tw(
  DetachedSection
)`flex flex-col gap-1.5 p-1 max-w-7xl tablet:w-screen bg-color-layer-0 rounded-1`;

const $Tabs = styled(Tabs)`
  --trigger-backgroundColor: transparent;
  --trigger-active-underline-backgroundColor: var(--color-layer-0);
  background-color: var(--color-layer-0);
` as typeof Tabs;
