import { useEffect } from 'react';

import { AnalyticsEvents } from '@/constants/analytics';
import { DialogTypes } from '@/constants/dialogs';

import { removeLatestReferrer, updateLatestReferrer } from '@/state/affiliates';
import { getLatestReferrer } from '@/state/affiliatesSelector';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { track } from '@/lib/analytics/analytics';
import { testFlags } from '@/lib/testFlags';

import { useReferralAddress } from './useReferralAddress';
import { useReferredBy } from './useReferredBy';

export function useReferralCode() {
  const dispatch = useAppDispatch();

  const { data: referralAddress, isSuccess: isReferralAddressSuccess } = useReferralAddress(
    testFlags.referralCode
  );

  const { data: referredBy, isPending: isReferredByPending } = useReferredBy();

  const latestReferrer = useAppSelector(getLatestReferrer);

  useEffect(() => {
    if (testFlags.referralCode) {
      dispatch(openDialog(DialogTypes.Referral({ refCode: testFlags.referralCode })));
    }
  }, [dispatch]);

  useEffect(() => {
    // wait for relevant data to load
    if (!isReferralAddressSuccess || isReferredByPending) return;

    // current user already has a referrer registered
    if (referredBy?.affiliateAddress) return;

    if (referralAddress) {
      track(AnalyticsEvents.AffiliateSaveReferralAddress({ referralAddress }));
      dispatch(updateLatestReferrer(referralAddress));
    }
  }, [
    referralAddress,
    isReferralAddressSuccess,
    dispatch,
    isReferredByPending,
    referredBy?.affiliateAddress,
  ]);

  // If the current user already has a referrer registered, remove the pending referrer address
  // This handles the case of:
  // 1. User opens referral link without a wallet connected, affiliate address is saved
  // 2. User connects their wallet, and their account already has an affiliate registered
  // 3. Remove saved affiliate address
  useEffect(() => {
    if (referredBy?.affiliateAddress && latestReferrer) {
      dispatch(removeLatestReferrer());
    }
  }, [dispatch, latestReferrer, referredBy?.affiliateAddress]);
}
