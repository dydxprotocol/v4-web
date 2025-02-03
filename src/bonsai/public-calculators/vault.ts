import { groupBy, keyBy, orderBy } from 'lodash';

import { timeUnits } from '@/constants/time';
import {
  IndexerMegavaultHistoricalPnlResponse,
  IndexerMegavaultPositionResponse,
  IndexerVaultHistoricalPnl,
  IndexerVaultPosition,
  IndexerVaultsHistoricalPnlResponse,
} from '@/types/indexer/indexerApiGen';

import { MaybeBigNumber, MaybeNumber, MustNumber } from '@/lib/numbers';
import { isPresent } from '@/lib/typeUtils';

import { calculateParentSubaccountSummary } from '../calculators/subaccount';
import { MarketInfo, MarketsInfo } from '../types/summaryTypes';

export interface VaultDetails {
  totalValue?: number;
  thirtyDayReturnPercent?: number;
  history?: VaultHistoryEntry[];
}

export interface VaultPositions {
  positions?: VaultPosition[];
}

export interface VaultHistoryEntry {
  date?: number;
  equity?: number;
  totalPnl?: number;
}

export interface VaultPosition {
  marketId?: string;
  marginUsdc?: number;
  equityUsdc?: number;
  currentLeverageMultiple?: number;
  currentPosition?: CurrentPosition;
  thirtyDayPnl?: ThirtyDayPnl;
}

export interface CurrentPosition {
  asset?: number;
  usdc?: number;
}

export interface ThirtyDayPnl {
  percent?: number;
  absolute?: number;
  sparklinePoints?: number[];
}

export function calculateVaultSummary(
  historicals?: IndexerMegavaultHistoricalPnlResponse[],
  dataCutoffMs: number = 0
): VaultDetails | undefined {
  const combinedPnls = historicals?.flatMap((h) => h.megavaultPnl) ?? [];

  if (combinedPnls.length === 0) {
    return undefined;
  }

  const vaultOfVaultsPnl = orderBy(
    combinedPnls,
    [(entry) => new Date(entry.createdAt).getTime()],
    ['desc']
  );

  const history = vaultOfVaultsPnl
    .map((entry) => {
      const createdAt = new Date(entry.createdAt).getTime();

      return {
        date: createdAt,
        equity: MaybeNumber(entry.equity) ?? 0,
        totalPnl: MaybeNumber(entry.totalPnl) ?? 0,
      };
    })
    .filter((entry) => entry.date >= dataCutoffMs);

  const latestEntry = history[0];
  if (!latestEntry) return undefined;

  const latestTime = latestEntry.date;

  const thirtyDaysAgoTime = latestTime - 30 * timeUnits.day;

  const thirtyDaysAgoEntry =
    history.find((entry) => entry.date <= thirtyDaysAgoTime) ?? history.at(-1)!; // we know length > 0 at this point

  const totalValue = latestEntry.equity;
  const latestTotalPnl = latestEntry.totalPnl;
  const thirtyDaysAgoTotalPnl = thirtyDaysAgoEntry.totalPnl;

  const pnlDifference = latestTotalPnl - thirtyDaysAgoTotalPnl;
  const timeDifferenceMs = latestEntry.date - thirtyDaysAgoEntry.date;

  const thirtyDayReturnPercent = totalValue !== 0 ? pnlDifference / totalValue : 0;

  return {
    totalValue,
    thirtyDayReturnPercent:
      timeDifferenceMs > 0 ? (thirtyDayReturnPercent * 365 * timeUnits.day) / timeDifferenceMs : 0,
    history,
  };
}

export function calculateVaultPositions(
  positions?: IndexerMegavaultPositionResponse,
  histories?: IndexerVaultsHistoricalPnlResponse,
  markets?: MarketsInfo,
  vaultTvl?: number
): VaultPositions | undefined {
  if (positions?.positions == null) {
    return undefined;
  }

  const historiesMap =
    histories?.vaultsPnl != null ? keyBy(histories.vaultsPnl, (t) => t.ticker) : {};

  let processedPositions = positions.positions
    .map((pos) => calculateVaultPosition(pos, historiesMap[pos.ticker], markets?.[pos.ticker]))
    .filter(isPresent);

  processedPositions = maybeAddUsdcRow(processedPositions, vaultTvl);

  return {
    positions: processedPositions,
  };
}

