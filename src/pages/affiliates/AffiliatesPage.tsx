import { Suspense } from 'react';

import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { IProgramStats } from '@/constants/affiliates';
import { STRING_KEYS } from '@/constants/localization';
import { AffiliateRoute } from '@/constants/routes';

import { useAccounts } from '@/hooks/useAccounts';
import { useAffiliatesInfo } from '@/hooks/useAffiliatesInfo';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

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
import { AffiliatesBanner } from '@/views/AffiliatesBanner';

export const AffiliatesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { dydxAddress } = useAccounts();
  const { programStatsQuery, affiliateStatsQuery, lastUpdatedQuery, affiliateMetadataQuery } =
    useAffiliatesInfo(dydxAddress);
  const { data: lastUpdated } = lastUpdatedQuery;
  const { data: accountStats } = affiliateStatsQuery;
  const { data: programStats } = programStatsQuery;
  const { data: affiliateMetadata, isPending: isAffiliateMetadataPending } = affiliateMetadataQuery;

  const { isNotTablet } = useBreakpoints();
  const stringGetter = useStringGetter();

  const currentTab = location.pathname.includes(AffiliateRoute.ProgramStats)
    ? AffiliateRoute.ProgramStats
    : AffiliateRoute.Leaderboard;

  const totalVolume = affiliateMetadata?.totalVolume
    ? Math.floor(affiliateMetadata.totalVolume)
    : 0;

  const userStatus = {
    isAffiliate: Boolean(affiliateMetadata?.metadata?.isAffiliate) || totalVolume > 10_000,
    isVip: affiliateMetadata?.affiliateInfo?.isWhitelisted ?? false,
    currentAffiliateTier: affiliateMetadata?.affiliateInfo?.tier ?? undefined,
    stakedDydx: affiliateMetadata?.affiliateInfo?.stakedAmount.toString(),
    totalVolume: totalVolume.toLocaleString(),
  };

  if (dydxAddress && isAffiliateMetadataPending) {
    return <LoadingSpace id="affiliates" />;
  }

  return (
    <Suspense fallback={<LoadingSpace id="affiliates" />}>
      <$Page className="flex flex-col gap-1">
        <$Section className="flex flex-col gap-1 px-1 pt-1">
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
                      onClick: () => navigate(AffiliateRoute.Leaderboard),
                    },
                    {
                      value: AffiliateRoute.ProgramStats,
                      href: AffiliateRoute.ProgramStats,
                      label: <h3>{stringGetter({ key: STRING_KEYS.PROGRAM_STATS })}</h3>,
                      onClick: () => navigate(AffiliateRoute.ProgramStats),
                    },
                  ],
                },
              ]}
            />
          </AttachedExpandingSection>

          {currentTab === AffiliateRoute.Leaderboard && (
            <section className="flex flex-row flex-wrap items-center justify-between gap-y-1">
              {dydxAddress && !userStatus.isAffiliate && !userStatus.isVip ? (
                <div className="w-full notTablet:w-7/12">
                  <ShareAffiliateBanner totalVolume={userStatus.totalVolume} />
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
                isVip={!!userStatus.isVip}
              />
            </section>
          )}

          {currentTab === AffiliateRoute.ProgramStats && (
            <ProgramStatsCard
              className="h-fit notTablet:h-full"
              programStats={programStats as IProgramStats}
            />
          )}
        </$Section>

        <Outlet context={{ accountStats, programStats }} />

        <AffiliatesLeaderboard {...{ accountStats }} />
      </$Page>
    </Suspense>
  );
};

const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
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
