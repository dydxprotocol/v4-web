import { shallowEqual, useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import {
  AbacusOrderStatus,
  KotlinIrEnumValues,
  ORDER_SIDES,
  ORDER_STATUS_STRINGS,
  SubaccountFill,
  SubaccountOrder,
} from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { OrderSubmissionStatuses } from '@/constants/notifications';
import { USD_DECIMALS } from '@/constants/numbers';
import { ORDER_TYPE_STRINGS } from '@/constants/trade';

import { useStringGetter } from '@/hooks';
import { LocalOrderData } from '@/hooks/useOrderStatusNotifications';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Notification, NotificationProps } from '@/components/Notification';

import { getFillByClientId, getOrderByClientId } from '@/state/accountSelectors';
import { getMarketData } from '@/state/perpetualsSelectors';

import { getTradeType } from '@/lib/orders';

import { OrderStatusIcon } from '../OrderStatusIcon';
import { FillDetails } from './TradeNotification/FillDetails';

type ElementProps = {
  orderClientId: number;
  localOrder: LocalOrderData;
  order?: SubaccountOrder;
  fill?: SubaccountFill;
};

export const OrderStatusNotification = ({
  isToast,
  orderClientId,
  localOrder,
  notification,
}: NotificationProps & ElementProps) => {
  const stringGetter = useStringGetter();
  const order = useSelector(getOrderByClientId(orderClientId), shallowEqual);
  const fill = useSelector(getFillByClientId(orderClientId), shallowEqual);
  const marketData = useSelector(getMarketData(localOrder.marketId), shallowEqual);
  const { assetId } = marketData ?? {};
  const titleKey = localOrder.orderType && ORDER_TYPE_STRINGS[localOrder.orderType]?.orderTypeKey;
  const indexedOrderStatus = order?.status?.rawValue;
  const submissionStatus = localOrder.submissionStatus;

  let orderStatusStringKey = STRING_KEYS.SUBMITTED;
  let orderStatusIcon = <Styled.LoadingSpinner />;

  switch (submissionStatus) {
    case OrderSubmissionStatuses.Failed:
      orderStatusStringKey = STRING_KEYS.FAILED;
      orderStatusIcon = <Styled.WarningIcon iconName={IconName.Warning} />;
      break;
    case OrderSubmissionStatuses.Placed:
    case OrderSubmissionStatuses.Filled:
      if (indexedOrderStatus) {
        orderStatusStringKey =
          ORDER_STATUS_STRINGS[
            indexedOrderStatus as unknown as KotlinIrEnumValues<typeof AbacusOrderStatus>
          ];
        orderStatusIcon = <Styled.OrderStatusIcon status={indexedOrderStatus} />;
      }
      break;
    case OrderSubmissionStatuses.Submitted:
    default:
      break;
  }

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<AssetIcon symbol={assetId} />}
      slotTitle={titleKey && stringGetter({ key: titleKey })}
      slotTitleRight={
        <Styled.OrderStatus>
          {stringGetter({ key: orderStatusStringKey })}
          {orderStatusIcon}
        </Styled.OrderStatus>
      }
      slotCustomContent={
        submissionStatus === OrderSubmissionStatuses.Filled &&
        order &&
        fill && (
          <FillDetails
            orderSide={ORDER_SIDES[order.side.name]}
            tradeType={getTradeType(order.type.rawValue) ?? undefined}
            filledAmount={order.totalFilled}
            assetId={assetId}
            averagePrice={order.price}
            tickSizeDecimals={marketData?.configs?.displayTickSizeDecimals ?? USD_DECIMALS}
          />
        )
      }
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Label = styled.span`
  ${layoutMixins.row}
  gap: 0.5ch;
`;

Styled.OrderStatus = styled(Styled.Label)`
  color: var(--color-text-1);
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
