import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { AbacusOrderStatus } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { CancelOrderStatuses, LocalCancelOrderData, ORDER_TYPE_STRINGS } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Notification, NotificationProps } from '@/components/Notification';

import { getOrderById } from '@/state/accountSelectors';
import { getMarketData } from '@/state/perpetualsSelectors';

import { getTradeType } from '@/lib/orders';

import { OrderStatusIcon } from '../OrderStatusIcon';

type ElementProps = {
  localCancel: LocalCancelOrderData;
};

export const OrderCancelNotification = ({
  isToast,
  localCancel,
  notification,
}: NotificationProps & ElementProps) => {
  const stringGetter = useStringGetter();
  const order = useSelector(getOrderById(localCancel.orderId), shallowEqual)!!;
  const marketData = useSelector(getMarketData(order.marketId), shallowEqual);
  const { assetId } = marketData ?? {};
  const tradeType = getTradeType(order.type.rawValue) ?? undefined;
  const orderTypeKey = tradeType && ORDER_TYPE_STRINGS[tradeType]?.orderTypeKey;
  const indexedOrderStatus = order.status.rawValue;
  const cancelStatus = localCancel.submissionStatus;

  let orderStatusStringKey = STRING_KEYS.CANCELING;
  let orderStatusIcon = <$LoadingSpinner />;
  let customContent = null;

  // whichever canceled confirmation happens first (node / indexer)
  const canceledStatusValue = AbacusOrderStatus.cancelled.rawValue;
  if (cancelStatus === CancelOrderStatuses.Canceled || indexedOrderStatus === canceledStatusValue) {
    orderStatusStringKey = STRING_KEYS.CANCELED;
    orderStatusIcon = <$OrderStatusIcon status={canceledStatusValue} />;
  }

  if (localCancel.errorStringKey) {
    orderStatusStringKey = STRING_KEYS.ERROR;
    orderStatusIcon = <$WarningIcon iconName={IconName.Warning} />;
    customContent = <span>{stringGetter({ key: localCancel.errorStringKey })}</span>;
  }

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<AssetIcon symbol={assetId} />}
      slotTitle={orderTypeKey && stringGetter({ key: orderTypeKey })}
      slotTitleRight={
        <$OrderStatus>
          {stringGetter({ key: orderStatusStringKey })}
          {orderStatusIcon}
        </$OrderStatus>
      }
      slotCustomContent={customContent}
    />
  );
};
const $Label = styled.span`
  ${layoutMixins.row}
  gap: 0.5ch;
`;

const $OrderStatus = styled($Label)`
  color: var(--color-text-0);
  font: var(--font-small-book);
`;

const $LoadingSpinner = styled(LoadingSpinner)`
  --spinner-width: 0.9375rem;
  color: var(--color-accent);
`;

const $WarningIcon = styled(Icon)`
  color: var(--color-warning);
`;

const $OrderStatusIcon = styled(OrderStatusIcon)`
  width: 0.9375rem;
  height: 0.9375rem;
`;