function maybeAddUsdcRow(positions: VaultPosition[], vaultTvl?: number): VaultPosition[] {
  if (vaultTvl != null) {
    const usdcTotal = vaultTvl - positions.reduce((sum, pos) => sum + (pos.marginUsdc ?? 0), 0);

    return [
      ...positions,
      {
        marketId: 'UNALLOCATEDUSDC-USD',
        marginUsdc: usdcTotal,
        equityUsdc: usdcTotal,
        currentLeverageMultiple: 1.0,
        currentPosition: {
          asset: usdcTotal,
          usdc: usdcTotal,
        },
        thirtyDayPnl: {
          percent: 0.0,
          absolute: 0.0,
          sparklinePoints: [],
        },
      },
    ];
  }
  return positions;
}

function calculateVaultPosition(
  position: IndexerVaultPosition,
  history?: IndexerVaultHistoricalPnl,
  market?: MarketInfo
): VaultPosition | undefined {
  const thirtyDayPnl = calculateThirtyDayPnl(history);

  const summary = calculateParentSubaccountSummary(
    {
      address: '',
      parentSubaccount: 0,
      childSubaccounts: {
        '0': {
          address: '',
          subaccountNumber: 0,
          assetPositions:
            // Indexer types lying again, this IS possible
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            position.assetPosition != null
              ? {
                  [position.assetPosition.symbol]: position.assetPosition,
                }
              : {},
          openPerpetualPositions:
            position.perpetualPosition != null
              ? {
                  [position.perpetualPosition.market]: position.perpetualPosition,
                }
              : {},
        },
      },
    },
    market != null ? { [market.ticker]: market } : {}
  );

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const hasBothPositions = position.assetPosition != null && position.perpetualPosition != null;
  return {
    marketId: position.ticker,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    marginUsdc: position.assetPosition == null ? undefined : MaybeNumber(summary.equity),
    currentLeverageMultiple: hasBothPositions
      ? MustNumber(summary.leverage) * (MustNumber(position.perpetualPosition?.size) < 0 ? -1 : 1)
      : undefined,
    currentPosition: {
      asset: MaybeNumber(position.perpetualPosition?.size),
      usdc: MaybeBigNumber(position.perpetualPosition?.size)
        ?.times(market?.oraclePrice ?? 0)
        .abs()
        .toNumber(),
    },
    thirtyDayPnl,
  };
}

function calculateThirtyDayPnl(
  vaultHistoricalPnl?: IndexerVaultHistoricalPnl
): ThirtyDayPnl | undefined {
  const historicalPnl = vaultHistoricalPnl?.historicalPnl;
  if (historicalPnl == null || historicalPnl.length === 0) {
    return undefined;
  }

  const sortedPnl = orderBy(
    historicalPnl,
    [(entry) => new Date(entry.createdAt).getTime()],
    ['desc']
  );

  const latestEntry = sortedPnl[0]!;
  const latestTime = new Date(latestEntry.createdAt).getTime();
  const thirtyDaysAgoTime = latestTime - 30 * timeUnits.day;

  const thirtyDaysAgoEntry =
    sortedPnl.find((entry) => {
      const time = new Date(entry.createdAt).getTime();
      return time <= thirtyDaysAgoTime;
    }) ?? sortedPnl.at(-1)!;

  const latestTotalPnl = MaybeNumber(latestEntry.totalPnl) ?? 0;
  const thirtyDaysAgoTotalPnl = MaybeNumber(thirtyDaysAgoEntry.totalPnl) ?? 0;
  const absolutePnl = latestTotalPnl - thirtyDaysAgoTotalPnl;

  const thirtyDaysAgoEquity = MaybeNumber(thirtyDaysAgoEntry.equity) ?? 0;
  const percentPnl = thirtyDaysAgoEquity !== 0 ? absolutePnl / thirtyDaysAgoEquity : 0;

  const validPnls = sortedPnl
    .filter((p) => new Date(p.createdAt).getTime() >= thirtyDaysAgoTime)
    .map((entry) => {
      const time = new Date(entry.createdAt).getTime();
      return {
        day: Math.floor(time / timeUnits.day),
        value: MaybeNumber(entry.totalPnl) ?? 0,
      };
    });

  const groupedByDay = groupBy(validPnls, (d) => d.day);
  const sparklinePoints = orderBy(
    Object.entries(groupedByDay),
    [([day]) => Number(day)],
    ['asc']
  ).map(([_, entries]) => entries[0]!.value);

  return {
    percent: percentPnl,
    absolute: absolutePnl,
    sparklinePoints,
  };
}
