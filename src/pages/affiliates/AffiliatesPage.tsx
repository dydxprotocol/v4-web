import styled from 'styled-components';

import { AFFILIATES_REQUIRED_VOLUME_USD } from '@/constants/affiliates';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useAffiliatesInfo } from '@/hooks/useAffiliatesInfo';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Link } from '@/components/Link';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { AffiliatesLeaderboard } from '@/views/Affiliates/AffiliatesLeaderboard';
import { AffiliateProgressCard } from '@/views/Affiliates/cards/AffiliateProgressCard';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

export const AffiliatesPage = () => {
  const { dydxAddress } = useAccounts();
  const { affiliateStatsQuery, affiliateMetadataQuery } = useAffiliatesInfo(dydxAddress);
  const { data: accountStats } = affiliateStatsQuery;
  const { data: affiliateMetadata } = affiliateMetadataQuery;

  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const toggleCriteria = () => {
    dispatch(
      openDialog(
        DialogTypes.Criteria({
          userTier: userStatus.currentAffiliateTier,
          accountStats,
        })
      )
    );
  };

  const userStatus = {
    isAffiliate:
      Boolean(affiliateMetadata?.metadata?.isAffiliate) ||
      (affiliateMetadata?.totalVolume &&
        affiliateMetadata.totalVolume > AFFILIATES_REQUIRED_VOLUME_USD),
    isVip: affiliateMetadata?.affiliateInfo?.isWhitelisted ?? false,
    currentAffiliateTier: affiliateMetadata?.affiliateInfo?.tier ?? undefined,
  };

  const myReferralStats = dydxAddress && (
    <div tw="flexColumn w-full gap-1">
      <span tw="text-color-text-1 font-base-bold">My Referral Stats</span>

      <div tw="row flex-1 gap-0.75">
        <$StatBox>
          <Output type={OutputType.Number} value={userStatus.currentAffiliateTier} />
          <div tw="row justify-between gap-0.5">
            <$StatLabel>{stringGetter({ key: STRING_KEYS.TIER })}</$StatLabel>
            <Link
              isInline
              href="#"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCriteria();
              }}
            >
              <p tw="text-color-accent font-small-medium">
                {stringGetter({ key: STRING_KEYS.AFFILIATE_TIERS_CRITERIA })} →
              </p>
            </Link>
          </div>
        </$StatBox>
        <$StatBox>
          <Output type={OutputType.Number} value={accountStats?.affiliateReferredUsers} />
          <$StatLabel>{stringGetter({ key: STRING_KEYS.USERS_REFERRED })}</$StatLabel>
        </$StatBox>
        <$StatBox>
          <Output
            type={OutputType.CompactFiat}
            value={accountStats?.affiliateReferredTotalVolume}
          />
          <$StatLabel>{stringGetter({ key: STRING_KEYS.VOLUME_REFERRED })}</$StatLabel>
        </$StatBox>
        <$StatBox>
          <Output type={OutputType.CompactFiat} value={accountStats?.affiliateTotalReferredFees} />
          <$StatLabel>{stringGetter({ key: STRING_KEYS.FEES_REFERRED })}</$StatLabel>
        </$StatBox>
        <$StatBox>
          <Output type={OutputType.Number} value={accountStats?.affiliateEarnings} />
          <$StatLabel>{stringGetter({ key: STRING_KEYS.AFFILIATE_EARNINGS })}</$StatLabel>
        </$StatBox>
      </div>
    </div>
  );

  const newAffiliatesPage = (
    <>
      <div tw="flexColumn gap-0.5">
        <span tw="text-color-text-2 font-base-bold">
          {stringGetter({ key: STRING_KEYS.AFFILIATES_PROGRAM })}
        </span>
        <div tw="flexColumn font-small-book">
          <span tw="text-color-text-0">
            {stringGetter({ key: STRING_KEYS.AFFILIATES_PROGRAM_DESCRIPTION })}{' '}
          </span>

          <Link isInline isAccent>
            {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
          </Link>
        </div>
      </div>
      {!dydxAddress && <ConnectWallet />}
      {affiliateMetadata == null ? (
        <div tw="flex min-h-4 flex-1 items-center justify-center rounded-0.625 bg-color-layer-3">
          <LoadingSpinner />
        </div>
      ) : !userStatus.isAffiliate && !userStatus.isVip ? (
        <AffiliateProgressCard
          tw="flex-1 bg-color-layer-3"
          volume={affiliateMetadata.totalVolume}
        />
      ) : (
        myReferralStats
      )}
    </>
  );

  return (
    <$Page tw="flex flex-col gap-1">
      <$Section tw="flex flex-col gap-1 px-1 pt-1">{newAffiliatesPage}</$Section>

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

const $StatBox = styled.div`
  ${layoutMixins.flexColumn}
  flex: 1;
  border: var(--default-border-width) solid var(--color-layer-4);
  padding: 1rem;
  gap: 0.25rem;
  border-radius: 0.75rem;

  output {
    font: var(--font-large-bold);
  }
`;

const $StatLabel = styled.span`
  color: var(--color-text-0);
  font: var(--font-base-medium);
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
