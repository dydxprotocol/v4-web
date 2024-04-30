import { createContext, useCallback, useContext, useEffect } from 'react';

import { useQuery } from 'react-query';

import { LOCAL_STORAGE_VERSIONS, LocalStorageKey } from '@/constants/localStorage';
import type { TransferNotifcation, TriggerOrderNotification } from '@/constants/notifications';

import { useAccounts } from '@/hooks/useAccounts';

import { fetchSquidStatus, STATUS_ERROR_GRACE_PERIOD } from '@/lib/squid';

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
const ERROR_COUNT_THRESHOLD = 3;

const useLocalNotificationsContext = () => {
  const [allTransferNotifications, setAllTransferNotifications] = useLocalStorage<{
    [key: `dydx${string}`]: TransferNotifcation[];
    version: string;
  }>({
    key: LocalStorageKey.TransferNotifications,
    defaultValue: {
      version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.TransferNotifications],
    },
  });

  const [allTriggerOrderNotifications, setAllTriggerOrderNotifications] = useLocalStorage<{
    [key: `dydx${string}`]: TriggerOrderNotification[];
    version: string;
  }>({
    key: LocalStorageKey.TriggerOrderNotifications,
    defaultValue: {
      version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.TriggerOrderNotifications],
    },
  });

  // Ensure version matches, otherwise wipe
  useEffect(() => {
    if (
      allTransferNotifications?.version !==
      LOCAL_STORAGE_VERSIONS[LocalStorageKey.TransferNotifications]
    ) {
      setAllTransferNotifications({
        version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.TransferNotifications],
      });
    }
    if (
      allTriggerOrderNotifications?.version !==
      LOCAL_STORAGE_VERSIONS[LocalStorageKey.TriggerOrderNotifications]
    ) {
      setAllTriggerOrderNotifications({
        version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.TriggerOrderNotifications],
      });
    }
  }, [allTransferNotifications, allTriggerOrderNotifications]);

  const { dydxAddress } = useAccounts();

  const transferNotifications = dydxAddress ? allTransferNotifications[dydxAddress] || [] : [];
  const triggerOrderNotifications = dydxAddress
    ? allTriggerOrderNotifications[dydxAddress] || []
    : [];

  const setTransferNotifications = useCallback(
    (notifications: TransferNotifcation[]) => {
      if (!dydxAddress) return;
      setAllTransferNotifications((currentAllNotifications) => {
        const updatedNotifications = { ...currentAllNotifications };

        updatedNotifications[dydxAddress] = [
          ...notifications,
          ...(updatedNotifications[dydxAddress] || []).slice(notifications.length),
        ];

        return updatedNotifications;
      });
    },
    [setAllTransferNotifications, dydxAddress, allTransferNotifications]
  );

  const addTransferNotification = useCallback(
    (notification: TransferNotifcation) =>
      setTransferNotifications([...transferNotifications, notification]),
    [transferNotifications]
  );

  const setTriggerOrderNotifications = useCallback(
    (notifications: TriggerOrderNotification[]) => {
      if (!dydxAddress) return;
      setAllTriggerOrderNotifications((currentAllNotifications) => {
        const updatedNotifications = { ...currentAllNotifications };

        updatedNotifications[dydxAddress] = [
          ...notifications,
          ...(updatedNotifications[dydxAddress] || []).slice(notifications.length),
        ];

        return updatedNotifications;
      });
    },
    [setAllTriggerOrderNotifications, dydxAddress, allTriggerOrderNotifications]
  );

  const addTriggerOrderNotification = useCallback(
    (notification: TriggerOrderNotification) =>
      setTriggerOrderNotifications([...triggerOrderNotifications, notification]),
    [triggerOrderNotifications]
  );

  useQuery({
    queryKey: 'getTransactionStatus',
    queryFn: async () => {
      const processTransferNotifications = async (transferNotifications: TransferNotifcation[]) => {
        const newTransferNotifications = await Promise.all(
          transferNotifications.map(async (transferNotification) => {
            const {
              txHash,
              toChainId,
              fromChainId,
              triggeredAt,
              isCctp,
              errorCount,
              status: currentStatus,
              isExchange,
              requestId,
            } = transferNotification;

            const hasErrors =
              // @ts-ignore status.errors is not in the type definition but can be returned
              // also error can some time come back as an empty object so we need to ignore for that
              !!currentStatus?.errors ||
              (currentStatus?.error && Object.keys(currentStatus.error).length !== 0);

            if (
              !isExchange &&
              !hasErrors &&
              (!currentStatus?.squidTransactionStatus ||
                currentStatus?.squidTransactionStatus === 'ongoing')
            ) {
              try {
                const status = await fetchSquidStatus(
                  {
                    transactionId: txHash,
                    toChainId,
                    fromChainId,
                  },
                  isCctp,
                  undefined,
                  requestId
                );

                if (status) {
                  transferNotification.status = status;
                }
              } catch (error) {
                if (!triggeredAt || Date.now() - triggeredAt > STATUS_ERROR_GRACE_PERIOD) {
                  if (errorCount && errorCount > ERROR_COUNT_THRESHOLD) {
                    transferNotification.status = error;
                  } else {
                    transferNotification.errorCount = errorCount ? errorCount + 1 : 1;
                  }
                }
              }
            }

            return transferNotification;
          })
        );

        return newTransferNotifications;
      };
      const newTransferNotifications = await processTransferNotifications(transferNotifications);
      setTransferNotifications(newTransferNotifications);
    },
    refetchInterval: TRANSFER_STATUS_FETCH_INTERVAL,
  });

  return {
    // Transfer notifications
    transferNotifications,
    addTransferNotification,

    // Trigger notifications
    triggerOrderNotifications,
    addTriggerOrderNotification,
  };
};
