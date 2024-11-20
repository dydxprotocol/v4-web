import { useEffect } from 'react';

import { DialogTypes } from '@/constants/dialogs';

import { removeLatestReferrer, updateLatestReferrer } from '@/state/affiliates';
import { getLatestReferrer } from '@/state/affiliatesSelector';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { testFlags } from '@/lib/testFlags';

import { useReferralAddress } from './useReferralAddress';
import { useReferredBy } from './useReferredBy';

export function useReferralCode() {
  const dispatch = useAppDispatch();

  const { data: referralAddress, isSuccess: isReferralAddressSuccess } = useReferralAddress(
    testFlags.referralCode
  );

  const { data: referredBy, isPending: isReferredByPending } = useReferredBy();
  console.log("referredBy", referredBy, isReferredByPending)

  const latestReferrer = useAppSelector(getLatestReferrer);

  useEffect(() => {
    if (testFlags.referralCode) {
      dispatch(openDialog(DialogTypes.Referral({ refCode: testFlags.referralCode })));
    }
  }, [dispatch]);

  useEffect(() => {
    // wait for relevant data to load
    if (!isReferralAddressSuccess || isReferredByPending) {
      console.log("returning here 1");
      return;
    };

    // current user already has a referrer registered
    if (referredBy?.affiliateAddress) {
      console.log("returning here 2");
      return;
    };

    if (referralAddress) {
      console.log("latest referrer", referralAddress)
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
  useEffect(() => {
    if (referredBy?.affiliateAddress && latestReferrer) {
      dispatch(removeLatestReferrer());
    }
  }, [dispatch, latestReferrer, referredBy?.affiliateAddress]);
}
