import { Suspense } from 'react';

import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useAffiliatesInfo } from '@/hooks/useAffiliatesInfo';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { AffiliatesLeaderboard } from '@/views/Affiliates/AffiliatesLeaderboard';
import LastUpdated from '@/views/Affiliates/LastUpdated';
import { ShareAffiliateBanner } from '@/views/Affiliates/ShareAffiliateBanner';
import { AffiliateStatsCard } from '@/views/Affiliates/cards/AffiliateStatsCard';
import { ProgramStatusCard } from '@/views/Affiliates/cards/ProgramStatusCard';
import { AffiliatesBanner } from '@/views/AffiliatesBanner';

export const AffiliatesPage = () => {
  const { dydxAddress } = useAccounts();
  const { affiliateStatsQuery, lastUpdatedQuery, affiliateMetadataQuery } =
    useAffiliatesInfo(dydxAddress);
  const { data: lastUpdated } = lastUpdatedQuery;
  const { data: accountStats } = affiliateStatsQuery;
  const { data: affiliateMetadata, isPending: isAffiliateMetadataPending } = affiliateMetadataQuery;

  const { isNotTablet } = useBreakpoints();
  const stringGetter = useStringGetter();

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
      <$Page tw="flex flex-col gap-1">
        <$Section tw="flex flex-col gap-1 px-1 pt-1">
          {isNotTablet && lastUpdated && <LastUpdated lastUpdatedDate={new Date(lastUpdated)} />}
          <AffiliatesBanner />
          <h3 tw="px-0.5 text-color-text-2 font-large-medium">
            {stringGetter({ key: STRING_KEYS.YOUR_STATS })}
          </h3>

          <section tw="flex flex-row flex-wrap items-center justify-between gap-y-1">
            {dydxAddress && !userStatus.isAffiliate && !userStatus.isVip ? (
              <div tw="w-full notTablet:w-7/12">
                <ShareAffiliateBanner totalVolume={userStatus.totalVolume} />
              </div>
            ) : (
              <AffiliateStatsCard
                currentAffiliateTier={userStatus.currentAffiliateTier}
                isVip={userStatus.isVip}
                stakedDydx={userStatus.stakedDydx}
                tw="h-fit w-full notTablet:h-full notTablet:w-7/12"
                accountStats={accountStats}
              />
            )}

            <ProgramStatusCard
              tw="h-fit w-full notTablet:h-full notTablet:w-4/12"
              isVip={!!userStatus.isVip}
            />
          </section>
        </$Section>

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
