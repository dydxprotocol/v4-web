import { OrderFlags, OrderSide } from '@dydxprotocol/v4-client-js';
import { shallowEqual } from 'react-redux';

import {
  AbacusMarginMode,
  AbacusOrderStatus,
  AbacusOrderTypes,
  type Nullable,
} from '@/constants/abacus';
import { ButtonAction } from '@/constants/buttons';
import { DialogProps, OrderDetailsDialogProps } from '@/constants/dialogs';
import { STRING_KEYS, type StringKey } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { CancelOrderStatuses } from '@/constants/trade';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { type DetailsItem } from '@/components/Details';
import { DetailsDialog } from '@/components/DetailsDialog';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';
import { OrderStatusIcon } from '@/views/OrderStatusIcon';

import { clearOrder } from '@/state/account';
import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getLocalCancelOrders, getOrderDetails } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';

import { MustBigNumber } from '@/lib/numbers';
import { isMarketOrderType, isOrderStatusClearable } from '@/lib/orders';
import { getMarginModeFromSubaccountNumber } from '@/lib/tradeData';

export const OrderDetailsDialog = ({
  orderId,
  setIsOpen,
}: DialogProps<OrderDetailsDialogProps>) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);
  const localCancelOrders = useAppSelector(getLocalCancelOrders, shallowEqual);

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
    orderFlags,
    orderSide,
    postOnly,
    price,
    reduceOnly,
    totalFilled,
    resources,
    size,
    status,
    stepSizeDecimals,
    subaccountNumber,
    tickSizeDecimals,
    trailingPercent,
    triggerPrice,
    type,
  } = useParameterizedSelector(getOrderDetails, orderId)! ?? {};

  const marginMode = getMarginModeFromSubaccountNumber(subaccountNumber);

  const marginModeLabel =
    marginMode === AbacusMarginMode.Cross
      ? stringGetter({ key: STRING_KEYS.CROSS })
      : stringGetter({ key: STRING_KEYS.ISOLATED });

  const renderOrderPrice = ({
    type: innerType,
    price: innerPrice,
    tickSizeDecimals: innerTickSizeDecimals,
  }: {
    type?: AbacusOrderTypes;
    price?: Nullable<number>;
    tickSizeDecimals: number;
  }) =>
    isMarketOrderType(innerType) ? (
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
        value: <OrderSideTag orderSide={orderSide ?? OrderSide.BUY} />,
      },
      {
        key: 'status',
        label: stringGetter({ key: STRING_KEYS.STATUS }),
        value: (
          <div tw="inlineRow">
            <OrderStatusIcon status={status.rawValue} />
            <span tw="font-small-medium">
              {resources.statusStringKey && stringGetter({ key: resources.statusStringKey })}
            </span>
          </div>
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

  const onClearClick = () => {
    dispatch(clearOrder(orderId));
    setIsOpen?.(false);
  };

  const isShortTermOrder = orderFlags === OrderFlags.SHORT_TERM;
  // we update short term orders to pending status when they are best effort canceled in Abacus
  const isBestEffortCanceled =
    (status === AbacusOrderStatus.Pending && cancelReason != null) ||
    status === AbacusOrderStatus.Canceling;

  const isCancelDisabled = !!isOrderCanceling || (isShortTermOrder && isBestEffortCanceled);

  return (
    <DetailsDialog
      slotIcon={<AssetIcon symbol={asset?.id} tw="text-[1em]" />}
      title={!resources.typeStringKey ? '' : stringGetter({ key: resources.typeStringKey })}
      slotFooter={
        isAccountViewOnly ? null : isOrderStatusClearable(status) ? (
          <Button onClick={onClearClick}>{stringGetter({ key: STRING_KEYS.CLEAR })}</Button>
        ) : (
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
