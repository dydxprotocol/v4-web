import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useAffiliatesInfo } from '@/hooks/useAffiliatesInfo';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { AffiliatesLeaderboard } from '@/views/Affiliates/AffiliatesLeaderboard';
import { AffiliateProgressCard } from '@/views/Affiliates/cards/AffiliateProgressCard';
import { AffiliateStatsCard } from '@/views/Affiliates/cards/AffiliateStatsCard';
import { ProgramStatusCard } from '@/views/Affiliates/cards/ProgramStatusCard';
import { AffiliatesBanner } from '@/views/AffiliatesBanner';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { bytesToBigInt } from '@/lib/numbers';

export const AffiliatesPage = () => {
  const { dydxAddress } = useAccounts();
  const { affiliateStatsQuery, affiliateMetadataQuery } = useAffiliatesInfo(dydxAddress);
  const { data: accountStats } = affiliateStatsQuery;
  const { data: affiliateMetadata } = affiliateMetadataQuery;

  const stringGetter = useStringGetter();

  const userStatus = {
    isAffiliate:
      Boolean(affiliateMetadata?.metadata?.isAffiliate) ||
      (affiliateMetadata?.totalVolume && affiliateMetadata.totalVolume > 10_000),
    isVip: affiliateMetadata?.affiliateInfo?.isWhitelisted ?? false,
    currentAffiliateTier: affiliateMetadata?.affiliateInfo?.tier ?? undefined,
    stakedDydx: affiliateMetadata?.affiliateInfo?.stakedAmount
      ? bytesToBigInt(affiliateMetadata.affiliateInfo.stakedAmount)
      : undefined,
  };

  return (
    <$Page tw="flex flex-col gap-1">
      <$Section tw="flex flex-col gap-1 px-1 pt-1">
        <AffiliatesBanner />
        {!dydxAddress && <ConnectWallet />}
        {dydxAddress && (
          <>
            <h3 tw="px-0.5 text-color-text-2 font-large-medium">
              {stringGetter({ key: STRING_KEYS.YOUR_STATS })}
            </h3>

            <section tw="flex flex-row flex-wrap justify-between gap-1">
              {!affiliateMetadata ? (
                <div tw="flex min-h-4 flex-1 items-center justify-center rounded-0.625 bg-color-layer-3">
                  <LoadingSpinner />
                </div>
              ) : !userStatus.isAffiliate && !userStatus.isVip ? (
                <AffiliateProgressCard
                  tw="flex-1 bg-color-layer-3"
                  volume={affiliateMetadata.totalVolume}
                />
              ) : (
                <AffiliateStatsCard
                  currentAffiliateTier={userStatus.currentAffiliateTier}
                  isVip={userStatus.isVip}
                  stakedDydx={userStatus.stakedDydx}
                  accountStats={accountStats}
                />
              )}
              <ProgramStatusCard isVip={!!userStatus.isVip} />
            </section>
          </>
        )}
      </$Section>

      <AffiliatesLeaderboard />
    </$Page>
  );
};

const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
`;

const $Section = styled.section`
  ${layoutMixins.contentSectionDetached}
  ${layoutMixins.flexColumn}
`;

const ConnectWallet = () => {
  const stringGetter = useStringGetter();

  return (
    <div tw="h-full rounded-0.625 bg-color-layer-3">
      <div tw="flex flex-col items-center justify-center gap-y-1 px-4 py-2 text-center">
        <p>{stringGetter({ key: STRING_KEYS.AFFILIATE_CONNECT_WALLET })}</p>
        <OnboardingTriggerButton />
      </div>
    </div>
  );
};
