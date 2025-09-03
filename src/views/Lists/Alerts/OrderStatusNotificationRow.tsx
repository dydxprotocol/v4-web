import { BonsaiHelpers } from '@/bonsai/ontology';
import { OrderStatus } from '@/bonsai/types/summaryTypes';
import { sum } from 'lodash';

import { STRING_KEYS } from '@/constants/localization';
import { LocalPlaceOrderData, PlaceOrderStatuses } from '@/constants/trade';
import { IndexerOrderSide } from '@/types/indexer/indexerApiGen';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { OrderStatusIconNew } from '@/views/OrderStatusIcon';

import {
  getAverageFillPriceForOrder,
  getFillsForOrderId,
  getOrderByClientId,
} from '@/state/accountSelectors';

import { assertNever } from '@/lib/assertNever';
import { calc } from '@/lib/do';
import {
  getIndexerFillTypeStringKey,
  getIndexerOrderSideStringKey,
  getIndexerOrderTypeStringKey,
} from '@/lib/enumToStringKeyHelpers';
import { AttemptNumber, MustBigNumber } from '@/lib/numbers';
import { isPresent, orEmptyObj } from '@/lib/typeUtils';

import { DateContent } from '../DateContent';
import { TradeNotificationRow } from './TradeNotificationRow';

