import { useEffect } from 'react';

import { AffiliateRemovalReason, AnalyticsEvents } from '@/constants/analytics';
import { DialogTypes } from '@/constants/dialogs';

import { removeLatestReferrer, updateLatestReferrer } from '@/state/affiliates';
import { getLatestReferrer } from '@/state/affiliatesSelector';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { track } from '@/lib/analytics/analytics';
import { testFlags } from '@/lib/testFlags';

import { useAccounts } from './useAccounts';
import { useAffiliateMetadata } from './useAffiliatesInfo';
import { useReferralAddress } from './useReferralAddress';
import { useReferredBy } from './useReferredBy';

export function useReferralCode() {
  const dispatch = useAppDispatch();
  const { dydxAddress } = useAccounts();

  const { data: affiliateMetadata, isPending: isAffiliateMetadataPending } =
    useAffiliateMetadata(dydxAddress);

  const { data: referralAddress } = useReferralAddress(testFlags.referralCode);

  const { data: referredBy, isPending: isReferredByPending } = useReferredBy();

  const latestReferrer = useAppSelector(getLatestReferrer);

  const isOwnReferralCode = affiliateMetadata?.metadata?.referralCode === testFlags.referralCode;

  useEffect(() => {
    if (testFlags.referralCode) {
      dispatch(openDialog(DialogTypes.Referral({ refCode: testFlags.referralCode })));
    }
  }, [dispatch]);

  useEffect(() => {
    if (referralAddress) {
      track(AnalyticsEvents.AffiliateSaveReferralAddress({ affiliateAddress: referralAddress }));
      dispatch(updateLatestReferrer(referralAddress));
    }
  }, [
    referralAddress,
    dispatch,
    isReferredByPending,
    referredBy?.affiliateAddress,
    isAffiliateMetadataPending,
    isOwnReferralCode,
  ]);

  // If the current user already has a referrer registered, remove the pending referrer address
  // This handles the case of:
  // 1. User opens referral link without a wallet connected, affiliate address is saved
  // 2. User connects their wallet, and their account already has an affiliate registered or they are using their own code
  // 3. Remove saved affiliate address
  useEffect(() => {
    if (!latestReferrer) return;

    if (isOwnReferralCode) {
      track(
        AnalyticsEvents.AffiliateRemoveSavedReferralAddress({
          affiliateAddress: latestReferrer,
          reason: AffiliateRemovalReason.OwnReferralCode,
        })
      );
      dispatch(removeLatestReferrer());
    } else if (referredBy?.affiliateAddress) {
      track(
        AnalyticsEvents.AffiliateRemoveSavedReferralAddress({
          affiliateAddress: latestReferrer,
          reason: AffiliateRemovalReason.AffiliateAlreadyRegistered,
        })
      );
      dispatch(removeLatestReferrer());
    }
  }, [dispatch, latestReferrer, referredBy?.affiliateAddress, isOwnReferralCode]);
}
