import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { AbacusOrderStatus } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { CancelOrderStatuses, LocalCancelOrderData, ORDER_TYPE_STRINGS } from '@/constants/trade';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
// eslint-disable-next-line import/no-cycle
import { Notification, NotificationProps } from '@/components/Notification';

import { getOrderById } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
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
  const order = useParameterizedSelector(getOrderById, localCancel.orderId)!;
  const marketData = useAppSelector((s) => getMarketData(s, order.marketId), shallowEqual);
  const { assetId } = marketData ?? {};
  const tradeType = getTradeType(order.type.rawValue) ?? undefined;
  const orderTypeKey = tradeType && ORDER_TYPE_STRINGS[tradeType]?.orderTypeKey;
  const indexedOrderStatus = order.status.rawValue;
  const cancelStatus = localCancel.submissionStatus;

  let orderStatusStringKey = STRING_KEYS.CANCELING;
  let orderStatusIcon = <$LoadingSpinner />;
  let customContent = null;

  // show Canceled if either canceled confirmation happens (node / indexer)
  // note: indexer status is further processed by abacus, but partiallyCanceled = CANCELED
  const isPartiallyCanceled = indexedOrderStatus === AbacusOrderStatus.partiallyCanceled.rawValue;
  const isCancelFinalized =
    indexedOrderStatus === AbacusOrderStatus.cancelled.rawValue || isPartiallyCanceled;

  if (cancelStatus === CancelOrderStatuses.Canceled || isCancelFinalized) {
    orderStatusStringKey = isPartiallyCanceled
      ? STRING_KEYS.PARTIALLY_FILLED
      : STRING_KEYS.CANCELED;
    orderStatusIcon = <$OrderStatusIcon status={indexedOrderStatus} />;
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
