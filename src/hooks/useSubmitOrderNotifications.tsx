import { createContext, useContext, useCallback, useState, useEffect } from 'react';

import _ from 'lodash';
import { shallowEqual, useSelector } from 'react-redux';

import { SubmitOrderStatuses } from '@/constants/notifications';
import { TradeTypes } from '@/constants/trade';

import {
  getSubaccountFilledOrderClientIds,
  getSubaccountOpenOrderClientIds,
} from '@/state/accountSelectors';

import { isTruthy } from '@/lib/isTruthy';

const SubmitOrderNotificationsContext = createContext<
  ReturnType<typeof useSubmitOrderNotificationsContext> | undefined
>(undefined);

SubmitOrderNotificationsContext.displayName = 'SubmitOrderNotifications';

export const SubmitOrderNotificationsProvider = ({ ...props }) => (
  <SubmitOrderNotificationsContext.Provider
    value={useSubmitOrderNotificationsContext()}
    {...props}
  />
);

export const useSubmitOrderNotifications = () => useContext(SubmitOrderNotificationsContext)!;

export type LocalOrderData = {
  marketId: string;
  clientId: number;
  orderType?: TradeTypes;
  price?: number;
  tickSizeDecimals?: number;
  submissionStatus?: SubmitOrderStatuses;
};

const useSubmitOrderNotificationsContext = () => {
  const [submittedOrderClientIds, setSubmittedOrderClientIds] = useState<number[]>([]);
  const [indexedOrderClientIds, setIndexedOrderClientIds] = useState<number[]>([]);
  const [localFilledOrderClientIds, setLocalFilledOrderClientIds] = useState<number[]>([]);
  const [failedOrderClientIds, setFailedOrderClientIds] = useState<number[]>([]);
  const [localOrdersData, setLocalOrdersData] = useState<LocalOrderData[]>([]);

  const openOrderClientIds = useSelector(getSubaccountOpenOrderClientIds, shallowEqual);
  const filledOrderClientIds = useSelector(getSubaccountFilledOrderClientIds, shallowEqual);

  useEffect(() => {
    const indexed = _.intersection(submittedOrderClientIds, openOrderClientIds).filter(isTruthy);
    setIndexedOrderClientIds(indexed);
  }, [openOrderClientIds, submittedOrderClientIds]);

  useEffect(() => {
    const filled = _.intersection(indexedOrderClientIds, filledOrderClientIds).filter(isTruthy);
    setLocalFilledOrderClientIds(filled);
  }, [indexedOrderClientIds, filledOrderClientIds]);

  const storeOrder = useCallback(
    ({
      marketId,
      clientId,
      orderType,
      price,
      tickSizeDecimals,
      submissionStatus = SubmitOrderStatuses.Submitted,
    }: LocalOrderData) => {
      setSubmittedOrderClientIds((ids) => [...ids, clientId]);
      setLocalOrdersData((ordersData) => [
        ...ordersData,
        {
          marketId,
          clientId,
          orderType,
          price,
          tickSizeDecimals,
          submissionStatus,
        },
      ]);
    },
    [submittedOrderClientIds]
  );

  const orderFailed = useCallback(
    (orderClientId: number) => setFailedOrderClientIds((ids) => [...ids, orderClientId]),
    [failedOrderClientIds]
  );

  // update submission status
  useEffect(() => {
    setLocalOrdersData((ordersData) =>
      ordersData.map((orderData) => {
        const clientId = orderData.clientId;
        let submissionStatus = orderData.submissionStatus; // intially submitted
        if (localFilledOrderClientIds.includes(clientId)) {
          submissionStatus = SubmitOrderStatuses.Filled;
        } else if (indexedOrderClientIds.includes(clientId)) {
          submissionStatus = SubmitOrderStatuses.Placed;
        } else if (failedOrderClientIds.includes(clientId)) {
          submissionStatus = SubmitOrderStatuses.Failed;
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
    submittedOrderClientIds,
    orderFailed,
    localOrdersData,
  };
};
