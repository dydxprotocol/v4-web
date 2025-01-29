import { BonsaiHelpers } from '@/bonsai/ontology';
import { OrderSide } from '@dydxprotocol/v4-client-js';

import {
  AbacusOrderStatus,
  AbacusOrderType,
  KotlinIrEnumValues,
  ORDER_STATUS_STRINGS,
  TRADE_TYPES,
} from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';
import { ORDER_TYPE_STRINGS } from '@/constants/trade';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
// eslint-disable-next-line import/no-cycle
import { Notification, NotificationProps } from '@/components/Notification';
import { OrderStatusIcon } from '@/views/OrderStatusIcon';

import { orEmptyObj } from '@/lib/typeUtils';

import { FillDetails } from './FillDetails';

type ElementProps = {
  data: {
    AMOUNT: string;
    ASSET: string;
    AVERAGE_PRICE: string;
    FILLED_AMOUNT: string;
    MARKET: string;
    ORDER_STATUS: string;
    ORDER_TYPE: string;
    ORDER_TYPE_TEXT: string;
    PRICE: string;
    SIDE: string;
  };
};

export type TradeNotificationProps = NotificationProps & ElementProps;

export const TradeNotification = ({ isToast, data, notification }: TradeNotificationProps) => {
  const stringGetter = useStringGetter();
  const { AVERAGE_PRICE, FILLED_AMOUNT, MARKET, ORDER_TYPE, ORDER_STATUS, SIDE } = data;
  const marketData = useParameterizedSelector(
    BonsaiHelpers.markets.createSelectMarketSummaryById,
    MARKET
  );
  const { assetId } = orEmptyObj(marketData);
  const assetImgUrl = useParameterizedSelector(BonsaiHelpers.assets.createSelectAssetLogo, assetId);
  const orderType = ORDER_TYPE as KotlinIrEnumValues<typeof AbacusOrderType>;
  const tradeType = TRADE_TYPES[orderType] ?? undefined;
  const titleKey = tradeType && ORDER_TYPE_STRINGS[tradeType].orderTypeKey;
  const orderStatus = ORDER_STATUS as KotlinIrEnumValues<typeof AbacusOrderStatus>;

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<AssetIcon logoUrl={assetImgUrl} symbol={assetId} />}
      slotTitle={titleKey && stringGetter({ key: titleKey })}
      slotTitleRight={
        <span tw="row gap-[0.5ch] text-color-text-0 font-small-book">
          {stringGetter({ key: ORDER_STATUS_STRINGS[orderStatus] })}
          <OrderStatusIcon status={orderStatus} tw="h-[0.9375rem] w-[0.9375rem]" />
        </span>
      }
      slotCustomContent={
        <FillDetails
          orderSide={SIDE === STRING_KEYS.BUY ? OrderSide.BUY : OrderSide.SELL}
          filledAmount={FILLED_AMOUNT}
          assetId={marketData?.assetId}
          averagePrice={AVERAGE_PRICE}
          tickSizeDecimals={marketData?.tickSizeDecimals ?? USD_DECIMALS}
        />
      }
    />
  );
};
