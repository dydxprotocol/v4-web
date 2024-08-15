import BigNumber from 'bignumber.js';
import { sum } from 'lodash';
import { Mark, ResolutionString } from 'public/tradingview/charting_library';

import { AbacusOrderSide, SubaccountFills } from '@/constants/abacus';
import { RESOLUTION_TO_INTERVAL_MS } from '@/constants/candles';
import { STRING_KEYS, StringGetterFunction, SupportedLocales } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';

import { formatNumberOutput, OutputType } from '@/components/Output';

import { RootStore } from '@/state/_store';
import { getFillDetails } from '@/state/accountSelectors';

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
  const intervalMs = RESOLUTION_TO_INTERVAL_MS[resolution];

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

function averageFillPrice(fills: SubaccountFills) {
  const totalSize = sum(fills.map((fill) => fill.size * fill.price));
  const size = sum(fills.map((fill) => fill.size));
  return totalSize / size;
}

const MARK_UI_OPTIONS = {
  [AbacusOrderSide.Buy.name]: {
    color: 'blue' as const,
    label: 'B',
  },
  [AbacusOrderSide.Sell.name]: {
    color: 'red' as const,
    label: 'S',
  },
};

export const getMarkForOrderFills = (
  store: RootStore,
  orderFills: SubaccountFills,
  orderId: string,
  barStartMs: number,
  resolution: ResolutionString,
  stringGetter: StringGetterFunction,
  localeSeparators: { group?: string; decimal?: string },
  selectedLocale: SupportedLocales
): Mark => {
  const formattedAveragePrice = formatNumberOutput(averageFillPrice(orderFills), OutputType.Fiat, {
    decimalSeparator: localeSeparators.decimal,
    groupSeparator: localeSeparators.group,
    selectedLocale,
  });
  const formattedSize = formatNumberOutput(
    sum(orderFills.map((fill) => fill.size)),
    OutputType.Asset,
    {
      fractionDigits: TOKEN_DECIMALS,
      decimalSeparator: localeSeparators.decimal,
      groupSeparator: localeSeparators.group,
      selectedLocale,
    }
  );
  const fill = orderFills[0];
  const fillDetails = getFillDetails()(store.getState(), fill.id);

  const textParams = {
    ASSET_SIZE: formattedSize,
    ASSET: fillDetails?.asset?.id,
    PRICE: formattedAveragePrice,
  };

  const text = stringGetter({
    key:
      fill.side.name === AbacusOrderSide.Buy.name
        ? STRING_KEYS.BUY_MARK_TOOLTIP
        : STRING_KEYS.SELL_MARK_TOOLTIP,
    params: textParams,
  }) as string;

  return {
    id: orderId,
    time: getBarTime(barStartMs, fill.createdAtMilliseconds, resolution) ?? 0,
    minSize: 20,
    text,
    labelFontColor: 'white',
    ...MARK_UI_OPTIONS[fill.side.name],
  };
};