export const OrderStatusNotificationRow = ({
  className,
  timestamp,
  localPlaceOrder,
  isUnseen,
}: {
  className?: string;
  timestamp: number;
  localPlaceOrder: LocalPlaceOrderData;
  isUnseen: boolean;
}) => {
  const stringGetter = useStringGetter();

  const order = useAppSelectorWithArgs(getOrderByClientId, localPlaceOrder.clientId);
  const fills = useAppSelectorWithArgs(getFillsForOrderId, order?.id ?? localPlaceOrder.orderId);
  const { equityTiersLearnMore } = useURLConfigs();

  const marketData = useAppSelectorWithArgs(
    BonsaiHelpers.markets.selectMarketSummaryById,
    localPlaceOrder.cachedData.marketId
  );

  const averageFillPrice = useAppSelectorWithArgs(
    getAverageFillPriceForOrder,
    order?.id ?? localPlaceOrder.orderId
  );

  const { assetId } = orEmptyObj(marketData);
  const assetInfo = useAppSelectorWithArgs(BonsaiHelpers.assets.selectAssetInfo, assetId);

  const { logo } = orEmptyObj(assetInfo);
  const { displayableAsset, stepSizeDecimals, tickSizeDecimals } = orEmptyObj(marketData);

  const { slotLeft, slotRight, miniIcon } = calc(() => {
    const indexedOrderStatus = order?.status ?? localPlaceOrder.cachedData.status;
    const submissionStatus = localPlaceOrder.submissionStatus;

    switch (submissionStatus) {
      case PlaceOrderStatuses.Placed:
      case PlaceOrderStatuses.Filled:
      case PlaceOrderStatuses.Canceled:
      case PlaceOrderStatuses.Submitted: {
        if (indexedOrderStatus) {
          if (indexedOrderStatus === OrderStatus.Pending) break;
          const typeStringKey = order?.type && getIndexerOrderTypeStringKey(order.type);

          if (fills.length > 0) {
            const size =
              order?.totalFilled ?? sum(fills.map((f) => AttemptNumber(f.size)).filter(isPresent));
            const sizeBN = MustBigNumber(size);
            const shouldCompact = (stepSizeDecimals ?? 0) >= 0 && sizeBN.gte(100_000);
            const firstFill = fills.at(0);
            const side = firstFill?.side;
            const sideColor =
              side === IndexerOrderSide.BUY ? 'var(--color-positive)' : 'var(--color-negative)';
            const sideString = stringGetter({
              key: side ? getIndexerOrderSideStringKey(side) : '',
            });
            const typeFillStringKey =
              firstFill?.type && getIndexerFillTypeStringKey(firstFill.type);

            return {
              slotLeft: (
                <>
                  <span tw="overflow-hidden text-ellipsis whitespace-nowrap leading-[1rem] text-color-text-2 font-base-book">
                    <span css={{ color: sideColor }}>{sideString}</span>{' '}
                    <Output
                      tw="inline"
                      type={shouldCompact ? OutputType.CompactNumber : OutputType.Number}
                      value={size}
                      fractionDigits={stepSizeDecimals}
                    />{' '}
                    {displayableAsset}
                  </span>

                  <DateContent time={timestamp} />
                </>
              ),
              slotRight: (
                <>
                  <span tw="inline text-color-text-0 font-mini-book">
                    {stringGetter({ key: typeStringKey ?? typeFillStringKey ?? '' })}
                  </span>

                  <Output
                    tw="inline text-color-text-2 font-small-book"
                    withSubscript
                    type={OutputType.Fiat}
                    value={averageFillPrice ?? order?.price}
                    fractionDigits={tickSizeDecimals}
                    slotLeft={<span>@ </span>}
                  />
                </>
              ),
              miniIcon: null,
            };
          }

          const size = order?.size;
          const sizeBN = MustBigNumber(size);
          const shouldCompact = (stepSizeDecimals ?? 0) >= 1 && sizeBN.gte(100_000);
          const side = order?.side;
          const sideColor =
            side === IndexerOrderSide.BUY ? 'var(--color-positive)' : 'var(--color-negative)';
          const sideString = stringGetter({
            key: side ? getIndexerOrderSideStringKey(side) : '',
          });
          const cancelReason = order?.removalReason
            ? stringGetter({
                key: (STRING_KEYS as any)[order.removalReason],
              })
            : '';

          return {
            slotLeft: (
              <>
                <span tw="overflow-hidden text-ellipsis whitespace-nowrap leading-[1rem] text-color-text-2 font-base-book">
                  <span css={{ color: sideColor }}>{sideString}</span>{' '}
                  <Output
                    tw="inline"
                    type={shouldCompact ? OutputType.CompactNumber : OutputType.Number}
                    value={size}
                    fractionDigits={stepSizeDecimals}
                  />{' '}
                  {displayableAsset}
                </span>

                <span tw="leading-[0]">
                  {cancelReason ? (
                    <span tw="text-color-text-0 font-tiny-book">{cancelReason}</span>
                  ) : (
                    <>
                      <Output
                        tw="text-color-text-0 font-tiny-book"
                        type={OutputType.Time}
                        value={timestamp}
                      />{' '}
                      <Output
                        tw="text-color-text-0 font-tiny-book"
                        type={OutputType.Date}
                        value={timestamp}
                      />
                    </>
                  )}
                </span>
              </>
            ),

            slotRight: (
              <>
                <span tw="inline text-color-text-0 font-mini-book">
                  {stringGetter({ key: typeStringKey ?? '' })}
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

            miniIcon: (
              <OrderStatusIconNew
                status={indexedOrderStatus}
                tw="absolute right-[-3px] top-[-2px] size-[0.875rem] min-h-[0.875rem] min-w-[0.875rem] rounded-[50%] border-2 border-solid border-color-layer-2 bg-color-layer-2"
              />
            ),
          };
        }

        return {
          slotLeft: null,
          slotRight: null,
          miniIcon: null,
        };
      }

      case PlaceOrderStatuses.FailedSubmission: {
        if (localPlaceOrder.errorParams) {
          return {
            slotLeft: (
              <>
                <span tw="overflow-hidden text-ellipsis whitespace-nowrap leading-[1rem] text-color-text-2 font-base-book">
                  <span>{stringGetter({ key: STRING_KEYS.ERROR })}</span>
                </span>

                <span tw="text-color-text-1 font-mini-book">
                  {stringGetter({
                    key: localPlaceOrder.errorParams.errorStringKey,
                    params: {
                      EQUITY_TIER_LEARN_MORE: (
                        <Link
                          href={equityTiersLearnMore}
                          onClick={(e) => e.stopPropagation()}
                          isInline
                        >
                          {stringGetter({ key: STRING_KEYS.LEARN_MORE_ARROW })}
                        </Link>
                      ),
                    },
                    fallback: localPlaceOrder.errorParams.errorMessage ?? '',
                  })}
                </span>
              </>
            ),
            slotRight: null,
            miniIcon: (
              <Icon
                iconName={IconName.Warning}
                tw="absolute right-[-3px] top-[-2px] size-[0.875rem] min-w-[0.875rem] rounded-[50%] border-2 border-solid border-color-layer-2 text-color-warning"
              />
            ),
          };
        }

        return {
          slotLeft: null,
          slotRight: null,
          miniIcon: null,
        };
      }
      default:
        assertNever(submissionStatus);
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
      logo={logo}
      miniIcon={miniIcon}
      slotLeft={slotLeft}
      slotRight={slotRight}
      isUnseen={isUnseen}
    />
  );
};
