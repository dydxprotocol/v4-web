import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { AbacusOrderStatus, AbacusOrderTypes, type Nullable } from '@/constants/abacus';
import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS, type StringKey } from '@/constants/localization';
import { CancelOrderStatuses } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { type DetailsItem } from '@/components/Details';
import { DetailsDialog } from '@/components/DetailsDialog';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';
import { OrderStatusIcon } from '@/views/OrderStatusIcon';
import { type OrderTableRow } from '@/views/tables/OrdersTable';

import { clearOrder } from '@/state/account';
import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getLocalCancelOrders, getOrderDetails } from '@/state/accountSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { MustBigNumber } from '@/lib/numbers';
import { isMarketOrderType, isOrderStatusClearable, relativeTimeString } from '@/lib/orders';

type ElementProps = {
  orderId: string;
  setIsOpen: (open: boolean) => void;
};

export const OrderDetailsDialog = ({ orderId, setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const selectedLocale = useSelector(getSelectedLocale);
  const isAccountViewOnly = useSelector(calculateIsAccountViewOnly);
  const localCancelOrders = useSelector(getLocalCancelOrders, shallowEqual);
  const { cancelOrder } = useSubaccount();

  const localCancelOrder = localCancelOrders.find((order) => order.orderId === orderId);
  const isOrderCanceling =
    localCancelOrder && localCancelOrder.submissionStatus < CancelOrderStatuses.Canceled;

  const {
    asset,
    cancelReason,
    createdAtMilliseconds,
    expiresAtMilliseconds,
    marketId,
    orderSide,
    postOnly,
    price,
    reduceOnly,
    totalFilled,
    resources,
    size,
    status,
    stepSizeDecimals,
    tickSizeDecimals,
    trailingPercent,
    triggerPrice,
    type,
  } = (useSelector(getOrderDetails(orderId)) as OrderTableRow) || {};

  const renderOrderPrice = ({
    type,
    price,
    tickSizeDecimals,
  }: {
    type?: AbacusOrderTypes;
    price?: Nullable<number>;
    tickSizeDecimals: number;
  }) =>
    isMarketOrderType(type) ? (
      stringGetter({ key: STRING_KEYS.MARKET_PRICE_SHORT })
    ) : (
      <Output type={OutputType.Fiat} value={price} fractionDigits={tickSizeDecimals} />
    );

  const renderOrderTime = ({ timeInMs }: { timeInMs: Nullable<number> }) =>
    timeInMs ? <time>{relativeTimeString({ timeInMs, selectedLocale })}</time> : '-';

  const detailItems = [
    {
      key: 'market',
      label: stringGetter({ key: STRING_KEYS.MARKET }),
      value: marketId,
    },
    {
      key: 'side',
      label: stringGetter({ key: STRING_KEYS.SIDE }),
      value: <OrderSideTag orderSide={orderSide} />,
    },
    {
      key: 'status',
      label: stringGetter({ key: STRING_KEYS.STATUS }),
      value: (
        <$Row>
          <OrderStatusIcon status={status.rawValue} />
          <$Status>
            {resources.statusStringKey && stringGetter({ key: resources.statusStringKey })}
          </$Status>
        </$Row>
      ),
    },
    {
      key: 'cancel-reason',
      label: stringGetter({ key: STRING_KEYS.CANCEL_REASON }),
      value: cancelReason
        ? stringGetter({ key: STRING_KEYS[cancelReason as StringKey] })
        : undefined,
    },
    {
      key: 'amount',
      label: stringGetter({ key: STRING_KEYS.AMOUNT }),
      value: <Output type={OutputType.Asset} value={size} fractionDigits={stepSizeDecimals} />,
    },
    {
      key: 'filled',
      label: stringGetter({ key: STRING_KEYS.AMOUNT_FILLED }),
      value: (
        <Output type={OutputType.Asset} value={totalFilled} fractionDigits={stepSizeDecimals} />
      ),
    },
    {
      key: 'price',
      label: stringGetter({ key: STRING_KEYS.PRICE }),
      value: renderOrderPrice({ type, price, tickSizeDecimals }),
    },
    {
      key: 'trigger-price',
      label: stringGetter({ key: STRING_KEYS.TRIGGER_PRICE_SHORT }),
      value: triggerPrice ? renderOrderPrice({ price: triggerPrice, tickSizeDecimals }) : undefined,
    },
    {
      key: 'trailing-percent',
      label: stringGetter({ key: STRING_KEYS.TRAILING_PERCENT }),
      value: trailingPercent ? (
        <Output type={OutputType.Percent} value={MustBigNumber(trailingPercent).div(100)} />
      ) : undefined,
    },
    {
      key: 'time-in-force',
      label: stringGetter({ key: STRING_KEYS.TIME_IN_FORCE }),
      value: resources.timeInForceStringKey
        ? stringGetter({ key: resources.timeInForceStringKey })
        : undefined,
    },
    {
      key: 'execution',
      label: stringGetter({ key: STRING_KEYS.EXECUTION }),
      value: reduceOnly
        ? stringGetter({ key: STRING_KEYS.REDUCE_ONLY })
        : postOnly
        ? stringGetter({ key: STRING_KEYS.POST_ONLY })
        : '-',
    },
    {
      key: 'good-til',
      label: stringGetter({ key: STRING_KEYS.GOOD_TIL }),
      value: renderOrderTime({ timeInMs: expiresAtMilliseconds }),
    },
    {
      key: 'created-at',
      label: stringGetter({ key: STRING_KEYS.CREATED_AT }),
      value: renderOrderTime({ timeInMs: createdAtMilliseconds }),
    },
  ].filter((item) => Boolean(item.value)) as DetailsItem[];

  const onCancelClick = () => {
    cancelOrder({ orderId });
  };

  const onClearClick = () => {
    dispatch(clearOrder(orderId));
    setIsOpen?.(false);
  };

  return (
    <DetailsDialog
      slotIcon={<$AssetIcon symbol={asset?.id} />}
      title={!resources.typeStringKey ? '' : stringGetter({ key: resources.typeStringKey })}
      slotFooter={
        isAccountViewOnly ? null : isOrderStatusClearable(status) ? (
          <Button onClick={onClearClick}>{stringGetter({ key: STRING_KEYS.CLEAR })}</Button>
        ) : (
          <Button
            action={ButtonAction.Destroy}
            state={{
              isDisabled: isOrderCanceling || status === AbacusOrderStatus.canceling,
              isLoading: isOrderCanceling,
            }}
            onClick={onCancelClick}
          >
            {stringGetter({ key: STRING_KEYS.CANCEL })}
          </Button>
        )
      }
      items={detailItems}
      setIsOpen={setIsOpen}
    />
  );
};
const $Row = styled.div`
  ${layoutMixins.inlineRow}
`;

const $Status = styled.span`
  font: var(--font-small-medium);
`;

const $AssetIcon = styled(AssetIcon)`
  font-size: 1em;
`;
