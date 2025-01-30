import { useCallback, useMemo, useState } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';

import { GROUPING_MULTIPLIER_LIST, GroupingMultiplier } from '@/constants/orderbook';

import { safeAssign } from '@/lib/objectHelpers';

import { useParameterizedSelector } from '../useParameterizedSelector';

export const useCalculateOrderbookData = ({ rowsPerSide }: { rowsPerSide: number }) => {
  const [groupingMultiplier, setGroupingMultiplier] = useState(GroupingMultiplier.ONE);

  const orderbook = useParameterizedSelector(
    BonsaiHelpers.currentMarket.orderbook.createSelectGroupedData,
    groupingMultiplier
  );

  const modifyGroupingMultiplier = useCallback((shouldIncrease: boolean) => {
    setGroupingMultiplier((prev) => {
      const currIdx = GROUPING_MULTIPLIER_LIST.indexOf(prev);
      if (currIdx === -1) return prev;
      const canIncrease = prev !== GroupingMultiplier.THOUSAND;
      const canDecrease = prev !== GroupingMultiplier.ONE;
      if (shouldIncrease && canIncrease) {
        return GROUPING_MULTIPLIER_LIST[currIdx + 1]!;
      }

      if (!shouldIncrease && canDecrease) {
        return GROUPING_MULTIPLIER_LIST[currIdx - 1]!;
      }

      return prev;
    });
  }, []);

  return useMemo(() => {
    const asks = (orderbook?.asks ?? [])
      .map((row, idx: number) =>
        safeAssign(
          {},
          {
            key: `ask-${idx}`,
          },
          row
        )
      )
      .slice(0, rowsPerSide);

    const bids = (orderbook?.bids ?? [])
      .map((row, idx: number) =>
        safeAssign(
          {},
          {
            key: `bid-${idx}`,
          },
          row
        )
      )
      .slice(0, rowsPerSide);

    const spread = orderbook?.spread;
    const spreadPercent = orderbook?.spreadPercent;

    const histogramRange = Math.max(
      Number.isNaN(Number(bids[bids.length - 1]?.depth)) ? 0 : Number(bids[bids.length - 1]?.depth),
      Number.isNaN(Number(asks[asks.length - 1]?.depth)) ? 0 : Number(asks[asks.length - 1]?.depth)
    );

    return {
      asks,
      bids,
      midMarketPrice: orderbook?.midPrice,
      spread,
      spreadPercent,
      histogramRange,
      hasOrderbook: !!orderbook,

      // Orderbook grouping
      groupingMultiplier,
      groupingTickSize: orderbook?.groupingTickSize,
      groupingTickSizeDecimals: orderbook?.groupingTickSizeDecimals,
      modifyGroupingMultiplier,
    };
  }, [rowsPerSide, orderbook, groupingMultiplier, modifyGroupingMultiplier]);
};
