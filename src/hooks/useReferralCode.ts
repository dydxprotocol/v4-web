import { useEffect } from 'react';

import { DialogTypes } from '@/constants/dialogs';

import { updateLatestReferrer } from '@/state/affiliates';
import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { testFlags } from '@/lib/testFlags';

import { useReferralAddress } from './useReferralAddress';

export function useReferralCode() {
  const dispatch = useAppDispatch();

  const { data: referralAddress, isSuccess: isReferralAddressSuccess } = useReferralAddress(
    testFlags.referralCode
  );

  useEffect(() => {
    if (testFlags.referralCode) {
      dispatch(openDialog(DialogTypes.Referral({ refCode: testFlags.referralCode })));
    }
  }, [dispatch]);

  useEffect(() => {
    if (referralAddress && isReferralAddressSuccess) {
      dispatch(updateLatestReferrer(referralAddress));
    }
  }, [referralAddress, isReferralAddressSuccess, dispatch]);
}
