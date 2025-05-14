import { BonsaiHelpers } from '@/bonsai/ontology';
import { OrderStatus, SubaccountFill, SubaccountOrder } from '@/bonsai/types/summaryTypes';
import { OrderSide } from '@dydxprotocol/v4-client-js';

import { USD_DECIMALS } from '@/constants/numbers';
import { IndexerOrderSide } from '@/types/indexer/indexerApiGen';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
// eslint-disable-next-line import/no-cycle
import { Notification, NotificationProps } from '@/components/Notification';
import { OrderStatusIconNew } from '@/views/OrderStatusIcon';

import {
  getIndexerOrderTypeStringKey,
  getOrderStatusStringKey,
} from '@/lib/enumToStringKeyHelpers';
import { getAverageFillPrice } from '@/lib/orders';
import { orEmptyObj } from '@/lib/typeUtils';

import { FillDetails } from './FillDetails';

type ElementProps = {
  order: SubaccountOrder;
  fills: SubaccountFill[];
};

export type TradeNotificationProps = NotificationProps & ElementProps;

export const TradeNotification = ({
  isToast,
  notification,
  order,
  fills,
}: TradeNotificationProps) => {
  const stringGetter = useStringGetter();
  const marketData = useAppSelectorWithArgs(
    BonsaiHelpers.markets.selectMarketSummaryById,
    order.marketId
  );
  const { assetId } = orEmptyObj(marketData);
  const assetImgUrl = useAppSelectorWithArgs(BonsaiHelpers.assets.selectAssetLogo, assetId);

  const titleKey = getIndexerOrderTypeStringKey(order.type);
  const orderStatus = order.status;

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<AssetIcon logoUrl={assetImgUrl} symbol={assetId} />}
      slotTitle={titleKey && stringGetter({ key: titleKey })}
      slotTitleRight={
        <span tw="row gap-[0.5ch] text-color-text-0 font-small-book">
          {stringGetter({ key: getOrderStatusStringKey(orderStatus) })}
          <OrderStatusIconNew status={orderStatus ?? OrderStatus.Open} tw="size-[0.9375rem]" />
        </span>
      }
      slotCustomContent={
        fills.length > 0 ? (
          <FillDetails
            orderSide={order.side === IndexerOrderSide.BUY ? OrderSide.BUY : OrderSide.SELL}
            filledAmount={order.totalFilled}
            assetId={marketData?.assetId}
            averagePrice={getAverageFillPrice(fills) ?? undefined}
            tickSizeDecimals={marketData?.tickSizeDecimals ?? USD_DECIMALS}
          />
        ) : undefined
      }
    />
  );
};
