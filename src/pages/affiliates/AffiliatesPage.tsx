import React, { Suspense, useEffect, useState } from 'react';

import axios from 'axios';
import { Navigate, Route, Routes } from 'react-router-dom';
import styled from 'styled-components';

import { IAffiliateStats, IProgramStats } from '@/constants/affiliates';
import { STRING_KEYS } from '@/constants/localization';
import { AffiliateRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useWalletConnection } from '@/hooks/useWalletConnection';

import { layoutMixins } from '@/styles/layoutMixins';

import { AttachedExpandingSection } from '@/components/ContentSection';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { NavigationMenu } from '@/components/NavigationMenu';
import { AffiliatesLeaderboard } from '@/views/Affiliates/AffiliatesLeaderboard';
import LastUpdated from '@/views/Affiliates/LastUpdated';
import { AffiliateStatsCard } from '@/views/Affiliates/cards/AffiliateStatsCard';
import { ProgramStatsCard } from '@/views/Affiliates/cards/ProgramStatsCard';
import { ProgramStatusCard } from '@/views/Affiliates/cards/ProgramStatusCard';
import { CommunityChartContainer } from '@/views/Affiliates/community-chart/ProgramChartContainer';
import { AffiliatesBanner } from '@/views/AffiliatesBanner';

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

export const AffiliatesPage: React.FC = () => {
  const { isConnectedWagmi, dydxAddressGraz, dydxAddress, solAddress, evmAddress } =
    useWalletConnection();
  const { isNotTablet } = useBreakpoints();
  const stringGetter = useStringGetter();
  const [accountStats, setAccountStats] = useState<IAffiliateStats>();
  const [programStats, setProgramStats] = useState<IProgramStats>();
  const [currTab, setCurrTab] = useState<AffiliateRoute>(AffiliateRoute.Leaderboard);

  // Mocked user status data
  const userStatus = {
    isAffiliate: true,
    isVip: true,
    currentAffiliateTier: 2,
  };

  useEffect(() => {
    fetchAccountStats();
  }, [isConnectedWagmi]);

  useEffect(() => {
    fetchProgramStats();
  }, []);

  const fetchProgramStats = async () => {
    const res = await axios.get(`http://localhost:3000/v1/community/program-stats`);
    setProgramStats(res.data);
  };

  const fetchAccountStats = async () => {
    if (!isConnectedWagmi) {
      setAccountStats(undefined);
      return;
    }

    // Mocked backend (connected account) data
    const myData = {
      rank: 9,
      account: dydxAddressGraz ?? dydxAddress ?? solAddress ?? evmAddress ?? '',
      referredFees: 100055,
      referredVolume: 13245678,
      totalEarnings: 2000349,
      totalReferredUsers: 300,
      currentAffiliateTier: 2,
      totalReferredTrades: 400,
    };

    const res = await axios.get(
      `http://localhost:3000/v1/accounts/${dydxAddressGraz ?? dydxAddress ?? solAddress ?? evmAddress}`
    );

    // fetch account stats
    setAccountStats(res.data);

    // setAccountStats(myData);
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
        {isNotTablet && <LastUpdated lastUpdatedDate={new Date('2024-09-11T12:00:00Z')} />}
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
              <div className="w-full bg-color-accent-faded p-4 notTablet:w-7/12">
                Affiliate threshold card
              </div>
            ) : (
              <AffiliateStatsCard
                currentAffiliateTier={userStatus.currentAffiliateTier}
                isVip={userStatus.isVip}
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
