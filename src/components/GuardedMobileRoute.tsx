import { useEffect, useRef } from 'react';

import { shallowEqual } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';

import { DialogTypes } from '@/constants/dialogs';

import { useBreakpoints } from '@/hooks/useBreakpoints';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { getActiveDialog } from '@/state/dialogsSelectors';

export const GuardedMobileRoute = () => {
  const { isTablet } = useBreakpoints();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const canAccountTrade = useAppSelector(calculateCanAccountTrade, shallowEqual);
  const activeDialog = useAppSelector(getActiveDialog, shallowEqual);
  const prevActiveDialog = useRef(activeDialog?.tag);

  useEffect(() => {
    if (isTablet && !canAccountTrade) {
      dispatch(openDialog(DialogTypes.Onboarding()));
    }
  }, []);

  useEffect(() => {
    const dialogClosed = !activeDialog && prevActiveDialog.current === 'Onboarding';
    if (isTablet && !canAccountTrade && dialogClosed) {
      navigate('/');
    }
    prevActiveDialog.current = activeDialog?.tag;
  }, [activeDialog, canAccountTrade, isTablet]);

  return <Outlet />;
};
