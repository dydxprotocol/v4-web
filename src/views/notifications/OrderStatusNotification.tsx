import { BonsaiHelpers } from '@/bonsai/ontology';
import { OrderStatus } from '@/bonsai/types/summaryTypes';
import { OrderSide } from '@dydxprotocol/v4-client-js';
import { sum } from 'lodash';

import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';
import {
  ORDER_TYPE_STRINGS,
  PlaceOrderStatuses,
  type LocalPlaceOrderData,
} from '@/constants/trade';
import { IndexerOrderSide } from '@/types/indexer/indexerApiGen';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
// eslint-disable-next-line import/no-cycle
import { Notification, NotificationProps } from '@/components/Notification';

import {
  getAverageFillPriceForOrder,
  getFillsForOrderId,
  getOrderByClientId,
} from '@/state/accountSelectors';

import { assertNever } from '@/lib/assertNever';
import { AttemptNumber } from '@/lib/numbers';
import { isPresent, orEmptyObj } from '@/lib/typeUtils';

import { getOrderStatusStringKey } from '../../lib/enumToStringKeyHelpers';
import { OrderStatusIconNew } from '../OrderStatusIcon';
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
  const order = useAppSelectorWithArgs(getOrderByClientId, localOrder.clientId);
  const fills = useAppSelectorWithArgs(getFillsForOrderId, order?.id ?? localOrder.orderId);
  const marketData = useAppSelectorWithArgs(
    BonsaiHelpers.markets.selectMarketSummaryById,
    localOrder.cachedData.marketId
  );
  const averageFillPrice = useAppSelectorWithArgs(
    getAverageFillPriceForOrder,
    order?.id ?? localOrder.orderId
  );

  const { assetId } = orEmptyObj(marketData);
  const logoUrl = useAppSelectorWithArgs(BonsaiHelpers.assets.selectAssetLogo, assetId);
  const { equityTiersLearnMore } = useURLConfigs();

  // force allow the ?. just in case it's not in the map
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const titleKey = ORDER_TYPE_STRINGS[localOrder.cachedData.orderType]?.orderTypeKey;
  const indexedOrderStatus = order?.status ?? localOrder.cachedData.status;
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
        if (indexedOrderStatus === OrderStatus.Pending) break;

        orderStatusStringKey = getOrderStatusStringKey(indexedOrderStatus);
        orderStatusIcon = <OrderStatusIconNew status={indexedOrderStatus} tw="size-[0.9375rem]" />;

        if (fills.length > 0) {
          customContent = (
            <FillDetails
              orderSide={fills[0]?.side === IndexerOrderSide.BUY ? OrderSide.BUY : OrderSide.SELL}
              filledAmount={
                order?.totalFilled ?? sum(fills.map((f) => AttemptNumber(f.size)).filter(isPresent))
              }
              assetId={assetId}
              averagePrice={averageFillPrice ?? order?.price}
              tickSizeDecimals={marketData?.tickSizeDecimals ?? USD_DECIMALS}
            />
          );
        } else if (indexedOrderStatus === OrderStatus.Canceled && order?.removalReason) {
          // when there's no fill and has a cancel reason, i.e. just plain canceled
          const cancelReason = order.removalReason as keyof typeof STRING_KEYS;
          customContent = <span>{stringGetter({ key: (STRING_KEYS as any)[cancelReason] })}</span>;
        }
      }
      break;
    case PlaceOrderStatuses.Submitted:
      break;
    case PlaceOrderStatuses.FailedSubmission:
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
      slotIcon={<AssetIcon logoUrl={logoUrl} symbol={assetId} />}
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
