import { OrderFlags, OrderStatus } from '@/bonsai/types/summaryTypes';
import BigNumber from 'bignumber.js';
import { shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';

import { type Nullable } from '@/constants/abacus';
import { ButtonAction } from '@/constants/buttons';
import { DialogProps, OrderDetailsDialogProps } from '@/constants/dialogs';
import { STRING_KEYS, type StringKey } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { AppRoute } from '@/constants/routes';
import { CancelOrderStatuses } from '@/constants/trade';
import { IndexerOrderSide, IndexerOrderType } from '@/types/indexer/indexerApiGen';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { type DetailsItem } from '@/components/Details';
import { DetailsDialog } from '@/components/DetailsDialog';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';
import { OrderStatusIconNew } from '@/views/OrderStatusIcon';
import {
  getIndexerOrderTypeStringKey,
  getMarginModeStringKey,
  getOrderStatusStringKey,
  getOrderTimeInForceStringKey,
} from '@/views/tables/enumToStringKeyHelpers';

import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getOrderDetails } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getLocalCancelOrders } from '@/state/localOrdersSelectors';

import { isMarketOrderTypeNew, isNewOrderStatusClearable } from '@/lib/orders';

export const OrderDetailsDialog = ({
  orderId,
  setIsOpen,
}: DialogProps<OrderDetailsDialogProps>) => {
  const stringGetter = useStringGetter();
  const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);

  const { cancelOrder } = useSubaccount();

  const localCancelOrders = useAppSelector(getLocalCancelOrders, shallowEqual);
  const localCancelOrder = localCancelOrders.find((order) => order.orderId === orderId);
  const isOrderCanceling =
    localCancelOrder && localCancelOrder.submissionStatus < CancelOrderStatuses.Canceled;

  const {
    displayId,
    expiresAtMilliseconds,
    marketId,
    orderFlags,
    side: orderSide,
    postOnly,
    price,
    reduceOnly,
    totalFilled,
    size,
    status,
    stepSizeDecimals,
    subaccountNumber,
    tickSizeDecimals,
    triggerPrice,
    timeInForce,
    type,
    updatedAtMilliseconds,
    marginMode,
    marketSummary,

    removalReason,
  } = useParameterizedSelector(getOrderDetails, orderId) ?? {};

  const marginModeLabel = stringGetter({ key: getMarginModeStringKey(marginMode ?? 'CROSS') });

  const renderOrderPrice = ({
    type: innerType,
    price: innerPrice,
    tickSizeDecimals: innerTickSizeDecimals,
  }: {
    type?: IndexerOrderType;
    price?: Nullable<BigNumber>;
    tickSizeDecimals: number;
  }) =>
    isMarketOrderTypeNew(innerType) ? (
      stringGetter({ key: STRING_KEYS.MARKET_PRICE_SHORT })
    ) : (
      <Output type={OutputType.Fiat} value={innerPrice} fractionDigits={innerTickSizeDecimals} />
    );

  const renderOrderTime = ({ timeInMs }: { timeInMs: Nullable<number> }) =>
    timeInMs ? <Output type={OutputType.DateTime} value={timeInMs} /> : '-';

  const detailItems = (
    [
      {
        key: 'market',
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        value: (
          <Link to={`${AppRoute.Trade}/${marketId}`} tw="underline">
            {displayId}
          </Link>
        ),
      },
      {
        key: 'market-id',
        label: stringGetter({ key: STRING_KEYS.TICKER }),
        value: marketId,
      },
      {
        key: 'margin-mode',
        label: stringGetter({ key: STRING_KEYS.MARGIN_MODE }),
        value: marginModeLabel,
      },
      {
        key: 'side',
        label: stringGetter({ key: STRING_KEYS.SIDE }),
        value: <OrderSideTag orderSide={orderSide ?? IndexerOrderSide.BUY} />,
      },
      {
        key: 'status',
        label: stringGetter({ key: STRING_KEYS.STATUS }),
        value: (
          <div tw="inlineRow">
            {status != null && <OrderStatusIconNew status={status} />}
            <span tw="font-small-medium">
              {stringGetter({ key: getOrderStatusStringKey(status) })}
            </span>
          </div>
        ),
      },
      {
        key: 'cancel-reason',
        label: stringGetter({ key: STRING_KEYS.CANCEL_REASON }),
        value: removalReason
          ? stringGetter({ key: STRING_KEYS[removalReason as StringKey] })
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
        value: renderOrderPrice({ type, price, tickSizeDecimals: tickSizeDecimals ?? 0 }),
      },
      {
        key: 'trigger-price',
        label: stringGetter({ key: STRING_KEYS.TRIGGER_PRICE_SHORT }),
        value: triggerPrice
          ? renderOrderPrice({ price: triggerPrice, tickSizeDecimals: tickSizeDecimals ?? 0 })
          : undefined,
      },
      {
        key: 'time-in-force',
        label: stringGetter({ key: STRING_KEYS.TIME_IN_FORCE }),
        value:
          timeInForce != null
            ? stringGetter({ key: getOrderTimeInForceStringKey(timeInForce) })
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
        key: 'updated-at',
        label: stringGetter({ key: STRING_KEYS.UPDATED }),
        value: renderOrderTime({ timeInMs: updatedAtMilliseconds }),
      },
      {
        key: 'subaccount',
        label: 'Subaccount # (Debug Only)',
        value: !isMainnet ? `${subaccountNumber}` : undefined,
      },
    ] satisfies DetailsItem[]
  ).filter((item) => Boolean(item.value));

  const onCancelClick = () => {
    cancelOrder({ orderId });
  };

  const isShortTermOrder = orderFlags === OrderFlags.SHORT_TERM;
  // we update short term orders to pending status when they are best effort canceled in Abacus
  const isBestEffortCanceled =
    (status === OrderStatus.Pending && removalReason != null) || status === OrderStatus.Canceling;

  const isCancelDisabled = !!isOrderCanceling || (isShortTermOrder && isBestEffortCanceled);

  return (
    <DetailsDialog
      slotIcon={<AssetIcon logoUrl={marketSummary?.logo} symbol={marketSummary?.assetId} />}
      title={type != null && stringGetter({ key: getIndexerOrderTypeStringKey(type) })}
      slotFooter={
        isAccountViewOnly || (status != null && isNewOrderStatusClearable(status)) ? null : (
          <Button
            action={ButtonAction.Destroy}
            state={{
              isDisabled: isCancelDisabled,
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
