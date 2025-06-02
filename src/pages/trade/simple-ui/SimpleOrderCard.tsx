import { useCallback, useState } from 'react';

import { accountTransactionManager } from '@/bonsai/AccountTransactionSupervisor';
import { isOperationFailure } from '@/bonsai/lib/operationResult';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { OrderStatus, SubaccountOrder } from '@/bonsai/types/summaryTypes';

import { AnalyticsEvents } from '@/constants/analytics';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';
import { ORDER_TYPE_STRINGS } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';
import { TagSize } from '@/components/Tag';

import { useAppSelector } from '@/state/appTypes';

import { track } from '@/lib/analytics/analytics';
import { getIsShortTermOrder } from '@/lib/tradeData';
import { orEmptyObj } from '@/lib/typeUtils';

export const SimpleOrderCard = ({ order }: { order: SubaccountOrder }) => {
  const stringGetter = useStringGetter();
  const [isCanceling, setIsCanceling] = useState(false);
  const { stepSizeDecimals = TOKEN_DECIMALS, tickSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const orderLabel = ORDER_TYPE_STRINGS[order.type].orderTypeKey;
  const orderId = order.id;

  const orderInfo = [
    {
      label: stringGetter({ key: STRING_KEYS.LIMIT_PRICE }),
      value: (
        <Output
          withSubscript
          type={OutputType.Fiat}
          value={order.price}
          fractionDigits={tickSizeDecimals}
        />
      ),
    },
    {
      label: stringGetter({ key: STRING_KEYS.SIZE }),
      value: (
        <Output type={OutputType.Number} value={order.size} fractionDigits={stepSizeDecimals} />
      ),
    },
    {
      label: stringGetter({ key: STRING_KEYS.AMOUNT_FILLED }),
      value: (
        <Output
          type={OutputType.Number}
          value={order.totalFilled}
          fractionDigits={stepSizeDecimals}
        />
      ),
    },
  ];

  const onCancel = useCallback(async () => {
    setIsCanceling(true);
    track(AnalyticsEvents.TradeCancelOrderClick({ orderId }));
    const res = await accountTransactionManager.cancelOrder({ orderId });
    if (isOperationFailure(res)) {
      // we only re-enable if it failed
      setIsCanceling(false);
    }
  }, [orderId]);

  const isShortTermOrder = getIsShortTermOrder(order);
  const isBestEffortCanceled = order.status === OrderStatus.Canceling;
  const isDisabled = isCanceling || (isShortTermOrder && isBestEffortCanceled);

  const cancelButton = isCanceling ? (
    <LoadingSpinner
      id="cancel-order-loader"
      size="16"
      strokeWidth="5"
      tw="row size-1.75 justify-center"
    />
  ) : (
    <IconButton
      tw="text-color-error"
      state={{
        isDisabled,
      }}
      onClick={onCancel}
      iconName={IconName.Close}
    />
  );

  return (
    <div tw="flexColumn gap-[0.125rem] overflow-hidden rounded-1">
      <div tw="row justify-between gap-0.5 bg-color-layer-3 p-0.75">
        <div tw="row gap-0.5">
          <div>{stringGetter({ key: orderLabel })}</div>
          <OrderSideTag size={TagSize.Medium} orderSide={order.side} />
        </div>
        <div tw="row gap-0.5">{cancelButton}</div>
      </div>
      <div tw="grid grid-cols-3 gap-0.5 bg-color-layer-3 p-0.75">
        {orderInfo.map((info) => (
          <div key={info.label}>
            <div tw="text-color-text-0 font-mini-book">{info.label}</div>
            <div tw="text-color-text-2">{info.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
