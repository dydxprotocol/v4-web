import { useMemo, useState } from 'react';

import styled from 'styled-components';

import { AFFILIATES_REQUIRED_VOLUME_USD } from '@/constants/affiliates';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useAffiliatesInfo } from '@/hooks/useAffiliatesInfo';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { Tabs } from '@/components/Tabs';
import { AffiliatesLeaderboard } from '@/views/Affiliates/AffiliatesLeaderboard';
import { AffiliateProgressCard } from '@/views/Affiliates/cards/AffiliateProgressCard';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { EditAffiliateInput } from '../../views/Affiliates/EditAffiliateInput';

enum AffiliatesTableType {
  Leaderboard = 'leaderboard',
  // MyReferrals = 'my-referrals', // TODO: My Referral Endpoint not implemented yet
}

export const AffiliatesPage = () => {
  const { dydxAddress } = useAccounts();
  const { affiliateStatsQuery, affiliateMetadataQuery } = useAffiliatesInfo(dydxAddress);
  const { data: accountStats } = affiliateStatsQuery;
  const { data: affiliateMetadata } = affiliateMetadataQuery;
  const { affiliateProgramFaq } = useURLConfigs();

  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const userStatus = affiliateMetadata?.affiliateInfo?.isWhitelisted
    ? {
        isAffiliate: true,
        currentAffiliateTier: 2,
      }
    : {
        isAffiliate:
          Boolean(affiliateMetadata?.metadata?.isAffiliate) ||
          (affiliateMetadata?.totalVolume &&
            affiliateMetadata.totalVolume > AFFILIATES_REQUIRED_VOLUME_USD),
        currentAffiliateTier: affiliateMetadata?.affiliateInfo?.tier ?? undefined,
      };

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

  const openShareDialog = () => {
    dispatch(openDialog(DialogTypes.ShareAffiliate({})));
  };

  const showAffiliateDetails = userStatus.isAffiliate;

  const myReferralStats = dydxAddress && (
    <div tw="flexColumn w-full gap-1">
      <span tw="text-color-text-1 font-base-bold">
        {stringGetter({ key: STRING_KEYS.MY_REFERRAL_STATS })}
      </span>

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

  const affiliateTitleSection = (
    <div tw="row justify-between gap-0.5">
      <div tw="flexColumn gap-0.5">
        <span tw="row gap-0.5 text-color-text-2 font-medium-bold">
          <Icon tw="size-1.5" iconName={IconName.Users} />
          {stringGetter({ key: STRING_KEYS.AFFILIATES_PROGRAM })}
        </span>
        <div tw="flexColumn font-small-book">
          <span tw="text-color-text-0">
            {stringGetter({ key: STRING_KEYS.AFFILIATES_PROGRAM_DESCRIPTION })}{' '}
          </span>

          <Link isInline isAccent href={affiliateProgramFaq}>
            {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
          </Link>
        </div>
      </div>

      {showAffiliateDetails && (
        <EditAffiliateInput
          tw="w-1/2"
          slotRight={
            <Button onClick={openShareDialog}>{stringGetter({ key: STRING_KEYS.SHARE })}</Button>
          }
          withAlertMessage={false}
        />
      )}
    </div>
  );

  const affiliateStatsSection = (
    <>
      {affiliateTitleSection}
      {dydxAddress ? (
        affiliateMetadata == null ? (
          <div tw="flex min-h-4 flex-1 items-center justify-center rounded-0.625 bg-color-layer-3">
            <LoadingSpinner />
          </div>
        ) : !userStatus.isAffiliate ? (
          <AffiliateProgressCard
            tw="flex-1 bg-color-layer-3"
            volume={affiliateMetadata.totalVolume}
          />
        ) : (
          myReferralStats
        )
      ) : (
        <AffiliateEmptyState toggleCriteria={toggleCriteria} />
      )}
    </>
  );

  const [tableType, setTableType] = useState(AffiliatesTableType.Leaderboard);
  const tabItems = useMemo(() => {
    return [
      {
        label: stringGetter({ key: STRING_KEYS.AFFILIATES_LEADERBOARD }),
        value: AffiliatesTableType.Leaderboard,
        content: (
          <$TableContainer>
            <AffiliatesLeaderboard />
          </$TableContainer>
        ),
      },
    ];
  }, [stringGetter]);

  const tableTabs = (
    <Tabs
      tw="gap-1"
      dividerStyle="underline"
      value={tableType}
      onValueChange={setTableType}
      items={tabItems}
      withTransitions={false}
    />
  );

  return (
    <$Page tw="flex flex-col gap-1">
      <$Section tw="flex flex-col gap-1 px-1 pt-1">
        {affiliateStatsSection}
        {tableTabs}
      </$Section>
    </$Page>
  );
};

const $TableContainer = styled.div`
  ${layoutMixins.contentContainer}
  ${layoutMixins.stickyArea3}
  padding: var(--border-width);
`;

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

const AffiliateEmptyState = ({ toggleCriteria }: { toggleCriteria: () => void }) => {
  const stringGetter = useStringGetter();

  return (
    <div tw="h-full rounded-0.625 bg-color-layer-3">
      <div tw="flex flex-col items-center justify-center gap-y-1 px-4 py-2 text-center">
        <span>
          {stringGetter({ key: STRING_KEYS.AFFILIATE_CONNECT_WALLET })}{' '}
          <Link
            isInline
            href="#"
            isAccent
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCriteria();
            }}
          >
            {stringGetter({ key: STRING_KEYS.AFFILIATE_TIERS_CRITERIA })} →
          </Link>
        </span>
        <OnboardingTriggerButton />
      </div>
    </div>
  );
};
