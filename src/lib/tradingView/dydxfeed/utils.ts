import { SubaccountFill } from '@/bonsai/types/summaryTypes';
import BigNumber from 'bignumber.js';
import { sum } from 'lodash';
import { Mark, MarkCustomColor, ResolutionString } from 'public/tradingview/charting_library';

import { RESOLUTION_TO_INTERVAL_MS } from '@/constants/candles';
import { STRING_KEYS, StringGetterFunction, SupportedLocales } from '@/constants/localization';
import { ThemeColorBase } from '@/constants/styles/colors';
import { IndexerOrderSide } from '@/types/indexer/indexerApiGen';

import { formatNumberOutput, OutputType } from '@/components/Output';

import { RootStore } from '@/state/_store';
import { getFillDetails } from '@/state/accountSelectors';

import { MustBigNumber } from '@/lib/numbers';
import { getAverageFillPrice } from '@/lib/orders';

/**
 * @description Converts times in ms to the appropriate bar time (in seconds)
 * For example, if the starting time = 5000ms, interval = 10,000ms, a value of 26,000ms would
 * be grouped into the bar at 25,000ms = 25s
 */
export function getBarTime(
  chartStartTimeMs: number,
  fillTimeMs: number,
  resolution: ResolutionString
): number | undefined {
  const intervalMs = RESOLUTION_TO_INTERVAL_MS[resolution]!;

  const [startBn, intervalSizeBn, fillTimeBn] = [
    BigNumber(chartStartTimeMs),
    BigNumber(intervalMs),
    BigNumber(fillTimeMs),
  ];
  const numIntervalsBetween = fillTimeBn.minus(startBn).dividedToIntegerBy(intervalSizeBn);
  return startBn
    .plus(numIntervalsBetween.multipliedBy(intervalSizeBn))
    .dividedToIntegerBy(1000)
    .toNumber();
}

export const getMarkForOrderFills = (
  store: RootStore,
  orderFills: SubaccountFill[],
  stepSizeDecimals: number,
  orderId: string,
  barStartMs: number,
  resolution: ResolutionString,
  stringGetter: StringGetterFunction,
  localeSeparators: { group?: string; decimal?: string },
  selectedLocale: SupportedLocales,
  theme: ThemeColorBase
): Mark => {
  const formattedAveragePrice = formatNumberOutput(
    getAverageFillPrice(orderFills),
    OutputType.Fiat,
    {
      decimalSeparator: localeSeparators.decimal,
      groupSeparator: localeSeparators.group,
      selectedLocale,
    }
  );
  const formattedSize = formatNumberOutput(
    sum(orderFills.map((fill) => MustBigNumber(fill.size).toNumber())),
    OutputType.Asset,
    {
      fractionDigits: stepSizeDecimals,
      decimalSeparator: localeSeparators.decimal,
      groupSeparator: localeSeparators.group,
      selectedLocale,
    }
  );
  const fill = orderFills[0]!;
  const fillDetails = getFillDetails()(store.getState(), fill.id ?? '');

  const textParams = {
    ASSET_SIZE: formattedSize,
    ASSET: fillDetails?.marketSummary?.displayableAsset,
    PRICE: formattedAveragePrice,
  };

  const text = stringGetter({
    key:
      fill.side === IndexerOrderSide.BUY
        ? STRING_KEYS.BUY_MARK_TOOLTIP
        : STRING_KEYS.SELL_MARK_TOOLTIP,
    params: textParams,
  }) as string;

  const color: MarkCustomColor =
    fill.side === IndexerOrderSide.BUY
      ? {
          border: theme.positive,
          background: theme.positive,
        }
      : { border: theme.negative, background: theme.negative };

  return {
    id: orderId,
    time: getBarTime(barStartMs, new Date(fill.createdAt ?? 0).getTime(), resolution) ?? 0,
    minSize: 16,
    text,
    labelFontColor: theme.textPrimary,
    color,
    label: fill.side === IndexerOrderSide.BUY ? 'B' : 'S',
  };
};
