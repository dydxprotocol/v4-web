import { useMemo } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { SubaccountFill, SubaccountOrder } from '@/bonsai/types/summaryTypes';

import { IndexerOrderSide } from '@/types/indexer/indexerApiGen';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Output, OutputType } from '@/components/Output';

import { getAssetFromMarketId } from '@/lib/assetUtils';
import { mapIfPresent } from '@/lib/do';
import {
  getIndexerOrderSideStringKey,
  getIndexerOrderTypeStringKey,
} from '@/lib/enumToStringKeyHelpers';
import { MustBigNumber } from '@/lib/numbers';
import { getAverageFillPrice } from '@/lib/orders';
import { orEmptyObj } from '@/lib/typeUtils';

import { DateContent } from '../DateContent';
import { TradeNotificationRow } from './TradeNotificationRow';

export const OrderNotificationRow = ({
  className,
  subaccountOrder,
  relevantFills,
  timestamp,
  isUnseen,
}: {
  className?: string;
  subaccountOrder: SubaccountOrder;
  relevantFills: SubaccountFill[];
  timestamp: number;
  isUnseen?: boolean;
}) => {
  const stringGetter = useStringGetter();
  const { marketId, side, price, type, size } = subaccountOrder;

  const marketData = useAppSelectorWithArgs(
    BonsaiHelpers.markets.selectMarketSummaryById,
    marketId
  );

  const assetInfo = useAppSelectorWithArgs(
    BonsaiHelpers.assets.selectAssetInfo,
    mapIfPresent(marketId, getAssetFromMarketId)
  );

  const { logo } = orEmptyObj(assetInfo);
  const { displayableAsset, stepSizeDecimals, tickSizeDecimals } = orEmptyObj(marketData);
  const sizeBN = MustBigNumber(size);
  const shouldCompact = (stepSizeDecimals ?? 0) >= 0 && sizeBN.gte(100_000);

  const { avgFillPrice, sideString, sideColor, notionalFill } = useMemo(() => {
    const priceBN = MustBigNumber(price);
    const notionalFillBN = MustBigNumber(size).times(priceBN);

    return {
      sideString: stringGetter({ key: getIndexerOrderSideStringKey(side) }),
      sideColor: side === IndexerOrderSide.BUY ? 'var(--color-positive)' : 'var(--color-negative)',
      typeString: stringGetter({ key: getIndexerOrderTypeStringKey(type) }),
      notionalFill: notionalFillBN.gt(0) ? notionalFillBN : undefined,
      avgFillPrice: getAverageFillPrice(relevantFills) ?? priceBN,
    };
  }, [side, type, price, relevantFills, size, stringGetter]);

  const miniIcon = (
    <span
      tw="absolute right-[-3px] top-[-2px] size-[0.875rem] min-w-[0.875rem] rounded-[50%] border-2 border-solid border-color-layer-3"
      css={{
        backgroundColor: sideColor,
      }}
    />
  );

  const slotLeft = (
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
  );

  return (
    <TradeNotificationRow
      className={className}
      logo={logo}
      miniIcon={miniIcon}
      slotLeft={slotLeft}
      slotRight={
        <>
          <Output tw="inline font-mini-book" type={OutputType.Fiat} value={notionalFill} />
          <Output
            tw="inline text-color-text-2 font-small-book"
            withSubscript
            type={OutputType.Fiat}
            value={avgFillPrice}
            fractionDigits={tickSizeDecimals}
            slotLeft={<span>@ </span>}
          />
        </>
      }
      isUnseen={isUnseen}
    />
  );
};
