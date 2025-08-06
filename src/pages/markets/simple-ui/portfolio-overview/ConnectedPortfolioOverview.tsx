import { useMemo, useState } from 'react';

import { BonsaiCore, BonsaiHooks } from '@/bonsai/ontology';
import { TooltipContextType } from '@visx/xychart';
import { shallowEqual } from 'react-redux';

import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';
import { timeUnits } from '@/constants/time';

import { usePortfolioValues } from '@/hooks/PortfolioValues/usePortfolioValues';
import { useNow } from '@/hooks/useNow';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { MarginUsageTag } from '@/components/MarginUsageTag';
import { Output, OutputType } from '@/components/Output';
import { SimpleUiDropdownMenu } from '@/components/SimpleUiDropdownMenu';
import { WithTooltip } from '@/components/WithTooltip';
import { PnlDatum } from '@/views/charts/PnlChart';

import { getSubaccountId } from '@/state/accountInfoSelectors';
import { getSubaccount } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { formatRelativeTime } from '@/lib/dateTime';
import { isTruthy } from '@/lib/isTruthy';
import { orEmptyObj } from '@/lib/typeUtils';

import SimplePnlChart, { getMsForPeriod, HistoricalPnlPeriod, PnlSide } from './SimplePnlChart';

export const ConnectedPortfolioOverview = ({ className }: { className?: string }) => {
  const selectedLocale = useAppSelector(getSelectedLocale);
  const now = useNow({ intervalMs: timeUnits.minute });
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  // Data
  const {
    equity: equityBN,
    freeCollateral,
    marginUsage,
  } = orEmptyObj(useAppSelector(getSubaccount, shallowEqual));
  const rawPnlData = BonsaiHooks.useParentSubaccountHistoricalPnls().data ?? EMPTY_ARR;
  const status = useAppSelector(BonsaiCore.account.parentSubaccountSummary.loading);
  const subaccount = useAppSelector(BonsaiCore.account.parentSubaccountSummary.data);
  const isLoadingSubaccount = status === 'pending' && subaccount == null;
  const isLoadingPnl =
    BonsaiHooks.useParentSubaccountHistoricalPnls().status === 'pending' && rawPnlData.length === 0;
  const subaccountId = useAppSelector(getSubaccountId, shallowEqual);

  // UI
  const [visibleData, setVisibleData] = useState<PnlDatum[]>();
  const [tooltipContext, setTooltipContext] = useState<TooltipContextType<PnlDatum>>();
  const [selectedPeriod, setSelectedPeriod] = useState<HistoricalPnlPeriod>(
    HistoricalPnlPeriod.Period7d
  );

  const isChartLoading = isLoadingSubaccount || isLoadingPnl;
  const earliestTick = rawPnlData.at(0);
  const latestTick = rawPnlData.at(-1);
  const earliestCreatedAt = earliestTick?.createdAtMilliseconds;
  const latestCreatedAt = latestTick?.createdAtMilliseconds;

  const { accountEquity, pnlDiff, pnlDiffPercent, pnlDiffSign } = usePortfolioValues({
    equity: equityBN?.toNumber(),
    activeDatum: tooltipContext?.tooltipData?.nearestDatum?.datum,
    visibleData,
  });

  const equity = equityBN?.toNumber();

  const periodDropdownItems = useMemo(() => {
    return [
      HistoricalPnlPeriod.Period1d,
      HistoricalPnlPeriod.Period7d,
      HistoricalPnlPeriod.Period30d,
      HistoricalPnlPeriod.Period90d,
    ].map((period) => ({
      value: period,
      active: selectedPeriod === period,
      label: formatRelativeTime(getMsForPeriod(period, earliestCreatedAt, latestCreatedAt, false), {
        locale: selectedLocale,
        relativeToTimestamp: 0,
        largestUnit: 'day',
      }),
      onSelect: () => setSelectedPeriod(period),
    }));
  }, [earliestCreatedAt, latestCreatedAt, selectedLocale, selectedPeriod]);

  const data = useMemo(
    () =>
      latestTick
        ? [
            ...rawPnlData,
            equity && {
              createdAtMilliseconds: now,
              equity,
              totalPnl: equity - latestTick.equity + latestTick.totalPnl,
            },
          ]
            .filter(isTruthy)
            .map(
              (datum): PnlDatum => ({
                id: datum.createdAtMilliseconds,
                subaccountId: subaccountId ?? 0,
                equity: Number(datum.equity),
                totalPnl: Number(datum.totalPnl),
                createdAt: new Date(datum.createdAtMilliseconds).valueOf(),
                side: {
                  [-1]: PnlSide.Loss,
                  0: PnlSide.Flat,
                  1: PnlSide.Profit,
                }[Math.sign(datum.equity)]!,
              })
            )
        : [],
    [rawPnlData, equity, now, latestTick, subaccountId]
  );

  const portfolioOverviewValues = (
    <div tw="flexColumn absolute left-1.25 top-1.25 gap-0.125">
      <Output
        tw="text-color-text-2 font-extra-large-bold"
        value={accountEquity}
        type={OutputType.Fiat}
        isLoading={isLoadingSubaccount}
      />
      <div tw="row gap-0.5 font-small-book">
        <Output
          css={{
            color: {
              [NumberSign.Positive]: 'var(--color-positive)',
              [NumberSign.Negative]: 'var(--color-negative)',
              [NumberSign.Neutral]: 'var(--color-text-1)',
            }[pnlDiffSign],
          }}
          value={pnlDiff ?? null}
          type={OutputType.Fiat}
          isLoading={isChartLoading}
          slotRight={
            pnlDiffPercent && (
              <span tw="ml-0.5">
                (<Output tw="inline" value={pnlDiffPercent} type={OutputType.Percent} />)
              </span>
            )
          }
        />

        {!isChartLoading && (
          <SimpleUiDropdownMenu tw="pointer-events-auto rounded-0.25" items={periodDropdownItems}>
            <Button
              shape={ButtonShape.Rectangle}
              size={ButtonSize.XXSmall}
              css={{
                '--button-textColor': 'var(--color-text-2)',
              }}
            >
              {formatRelativeTime(
                getMsForPeriod(selectedPeriod, earliestCreatedAt, latestCreatedAt, false),
                {
                  locale: selectedLocale,
                  relativeToTimestamp: 0,
                  largestUnit: 'day',
                }
              )}
            </Button>
          </SimpleUiDropdownMenu>
        )}
      </div>
    </div>
  );

  const hasNoEquity = equityBN != null && equityBN.lt(1);
  const portfolioBuyingPowerAndRisk = (
    <div tw="row absolute bottom-1 left-1.25 right-1.25 justify-between gap-0.125 font-small-book">
      {hasNoEquity ? (
        <div tw="flexColumn h-full w-full items-center justify-center gap-0.5 px-1.25 text-center text-color-text-0">
          {stringGetter({ key: STRING_KEYS.NO_FUNDS })}
          <Button
            action={ButtonAction.Primary}
            slotLeft={<Icon iconName={IconName.Deposit2} />}
            onClick={() => dispatch(openDialog(DialogTypes.Deposit2({})))}
            tw="w-full"
          >
            {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
          </Button>
        </div>
      ) : (
        <>
          <div tw="row gap-0.25">
            <WithTooltip tooltip="buying-power-simple">
              <span tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.BUYING_POWER })}:</span>
            </WithTooltip>
            <Output
              value={freeCollateral?.times(50)}
              type={OutputType.Fiat}
              isLoading={isLoadingSubaccount}
            />
          </div>
          {!isLoadingSubaccount && <MarginUsageTag marginUsage={marginUsage} />}
        </>
      )}
    </div>
  );

  return (
    <div
      tw="flexColumn relative border-b border-l-0 border-r-0 border-t-0 border-solid border-color-border py-1"
      className={className}
    >
      {isChartLoading && !hasNoEquity ? (
        <LoadingSpace id="simple-pnl-chart" />
      ) : (
        <SimplePnlChart
          data={data}
          onTooltipContext={setTooltipContext}
          onVisibleDataChange={setVisibleData}
          selectedLocale={selectedLocale}
          tw="mb-1.25 flex flex-1"
          css={{
            '--pnl-line-color': {
              [NumberSign.Positive]: 'var(--color-positive)',
              [NumberSign.Negative]: 'var(--color-negative)',
              [NumberSign.Neutral]: 'var(--color-text-1)',
            }[pnlDiffSign],
          }}
          selectedPeriod={selectedPeriod}
        />
      )}

      {portfolioOverviewValues}

      {portfolioBuyingPowerAndRisk}
    </div>
  );
};
