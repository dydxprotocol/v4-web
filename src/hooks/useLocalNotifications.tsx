import { createContext, useCallback, useContext, useEffect } from 'react';

import { StatSigFlags } from '@/types/statsig';
import { useQuery } from '@tanstack/react-query';

import { AnalyticsEvents } from '@/constants/analytics';
import { LOCAL_STORAGE_VERSIONS, LocalStorageKey } from '@/constants/localStorage';
import type { TransferNotifcation } from '@/constants/notifications';

import { useAccounts } from '@/hooks/useAccounts';

import { track } from '@/lib/analytics';
import {
  STATUS_ERROR_GRACE_PERIOD,
  fetchTransferStatus,
  trackSkipTx,
  trackSkipTxWithTenacity,
} from '@/lib/squid';

import { useEndpointsConfig } from './useEndpointsConfig';
import { useLocalStorage } from './useLocalStorage';
import { useStatsigGateValue } from './useStatsig';

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
  const { skip } = useEndpointsConfig();
  const useSkip = useStatsigGateValue(StatSigFlags.ffSkipMigration);

  const [allTransferNotifications, setAllTransferNotifications] = useLocalStorage<{
    [key: `dydx${string}`]: TransferNotifcation[];
    version: string;
  }>({
    key: LocalStorageKey.TransferNotifications,
    defaultValue: {
      version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.TransferNotifications],
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
  }, [allTransferNotifications]);

  const { dydxAddress } = useAccounts();

  const transferNotifications = dydxAddress ? allTransferNotifications[dydxAddress] || [] : [];

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
    (notification: TransferNotifcation) => {
      const { txHash, triggeredAt, toAmount, type, fromChainId } = notification;
      setTransferNotifications([...transferNotifications, notification]);
      trackSkipTxWithTenacity({
        transactionHash: txHash,
        chainId: fromChainId,
        baseUrl: skip,
      });
      // track initialized new transfer notification
      track(
        AnalyticsEvents.TransferNotification({
          triggeredAt,
          timeSpent: triggeredAt ? Date.now() - triggeredAt : undefined,
          txHash,
          toAmount,
          type,
          status: 'new',
        })
      );
    },
    [transferNotifications]
  );

  useQuery({
    queryKey: ['getTransactionStatus'],
    queryFn: async () => {
      const processTransferNotifications = async (
        transferNotificationsInner: TransferNotifcation[]
      ) => {
        const newTransferNotifications = await Promise.all(
          transferNotificationsInner.map(async (transferNotification) => {
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
              tracked,
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
                const skipParams = {
                  transactionHash: txHash,
                  chainId: fromChainId,
                  baseUrl: skip,
                };
                if (!tracked && useSkip) {
                  const { tx_hash: trackedTxHash } = await trackSkipTx(skipParams);
                  // if no tx hash was returned, transfer has not yet been tracked
                  if (!trackedTxHash) return transferNotification;
                  transferNotification.tracked = true;
                }
                const status = await fetchTransferStatus({
                  transactionId: txHash,
                  toChainId,
                  fromChainId,
                  isCctp,
                  requestId,
                  baseUrl: skip,
                  useSkip,
                });
                if (status) {
                  transferNotification.status = status;
                  if (status.squidTransactionStatus === 'success') {
                    track(
                      AnalyticsEvents.TransferNotification({
                        triggeredAt,
                        timeSpent: triggeredAt ? Date.now() - triggeredAt : undefined,
                        toAmount: transferNotification.toAmount,
                        status: 'success',
                        type: transferNotification.type,
                        txHash,
                      })
                    );
                  }
                }
              } catch (error) {
                if (!triggeredAt || Date.now() - triggeredAt > STATUS_ERROR_GRACE_PERIOD) {
                  if (errorCount && errorCount > ERROR_COUNT_THRESHOLD) {
                    transferNotification.status = error;
                    track(
                      AnalyticsEvents.TransferNotification({
                        triggeredAt,
                        timeSpent: triggeredAt ? Date.now() - triggeredAt : undefined,
                        toAmount: transferNotification.toAmount,
                        status: 'error',
                        type: transferNotification.type,
                        txHash,
                      })
                    );
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
      return newTransferNotifications;
    },
    refetchInterval: TRANSFER_STATUS_FETCH_INTERVAL,
  });
  return {
    // Transfer notifications
    transferNotifications,
    addTransferNotification,
  };
};
