import { shallowEqual } from 'react-redux';

import { AbacusOrderStatus } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { CancelOrderStatuses, LocalCancelOrderData, ORDER_TYPE_STRINGS } from '@/constants/trade';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

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
  let orderStatusIcon = <LoadingSpinner tw="text-accent [--spinner-width:0.9375rem]" />;
  let customContent = null;

  // show Canceled if either canceled confirmation happens (node / indexer)
  // note: indexer status is further processed by abacus, but PartiallyCanceled = CANCELED
  const isPartiallyCanceled = indexedOrderStatus === AbacusOrderStatus.PartiallyCanceled.rawValue;
  const isCancelFinalized =
    indexedOrderStatus === AbacusOrderStatus.Canceled.rawValue || isPartiallyCanceled;

  if (cancelStatus === CancelOrderStatuses.Canceled || isCancelFinalized) {
    orderStatusStringKey = isPartiallyCanceled
      ? STRING_KEYS.PARTIALLY_FILLED
      : STRING_KEYS.CANCELED;
    orderStatusIcon = (
      <OrderStatusIcon
        status={AbacusOrderStatus.Canceled.rawValue}
        tw="h-[0.9375rem] w-[0.9375rem]"
      />
    );
  }

  if (localCancel.errorParams) {
    orderStatusStringKey = STRING_KEYS.ERROR;
    orderStatusIcon = <Icon iconName={IconName.Warning} tw="text-warning" />;
    customContent = (
      <span>
        {stringGetter({
          key: localCancel.errorParams.errorStringKey,
          fallback: localCancel.errorParams.errorMessage ?? '',
        })}
      </span>
    );
  }

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<AssetIcon symbol={assetId} />}
      slotTitle={orderTypeKey && stringGetter({ key: orderTypeKey })}
      slotTitleRight={
        <span tw="gap-[0.5ch] text-text-0 font-small-book row">
          {stringGetter({ key: orderStatusStringKey })}
          {orderStatusIcon}
        </span>
      }
      slotCustomContent={customContent}
    />
  );
};
