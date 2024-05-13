import { shallowEqual, useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { AbacusOrderStatus } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { CancelOrderStatuses, LocalCancelOrderData, ORDER_TYPE_STRINGS } from '@/constants/trade';

import { useStringGetter } from '@/hooks';

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
  let orderStatusIcon = <Styled.LoadingSpinner />;
  let customContent = null;

  // whichever canceled confirmation happens first (node / indexer)
  const canceledStatusValue = AbacusOrderStatus.cancelled.rawValue;
  if (cancelStatus === CancelOrderStatuses.Canceled || indexedOrderStatus === canceledStatusValue) {
    orderStatusStringKey = STRING_KEYS.CANCELED;
    orderStatusIcon = <Styled.OrderStatusIcon status={canceledStatusValue} />;
  }

  if (localCancel.errorStringKey) {
    orderStatusStringKey = STRING_KEYS.ERROR;
    orderStatusIcon = <Styled.WarningIcon iconName={IconName.Warning} />;
    customContent = <span>{stringGetter({ key: localCancel.errorStringKey })}</span>;
  }

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<AssetIcon symbol={assetId} />}
      slotTitle={orderTypeKey && stringGetter({ key: orderTypeKey })}
      slotTitleRight={
        <Styled.OrderStatus>
          {stringGetter({ key: orderStatusStringKey })}
          {orderStatusIcon}
        </Styled.OrderStatus>
      }
      slotCustomContent={customContent}
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Label = styled.span`
  ${layoutMixins.row}
  gap: 0.5ch;
`;

Styled.OrderStatus = styled(Styled.Label)`
  color: var(--color-text-0);
  font: var(--font-small-book);
`;

Styled.LoadingSpinner = styled(LoadingSpinner)`
  --spinner-width: 0.9375rem;
  color: var(--color-accent);
`;

Styled.WarningIcon = styled(Icon)`
  color: var(--color-warning);
`;

Styled.OrderStatusIcon = styled(OrderStatusIcon)`
  width: 0.9375rem;
  height: 0.9375rem;
`;
