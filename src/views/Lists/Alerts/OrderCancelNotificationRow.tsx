import { BonsaiHelpers } from '@/bonsai/ontology';
import { OrderStatus } from '@/bonsai/types/summaryTypes';

import { STRING_KEYS } from '@/constants/localization';
import { CancelOrderStatuses, LocalCancelOrderData } from '@/constants/trade';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { OrderStatusIconNew } from '@/views/OrderStatusIcon';

import { getOrderById } from '@/state/accountSelectors';

import { calc } from '@/lib/do';
import { getIndexerOrderTypeStringKey } from '@/lib/enumToStringKeyHelpers';
import { orEmptyObj } from '@/lib/typeUtils';

import { DateContent } from '../DateContent';
import { TradeNotificationRow } from './TradeNotificationRow';

export const OrderCancelNotificationRow = ({
  className,
  localCancel,
  isUnseen,
  timestamp,
}: {
  className?: string;
  localCancel: LocalCancelOrderData;
  isUnseen: boolean;
  timestamp: number;
}) => {
  const stringGetter = useStringGetter();
  const order = useAppSelectorWithArgs(getOrderById, localCancel.orderId);
  const { logo: logoUrl, tickSizeDecimals } = orEmptyObj(
    useAppSelectorWithArgs(
      BonsaiHelpers.markets.selectMarketSummaryById,
      localCancel.cachedData.marketId
    )
  );

  const orderTypeKey = getIndexerOrderTypeStringKey(
    order?.type ?? localCancel.cachedData.orderType
  );
  const indexedOrderStatus = order?.status;
  const cancelStatus = localCancel.submissionStatus;

  const { slotLeft, slotRight, miniIcon } = calc(() => {
    const isPartiallyCanceled = indexedOrderStatus === OrderStatus.PartiallyCanceled;
    const isCancelFinalized = indexedOrderStatus === OrderStatus.Canceled || isPartiallyCanceled;

    if (cancelStatus === CancelOrderStatuses.Canceled || isCancelFinalized) {
      const orderStatusStringKey = isPartiallyCanceled
        ? STRING_KEYS.PARTIALLY_FILLED
        : STRING_KEYS.CANCELED;

      return {
        miniIcon: (
          <OrderStatusIconNew
            status={OrderStatus.Canceled}
            tw="absolute right-[-3px] top-[-2px] size-[0.875rem] min-h-[0.875rem] min-w-[0.875rem] rounded-[50%] border-2 border-solid border-color-layer-2 bg-color-layer-2"
          />
        ),
        slotLeft: (
          <>
            <span tw="overflow-hidden text-ellipsis whitespace-nowrap leading-[1rem] text-color-text-2 font-base-book">
              <span tw="text-color-negative">{stringGetter({ key: orderStatusStringKey })}</span>
            </span>

            <DateContent time={timestamp} />
          </>
        ),
        slotRight: (
          <>
            <span tw="inline text-color-text-0 font-mini-book">
              {stringGetter({ key: orderTypeKey })}
            </span>

            <Output
              tw="inline text-color-text-2 font-small-book"
              withSubscript
              type={OutputType.Fiat}
              value={order?.price}
              fractionDigits={tickSizeDecimals}
              slotLeft={<span>@ </span>}
            />
          </>
        ),
      };
    }

    if (localCancel.errorParams) {
      return {
        miniIcon: (
          <Icon
            iconName={IconName.Warning}
            tw="absolute right-[-3px] top-[-2px] size-[0.875rem] min-w-[0.875rem] rounded-[50%] border-2 border-solid border-color-layer-2 text-color-warning"
          />
        ),
        slotLeft: (
          <>
            <span tw="overflow-hidden text-ellipsis whitespace-nowrap leading-[1rem] text-color-text-2 font-base-book">
              <span>{stringGetter({ key: STRING_KEYS.ERROR })}</span>
            </span>

            <span tw="text-color-text-1 font-mini-book">
              {stringGetter({
                key: localCancel.errorParams.errorStringKey,
                fallback: localCancel.errorParams.errorMessage ?? '',
              })}
            </span>
          </>
        ),
        slotRight: null,
      };
    }

    return {
      slotLeft: null,
      slotRight: null,
      miniIcon: null,
    };
  });

  return (
    <TradeNotificationRow
      className={className}
      logo={logoUrl}
      miniIcon={miniIcon}
      slotLeft={slotLeft}
      slotRight={slotRight}
      isUnseen={isUnseen}
    />
  );
};
