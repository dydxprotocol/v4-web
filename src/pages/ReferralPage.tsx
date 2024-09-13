import { useEffect } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { DialogTypes } from '@/constants/dialogs';
import { DEFAULT_TRADE_ROUTE } from '@/constants/routes';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

const ReferralPage = () => {
  const dispatch = useAppDispatch();
  const { refCode } = useParams<{ refCode: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (refCode) {
      dispatch(openDialog(DialogTypes.Referral({ refCode })));
      navigate(DEFAULT_TRADE_ROUTE, { replace: true });
    }
  }, [refCode, navigate, dispatch]);

  return null;
};

export default ReferralPage;
