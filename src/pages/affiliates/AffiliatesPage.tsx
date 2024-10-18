import React, { Suspense, useEffect, useState } from 'react';

import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { IAffiliateStats, IProgramStats } from '@/constants/affiliates';
import { STRING_KEYS } from '@/constants/localization';
import { AffiliateRoute } from '@/constants/routes';

import { useAccounts } from '@/hooks/useAccounts';
import { useAffiliatesInfo } from '@/hooks/useAffiliatesInfo';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useWalletConnection } from '@/hooks/useWalletConnection';

import { layoutMixins } from '@/styles/layoutMixins';

import { AttachedExpandingSection } from '@/components/ContentSection';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { NavigationMenu } from '@/components/NavigationMenu';
import { AffiliatesLeaderboard } from '@/views/Affiliates/AffiliatesLeaderboard';
import LastUpdated from '@/views/Affiliates/LastUpdated';
import { ShareAffiliateBanner } from '@/views/Affiliates/ShareAffiliateBanner';
import { AffiliateStatsCard } from '@/views/Affiliates/cards/AffiliateStatsCard';
import { ProgramStatsCard } from '@/views/Affiliates/cards/ProgramStatsCard';
import { ProgramStatusCard } from '@/views/Affiliates/cards/ProgramStatusCard';
import { CommunityChartContainer } from '@/views/Affiliates/community-chart/ProgramChartContainer';
import { AffiliatesBanner } from '@/views/AffiliatesBanner';

export const AffiliatesPage: React.FC = () => {
  const { isConnectedWagmi } = useWalletConnection();
  const { dydxAddress } = useAccounts();
  const { programStatsQuery, affiliateStatsQuery, lastUpdatedQuery, affiliateMetadataQuery } =
    useAffiliatesInfo(dydxAddress);
  const { data: lastUpdated } = lastUpdatedQuery;
  const { data: accountStats } = affiliateStatsQuery;
  const { data: programStats } = programStatsQuery;
  const { data: affiliateMetadata } = affiliateMetadataQuery;

  const location = useLocation();
  const { isNotTablet } = useBreakpoints();
  const stringGetter = useStringGetter();
  const [currTab, setCurrTab] = useState<AffiliateRoute>(AffiliateRoute.Leaderboard);

  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath.includes(AffiliateRoute.ProgramStats)) {
      setCurrTab(AffiliateRoute.ProgramStats);
    }
  }, []);

  const userStatus = {
    isAffiliate: affiliateMetadata?.metadata?.isAffiliate ?? false,
    isVip: affiliateMetadata?.affiliateInfo?.isWhitelisted ?? false,
    currentAffiliateTier: affiliateMetadata?.affiliateInfo?.tier ?? undefined,
    stakedDydx: affiliateMetadata?.affiliateInfo?.stakedAmount.toString(),
  };

  const routesComponent = (
    <Suspense fallback={<LoadingSpace id="affiliates" />}>
      <Routes>
        <Route index path="*" element={<Navigate to={AffiliateRoute.Leaderboard} />} />
        <Route path={AffiliateRoute.Leaderboard} />
        <Route path={AffiliateRoute.ProgramStats} />
      </Routes>
    </Suspense>
  );

  return (
    <$Page>
      <$Section className="p-1">
        {isNotTablet && lastUpdated && <LastUpdated lastUpdatedDate={new Date(lastUpdated)} />}
        <AffiliatesBanner />

        <AttachedExpandingSection>
          <$NavigationMenu
            orientation="horizontal"
            items={[
              {
                group: 'navigation',
                items: [
                  {
                    value: AffiliateRoute.Leaderboard,
                    href: AffiliateRoute.Leaderboard,
                    label: <h3>{stringGetter({ key: STRING_KEYS.YOUR_STATS })}</h3>,
                    onClick: () => setCurrTab(AffiliateRoute.Leaderboard),
                  },
                  {
                    value: AffiliateRoute.ProgramStats,
                    href: AffiliateRoute.ProgramStats,
                    label: <h3>{stringGetter({ key: STRING_KEYS.PROGRAM_STATS })}</h3>,
                    onClick: () => setCurrTab(AffiliateRoute.ProgramStats),
                  },
                ],
              },
            ]}
          />
        </AttachedExpandingSection>

        {currTab === AffiliateRoute.Leaderboard && (
          <section className="mt-0.5 flex flex-row flex-wrap items-center justify-between gap-y-1">
            {isConnectedWagmi && !userStatus.isAffiliate && !userStatus.isVip ? (
              <div className="w-full notTablet:w-7/12">
                <ShareAffiliateBanner accountStats={accountStats as IAffiliateStats} />
              </div>
            ) : (
              <AffiliateStatsCard
                currentAffiliateTier={userStatus.currentAffiliateTier}
                isVip={userStatus.isVip}
                stakedDydx={userStatus.stakedDydx}
                className="h-fit w-full notTablet:h-full notTablet:w-7/12"
                accountStats={accountStats}
              />
            )}

            <ProgramStatusCard
              className="h-fit w-full notTablet:h-full notTablet:w-4/12"
              isWalletConnected={isConnectedWagmi}
              isVip={!!userStatus.isVip}
            />
          </section>
        )}

        {currTab === AffiliateRoute.ProgramStats && (
          <ProgramStatsCard
            className="mt-0.5 h-fit notTablet:h-full"
            programStats={programStats as IProgramStats}
          />
        )}
      </$Section>

      {currTab === AffiliateRoute.Leaderboard ? (
        <$AffiliatesLeaderboard accountStats={accountStats} />
      ) : (
        <$CommunityChart />
      )}
      {routesComponent}
    </$Page>
  );
};

const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
  background-image: url('/wave.svg');
  background-size: cover;
`;

const $AffiliatesLeaderboard = styled(AffiliatesLeaderboard)`
  ${layoutMixins.contentSectionAttached}
`;

const $CommunityChart = styled(CommunityChartContainer)`
  ${layoutMixins.contentSectionAttached}
`;

const $Section = styled.section`
  ${layoutMixins.contentSectionDetached}
  ${layoutMixins.flexColumn}
`;

const $NavigationMenu = styled(NavigationMenu)`
  --navigationMenu-item-checked-backgroundColor: var(--color-layer-1);
  --navigationMenu-item-checked-textColor: var(--color-text-2);

  h3 {
    font-size: 1.25em;
  }
`;
