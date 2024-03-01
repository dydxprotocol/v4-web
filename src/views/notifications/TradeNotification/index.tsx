import { OrderSide } from '@dydxprotocol/v4-client-js';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import {
  AbacusOrderStatus,
  AbacusOrderType,
  KotlinIrEnumValues,
  ORDER_STATUS_STRINGS,
  TRADE_TYPES,
} from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { ORDER_TYPE_STRINGS, TradeTypes } from '@/constants/trade';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Details } from '@/components/Details';
import { Notification, NotificationProps } from '@/components/Notification';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';
import { OrderStatusIcon } from '@/views/OrderStatusIcon';

import { getMarketData } from '@/state/perpetualsSelectors';

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
  const marketData = useSelector(getMarketData(MARKET), shallowEqual);
  const { assetId } = marketData ?? {};
  const orderType = ORDER_TYPE as KotlinIrEnumValues<typeof AbacusOrderType>;
  const tradeType = TRADE_TYPES[orderType];
  const titleKey = tradeType && ORDER_TYPE_STRINGS[tradeType]?.orderTypeKey;
  const orderStatus = ORDER_STATUS as KotlinIrEnumValues<typeof AbacusOrderStatus>;

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<AssetIcon symbol={assetId} />}
      slotTitle={titleKey && stringGetter({ key: titleKey })}
      slotTitleRight={
        <Styled.OrderStatus>
          {stringGetter({ key: ORDER_STATUS_STRINGS[orderStatus] })}
          <Styled.OrderStatusIcon status={orderStatus} totalFilled={parseFloat(FILLED_AMOUNT)} />
        </Styled.OrderStatus>
      }
      slotCustomContent={
        <Styled.Details
          items={[
            {
              key: 'size',
              label: (
                <Styled.Label>
                  {stringGetter({ key: STRING_KEYS.SIZE })}
                  <OrderSideTag
                    orderSide={SIDE === STRING_KEYS.BUY ? OrderSide.BUY : OrderSide.SELL}
                  />
                </Styled.Label>
              ),
              value: (
                <Output type={OutputType.Asset} value={FILLED_AMOUNT} tag={marketData?.assetId} />
              ),
            },
            {
              key: 'price',
              label: stringGetter({ key: STRING_KEYS.PRICE }),
              value:
                ORDER_TYPE === TradeTypes.MARKET ? (
                  <span>{stringGetter({ key: STRING_KEYS.MARKET_ORDER_SHORT })}</span>
                ) : (
                  <Output
                    type={OutputType.Fiat}
                    value={AVERAGE_PRICE}
                    fractionDigits={marketData?.configs?.displayTickSizeDecimals}
                  />
                ),
            },
          ]}
        />
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
  color: var(--color-text-0);
  font: var(--font-small-book);
`;

Styled.OrderStatusIcon = styled(OrderStatusIcon)`
  width: 0.9375rem;
  height: 0.9375rem;
`;

Styled.Details = styled(Details)`
  --details-item-height: 1.5rem;

  dd {
    color: var(--color-text-2);
  }
`;
