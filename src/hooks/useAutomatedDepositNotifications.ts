import { useEffect, useRef, useState } from 'react';

import { DialogTypes } from '@/constants/dialogs';
import { timeUnits } from '@/constants/time';

import { useAppSelector } from '@/state/appTypes';
import { getActiveDialog } from '@/state/dialogsSelectors';

import { useAccounts } from './useAccounts';
import { useDepositAddress } from './useDepositAddress';
import { DepositStatusResponse, useDepositStatus } from './useDepositStatus';

export const useAutomatedDepositNotifications = () => {
  const { dydxAddress } = useAccounts();
  const activeDialog = useAppSelector(getActiveDialog);
  const { depositAddresses } = useDepositAddress();

  const [enabled, setEnabled] = useState(false);
  const [newDeposits, setNewDeposits] = useState<DepositStatusResponse['deposits']['results']>([]);

  const { data: depositStatus } = useDepositStatus({ enabled });

  // refs to track previous values across renders
  const prevDepositIdsRef = useRef<Set<string>>(new Set());
  const sessionStartTimestampRef = useRef<number>(new Date(Date.now()).getTime());

  useEffect(() => {
    const isDepositDialogOpen = activeDialog && DialogTypes.is.Deposit2(activeDialog);
    if (!enabled && dydxAddress && depositAddresses && isDepositDialogOpen) {
      setEnabled(true);
    }
  }, [dydxAddress, depositAddresses, activeDialog, enabled]);

  // Stage 1: Watch for deposits from backend and update refs
  useEffect(() => {
    if (!dydxAddress || !depositStatus?.deposits.results || !depositAddresses) return;

    const incomingDeposits = depositStatus.deposits.results;
    const now = Date.now();
    const sessionDuration = now - sessionStartTimestampRef.current;

    const recentDeposits = incomingDeposits.filter((deposit) => {
      const depositAge = now - new Date(deposit.created_at).getTime();

      return depositAge >= 0 && depositAge <= sessionDuration;
    });

    if (recentDeposits.length === 0) return;

    const prevDepositIds = prevDepositIdsRef.current;

    const updatedDeposits = recentDeposits.filter((deposit) => !prevDepositIds.has(deposit.id));

    if (updatedDeposits.length === 0) {
      setNewDeposits([]);
      setEnabled(false);
      return;
    }

    setNewDeposits(
      updatedDeposits.toSorted(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    );
  }, [dydxAddress, depositStatus, depositAddresses, enabled]);

  // Clean up old deposit IDs every 2 minutes to prevent memory bloat, if no new deposits in queue, disable the query
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const isDepositDialogOpen = activeDialog && DialogTypes.is.Deposit2(activeDialog);
      if (newDeposits.length === 0 && !isDepositDialogOpen) {
        setEnabled(false);
      }
      const recentDeposits = depositStatus?.deposits.results.filter((deposit) => {
        // Keep IDs for deposits from the last half hour jic
        return (
          now - new Date(deposit.created_at).getTime() <= 30 * timeUnits.minute // 30 minutes
        );
      });
      prevDepositIdsRef.current = new Set(recentDeposits?.map((d) => d.id) ?? []);
    }, 5 * timeUnits.minute); // Clean up every 5 minutes

    return () => clearInterval(cleanupInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depositStatus, newDeposits]);

  return {
    newDeposits,
    setNewDeposits,
    enabled,
    setEnabled,
    prevDepositIdsRef,
  };
};
