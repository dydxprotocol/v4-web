import { createContext, useContext, useCallback, useState, useEffect } from 'react';

import _ from 'lodash';
import { shallowEqual, useSelector } from 'react-redux';

import { OrderSubmissionStatuses } from '@/constants/notifications';
import { TradeTypes } from '@/constants/trade';

import {
  getSubaccountFilledOrderClientIds,
  getSubaccountOpenOrderClientIds,
} from '@/state/accountSelectors';

import { isTruthy } from '@/lib/isTruthy';

const OrderStatusNotificationsContext = createContext<
  ReturnType<typeof useOrderStatusNotificationsContext> | undefined
>(undefined);

OrderStatusNotificationsContext.displayName = 'OrderStatusNotifications';

export const OrderStatusNotificationsProvider = ({ ...props }) => (
  <OrderStatusNotificationsContext.Provider
    value={useOrderStatusNotificationsContext()}
    {...props}
  />
);

export const useOrderStatusNotifications = () => useContext(OrderStatusNotificationsContext)!;

export type LocalOrderData = {
  marketId: string;
  clientId: number;
  orderType?: TradeTypes;
  price?: number;
  submissionStatus: OrderSubmissionStatuses;
};

const useOrderStatusNotificationsContext = () => {
  const [localOrderClientIds, setLocalOrderClientIds] = useState<number[]>([]);
  const [indexedOrderClientIds, setIndexedOrderClientIds] = useState<number[]>([]);
  const [localFilledOrderClientIds, setLocalFilledOrderClientIds] = useState<number[]>([]);
  const [failedOrderClientIds, setFailedOrderClientIds] = useState<number[]>([]);
  const [localOrdersData, setLocalOrdersData] = useState<LocalOrderData[]>([]);

  const allOpenOrderClientIds = useSelector(getSubaccountOpenOrderClientIds, shallowEqual);
  const allFilledOrderClientIds = useSelector(getSubaccountFilledOrderClientIds, shallowEqual);

  useEffect(() => {
    const indexed = _.intersection(localOrderClientIds, allOpenOrderClientIds).filter(isTruthy);
    setIndexedOrderClientIds(indexed);
  }, [allOpenOrderClientIds, localOrderClientIds]);

  useEffect(() => {
    const filled = _.intersection(indexedOrderClientIds, allFilledOrderClientIds).filter(isTruthy);
    setLocalFilledOrderClientIds(filled);
  }, [indexedOrderClientIds, allFilledOrderClientIds]);

  const storeOrder = useCallback(
    (marketId: string, clientId: number, orderType: TradeTypes, price?: number) => {
      setLocalOrderClientIds((ids) => [...ids, clientId]);
      setLocalOrdersData((ordersData) => [
        ...ordersData,
        {
          marketId,
          clientId,
          orderType,
          price,
          submissionStatus: OrderSubmissionStatuses.Submitted,
        },
      ]);
    },
    []
  );

  const orderFailed = useCallback(
    (orderClientId: number) => setFailedOrderClientIds((ids) => [...ids, orderClientId]),
    []
  );

  // update submission status
  useEffect(() => {
    setLocalOrdersData((ordersData) =>
      ordersData.map((orderData) => {
        const clientId = orderData.clientId;
        let submissionStatus = orderData.submissionStatus; // intially submitted
        if (localFilledOrderClientIds.includes(clientId)) {
          submissionStatus = OrderSubmissionStatuses.Filled;
        } else if (indexedOrderClientIds.includes(clientId)) {
          submissionStatus = OrderSubmissionStatuses.Placed;
        } else if (failedOrderClientIds.includes(clientId)) {
          submissionStatus = OrderSubmissionStatuses.Failed;
        }

        return {
          ...orderData,
          submissionStatus,
        };
      })
    );
  }, [indexedOrderClientIds, localFilledOrderClientIds, failedOrderClientIds]);

  return {
    storeOrder,
    orderFailed,
    localOrdersData,
  };
};
