import { createContext, useContext, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import type { StatusResponse } from '@0xsquid/sdk';

import { LocalStorageKey } from '@/constants/localStorage';
import { type TransferNotifcation } from '@/constants/notifications';

import { useAccounts } from '@/hooks/useAccounts';
import { SQUID_ERROR_TYPES, useSquid } from '@/hooks/useSquid';
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
        status: currentStatus,
      } of transferNotifications) {
        try {
          if (currentStatus && currentStatus?.squidTransactionStatus !== 'ongoing') continue;

          const status = await squid?.getStatus({ transactionId: txHash, toChainId, fromChainId });
          if (status) statuses[txHash] = status;
        } catch (error) {
          // ignore not found errors since the route might not be available yet
          if (error?.errors?.length && error.errors[0].errorType !== SQUID_ERROR_TYPES.NotFoundError) {
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
