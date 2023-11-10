import { createContext, useContext, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import type { StatusResponse } from '@0xsquid/sdk';

import { LocalStorageKey } from '@/constants/localStorage';
import { type TransferNotifcation } from '@/constants/notifications';

import { useAccounts } from '@/hooks/useAccounts';
import { STATUS_ERROR_GRACE_PERIOD, useSquid } from '@/hooks/useSquid';
import { useLocalStorage } from './useLocalStorage';

const LocalNotificationsContext = createContext<
  ReturnType<typeof useLocalNotificationsContext> | undefined
>(undefined);

LocalNotificationsContext.displayName = 'LocalNotifications';

export const LocalNotificationsProvider = ({ ...props }) => (
  <LocalNotificationsContext.Provider value={useLocalNotificationsContext()} {...props} />
);

export const useLocalNotifications = () => useContext(LocalNotificationsContext)!;

const TRANSFER_STATUS_FETCH_INTERVAL = 10_000;

const useLocalNotificationsContext = () => {
  // transfer notifications
  const [allTransferNotifications, setAllTransferNotifications] = useLocalStorage<{
    [key: `dydx${string}`]: TransferNotifcation[];
  }>({
    key: LocalStorageKey.TransferNotifications,
    defaultValue: {},
  });

  const { dydxAddress } = useAccounts();

  const transferNotifications = dydxAddress ? allTransferNotifications[dydxAddress] || [] : [];

  const setTransferNotifications = useCallback(
    (notifications: TransferNotifcation[]) => {
      if (!dydxAddress) return;
      const updatedNotifications = { ...allTransferNotifications };
      updatedNotifications[dydxAddress] = notifications;
      setAllTransferNotifications(updatedNotifications);
    },
    [setAllTransferNotifications, dydxAddress]
  );

  const addTransferNotification = useCallback(
    (notification: TransferNotifcation) =>
      setTransferNotifications([...transferNotifications, notification]),
    [transferNotifications]
  );

  const squid = useSquid();

  const { data: transferStatuses } = useQuery({
    queryKey: ['getTransactionStatus', transferNotifications],
    queryFn: async () => {
      const statuses: { [key: string]: StatusResponse } = {};
      for (const {
        txHash,
        toChainId,
        fromChainId,
        triggeredAt,
        status: currentStatus,
      } of transferNotifications) {
        try {
          // skip if error is returned or if the transaction is not ongoing
          if (
            // @ts-ignore status.errors is not in the type definition but can be returned
            currentStatus?.errors ||
            currentStatus?.error ||
            (currentStatus?.squidTransactionStatus &&
              currentStatus?.squidTransactionStatus !== 'ongoing')
          ) {
            continue;
          }

          const status = await squid?.getStatus({ transactionId: txHash, toChainId, fromChainId });
          if (status) statuses[txHash] = status;
        } catch (error) {
          // ignore errors for the first 120s since the status might not be available yet
          if (!triggeredAt || Date.now() - triggeredAt > STATUS_ERROR_GRACE_PERIOD) {
            statuses[txHash] = error;
          }
        }
      }
      return statuses;
    },
    refetchInterval: TRANSFER_STATUS_FETCH_INTERVAL,
  });

  useEffect(() => {
    if (!transferStatuses) return;
    const newTransferNotifications = transferNotifications.map((notification) => {
      const status = transferStatuses[notification.txHash];
      if (!status) return notification;
      return {
        ...notification,
        status,
      };
    });
    setTransferNotifications(newTransferNotifications);
  }, [transferStatuses]);

  return {
    transferNotifications,
    addTransferNotification,
  };
};
