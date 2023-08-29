import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';

import { LocalStorageKey } from '@/constants/localStorage';
import {
  type TransferNotifcation,
} from '@/constants/notifications';

import { useAccounts } from '@/hooks/useAccounts';
import { useSquid } from '@/hooks/useSquid';
import { useLocalStorage } from './useLocalStorage';

import { StatusResponse } from '@0xsquid/sdk';

export const useLocalNotifications = () => {

  // transfer notifications
  const [allTransferNotifications, setAllTransferNotifications] = useLocalStorage<{[key: `dydx${string}`]: TransferNotifcation[]}>({
    key: LocalStorageKey.TransferNotifications,
    defaultValue: {},
  });

  const { dydxAddress } = useAccounts();

  const transferNotifications = useMemo(() => {
    if (!dydxAddress) return [];
    console.log({allTransferNotifications, transferNotifications: allTransferNotifications[dydxAddress]})
    return allTransferNotifications[dydxAddress] || [];
  }, [allTransferNotifications, dydxAddress]);


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
        if (currentStatus && currentStatus?.squidTransactionStatus !== 'ongoing') continue;

        const status = await squid?.getStatus({ transactionId: txHash, toChainId, fromChainId });
        if (status) statuses[txHash] = status;
      }
      return statuses;
    },
    refetchInterval: 10_000,
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
