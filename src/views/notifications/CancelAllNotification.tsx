import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { CANCEL_ALL_ORDERS_KEY, LocalCancelAllData } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Details } from '@/components/Details';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
// eslint-disable-next-line import/no-cycle
import { Notification, NotificationProps } from '@/components/Notification';

import { useAppSelector } from '@/state/appTypes';
import { getAssetImageUrl } from '@/state/assetsSelectors';
import { getMarketData } from '@/state/perpetualsSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

type ElementProps = {
  localCancelAll: LocalCancelAllData;
};

export const CancelAllNotification = ({
  isToast,
  localCancelAll,
  notification,
}: NotificationProps & ElementProps) => {
  const stringGetter = useStringGetter();
  const isCancelForSingleMarket = localCancelAll.key !== CANCEL_ALL_ORDERS_KEY;
  const marketData = useAppSelector(
    (s) => (isCancelForSingleMarket ? getMarketData(s, localCancelAll.key) : null),
    shallowEqual
  );
  const numOrders = localCancelAll.orderIds.length;
  const numCanceled = localCancelAll.canceledOrderIds?.length ?? 0;
  const numFailed = localCancelAll.failedOrderIds?.length ?? 0;

  const { assetId } = orEmptyObj(marketData);
  const logoUrl = useAppSelector((s) => getAssetImageUrl(s, assetId));

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
        params: { MARKET_ID: localCancelAll.key },
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
