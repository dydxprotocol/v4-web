import { BonsaiHelpers } from '@/bonsai/ontology';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { CANCEL_ALL_ORDERS_KEY, CancelOrderStatuses, LocalCancelAllData } from '@/constants/trade';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Details } from '@/components/Details';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
// eslint-disable-next-line import/no-cycle
import { Notification, NotificationProps } from '@/components/Notification';

import { useAppSelector } from '@/state/appTypes';

import { isPresent, orEmptyObj } from '@/lib/typeUtils';

type ElementProps = {
  localCancelAll: LocalCancelAllData;
};

export const CancelAllNotification = ({
  isToast,
  localCancelAll,
  notification,
}: NotificationProps & ElementProps) => {
  const stringGetter = useStringGetter();
  const isCancelForSingleMarket = localCancelAll.filterKey !== CANCEL_ALL_ORDERS_KEY;
  const { assetId, logo: logoUrl } = orEmptyObj(
    useAppSelectorWithArgs(
      BonsaiHelpers.markets.selectMarketSummaryById,
      isCancelForSingleMarket ? localCancelAll.filterKey : undefined
    )
  );
  const localCancels = useAppSelector((s) => s.localOrders.localCancelOrders);
  const cancelStatuses = localCancelAll.cancelOrderOperationUuids
    .map((uuid) => localCancels[uuid])
    .filter(isPresent);
  const numOrders = cancelStatuses.length;
  const numCanceled = cancelStatuses.filter(
    (c) => c.submissionStatus === CancelOrderStatuses.Canceled
  ).length;
  const numFailed = cancelStatuses.filter(
    (c) => c.submissionStatus === CancelOrderStatuses.Failed
  ).length;

  // Check if all orders have been confirmed canceled or failed
  const isCancellationConfirmed = numCanceled + numFailed >= numOrders;
  const orderStatusIcon = !isCancellationConfirmed ? (
    <LoadingSpinner tw="text-color-accent [--spinner-width:0.9375rem]" />
  ) : null;

  const customContent = (
    <$Details
      items={[
        {
          key: 'orders-canceled',
          label: (
            <span tw="row gap-[0.5ch]">{stringGetter({ key: STRING_KEYS.ORDERS_CANCELED })}</span>
          ),
          value: (
            <span>
              <$Highlighted>{numCanceled}</$Highlighted> / {numOrders}
            </span>
          ),
        },
      ]}
    />
  );

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={assetId ? <AssetIcon logoUrl={logoUrl} symbol={assetId} /> : null}
      slotTitle={stringGetter({
        key: isCancelForSingleMarket
          ? STRING_KEYS.CANCELING_ALL_ORDERS_IN_MARKET
          : STRING_KEYS.CANCELING_ALL_ORDERS,
        params: { MARKET_ID: localCancelAll.filterKey },
      })}
      slotTitleRight={orderStatusIcon}
      slotCustomContent={customContent}
    />
  );
};

const $Details = styled(Details)`
  --details-item-height: 1rem;

  div {
    padding: 0.25rem 0 0;
  }
`;

const $Highlighted = styled.span`
  color: var(--color-text-2);
`;
