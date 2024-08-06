import { shallowEqual } from 'react-redux';

import {
  AbacusOrderStatus,
  KotlinIrEnumValues,
  ORDER_SIDES,
  ORDER_STATUS_STRINGS,
} from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';
import {
  ORDER_TYPE_STRINGS,
  PlaceOrderStatuses,
  type LocalPlaceOrderData,
} from '@/constants/trade';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
// eslint-disable-next-line import/no-cycle
import { Notification, NotificationProps } from '@/components/Notification';

import { getFillByClientId, getOrderByClientId } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getMarketData } from '@/state/perpetualsSelectors';

import { assertNever } from '@/lib/assertNever';
import { getTradeType } from '@/lib/orders';

import { OrderStatusIcon } from '../OrderStatusIcon';
import { FillDetails } from './TradeNotification/FillDetails';

type ElementProps = {
  localOrder: LocalPlaceOrderData;
};

export const OrderStatusNotification = ({
  isToast,
  localOrder,
  notification,
}: NotificationProps & ElementProps) => {
  const stringGetter = useStringGetter();
  const order = useParameterizedSelector(getOrderByClientId, localOrder.clientId);
  const fill = useParameterizedSelector(getFillByClientId, localOrder.clientId);
  const marketData = useAppSelector((s) => getMarketData(s, localOrder.marketId), shallowEqual);

  const { assetId } = marketData ?? {};
  const { equityTiersLearnMore } = useURLConfigs();
  const titleKey = ORDER_TYPE_STRINGS[localOrder.orderType]?.orderTypeKey;
  const indexedOrderStatus = order?.status?.rawValue as KotlinIrEnumValues<
    typeof AbacusOrderStatus
  >;
  const submissionStatus = localOrder.submissionStatus;

  let orderStatusStringKey = STRING_KEYS.SUBMITTING;
  let orderStatusIcon = <LoadingSpinner tw="text-color-accent [--spinner-width:0.9375rem]" />;
  let customContent = null;

  switch (submissionStatus) {
    case PlaceOrderStatuses.Placed:
    case PlaceOrderStatuses.Filled:
    case PlaceOrderStatuses.Canceled:
      if (indexedOrderStatus) {
        // skip pending / best effort open state -> still show as submitted (loading)
        if (indexedOrderStatus === AbacusOrderStatus.Pending.rawValue) break;

        orderStatusStringKey = ORDER_STATUS_STRINGS[indexedOrderStatus];
        orderStatusIcon = (
          <OrderStatusIcon status={indexedOrderStatus} tw="h-[0.9375rem] w-[0.9375rem]" />
        );

        if (order && fill) {
          customContent = (
            <FillDetails
              orderSide={ORDER_SIDES[order.side.name]}
              tradeType={getTradeType(order.type.rawValue) ?? undefined}
              filledAmount={order.totalFilled}
              assetId={assetId}
              averagePrice={order.price}
              tickSizeDecimals={marketData?.configs?.displayTickSizeDecimals ?? USD_DECIMALS}
            />
          );
        } else if (
          indexedOrderStatus === AbacusOrderStatus.Canceled.rawValue &&
          order?.cancelReason
        ) {
          // when there's no fill and has a cancel reason, i.e. just plain canceled
          const cancelReason = order.cancelReason as keyof typeof STRING_KEYS;
          customContent = <span>{stringGetter({ key: STRING_KEYS[cancelReason] })}</span>;
        }
      }
      break;
    case PlaceOrderStatuses.Submitted:
      if (localOrder.errorParams) {
        orderStatusStringKey = STRING_KEYS.ERROR;
        orderStatusIcon = <Icon iconName={IconName.Warning} tw="text-color-warning" />;
        customContent = (
          <span>
            {stringGetter({
              key: localOrder.errorParams.errorStringKey,
              params: {
                EQUITY_TIER_LEARN_MORE: (
                  <Link href={equityTiersLearnMore} onClick={(e) => e.stopPropagation()} isInline>
                    {stringGetter({ key: STRING_KEYS.LEARN_MORE_ARROW })}
                  </Link>
                ),
              },
              fallback: localOrder.errorParams.errorMessage ?? '',
            })}
          </span>
        );
      }
      break;
    default:
      assertNever(submissionStatus);
  }

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<AssetIcon symbol={assetId} />}
      slotTitle={titleKey && stringGetter({ key: titleKey })}
      slotTitleRight={
        <span tw="row gap-[0.5ch] text-color-text-0 font-small-book">
          {stringGetter({ key: orderStatusStringKey })}
          {orderStatusIcon}
        </span>
      }
      slotCustomContent={customContent}
    />
  );
};
