import { useMemo } from 'react';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { formatDateOutput, OutputType } from '@/components/Output';
import { PnlDatum } from '@/views/charts/PnlChart';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { MustBigNumber } from '@/lib/numbers';
import { Nullable } from '@/lib/typeUtils';

import { useStringGetter } from '../useStringGetter';

export const usePortfolioValues = ({
  equity,
  visibleData,
  activeDatum,
}: {
  equity?: Nullable<number>;
  visibleData?: PnlDatum[];
  activeDatum?: PnlDatum;
}) => {
  const stringGetter = useStringGetter();
  const selectedLocale = useAppSelector(getSelectedLocale);

  const accountValueLabel = useMemo(
    () =>
      activeDatum
        ? formatDateOutput(activeDatum.createdAt, OutputType.DateTime, {
            selectedLocale,
            dateFormat: 'medium',
          })
        : stringGetter({ key: STRING_KEYS.TRADING_ACCOUNT }),
    [activeDatum, selectedLocale, stringGetter]
  );

  const accountEquity = activeDatum ? activeDatum.equity : equity;

  const earliestVisibleDatum = visibleData?.[0];
  const latestVisibleDatum = visibleData?.[visibleData.length - 1];

  const pnl = useMemo(() => {
    let pnlDiff;
    let pnlDiffPercent;
    if (earliestVisibleDatum && latestVisibleDatum) {
      const fullTimeframeDiff = MustBigNumber(latestVisibleDatum.totalPnl).minus(
        MustBigNumber(earliestVisibleDatum.totalPnl)
      );

      pnlDiff = activeDatum
        ? MustBigNumber(activeDatum.totalPnl).minus(earliestVisibleDatum.totalPnl)
        : fullTimeframeDiff;

      pnlDiffPercent = pnlDiff.div(earliestVisibleDatum.equity);

      return {
        pnlDiff: pnlDiff.toFixed(4),
        pnlDiffPercent: pnlDiffPercent.toString(),
        sign: fullTimeframeDiff.gte(0) ? NumberSign.Positive : NumberSign.Negative,
      };
    }
    return undefined;
  }, [activeDatum, earliestVisibleDatum, latestVisibleDatum]);

  return {
    accountValueLabel,
    accountEquity,
    pnlDiff: pnl?.pnlDiff,
    pnlDiffPercent: pnl?.pnlDiffPercent,
    pnlDiffSign: pnl?.sign ?? NumberSign.Neutral,
  };
};
