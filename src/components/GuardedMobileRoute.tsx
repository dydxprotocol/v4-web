import { useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import { DialogTypes } from '@/constants/dialogs';

import { useBreakpoints } from '@/hooks';

import { openDialog } from '@/state/dialogs';

import { getActiveDialog } from '@/state/dialogsSelectors';

import { calculateCanAccountTrade } from '@/state/accountCalculators';

export const GuardedMobileRoute = () => {
  const { isTablet } = useBreakpoints();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const canAccountTrade = useSelector(calculateCanAccountTrade, shallowEqual);
  const activeDialog = useSelector(getActiveDialog, shallowEqual);
  const prevActiveDialog = useRef(activeDialog?.type);

  useEffect(() => {
    if (isTablet && !canAccountTrade) {
      dispatch(openDialog({ type: DialogTypes.Onboarding }));
    }
  }, []);

  useEffect(() => {
    const dialogClosed = !activeDialog && prevActiveDialog.current === DialogTypes.Onboarding;
    if (isTablet && !canAccountTrade && dialogClosed) {
      navigate('/');
    }
    prevActiveDialog.current = activeDialog?.type;
  }, [activeDialog, canAccountTrade, isTablet]);

  return <Outlet />;
};
