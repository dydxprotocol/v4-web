import { Key, PropsWithChildren, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters, MarketSorting, type MarketData } from '@/constants/markets';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useMarketsData } from '@/hooks/useMarketsData';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { Table, type ColumnDef } from '@/components/Table';
import { AssetTableCell } from '@/components/Table/AssetTableCell';
import { TableCell } from '@/components/Table/TableCell';
import { NewTag } from '@/components/Tag';
import { TriangleIndicator } from '@/components/TriangleIndicator';

import { MustBigNumber } from '@/lib/numbers';

interface MarketsCompactTableProps {
  className?: string;
  filters?: MarketFilters;
  sorting?: MarketSorting;
}

export const MarketsCompactTable = ({
  className,
  filters,
  sorting,
}: PropsWithChildren<MarketsCompactTableProps>) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const navigate = useNavigate();

  const { filteredMarkets } = useMarketsData(filters);

  const columns = useMemo<ColumnDef<MarketData>[]>(
    () =>
      [
        {
          columnKey: 'market',
          allowsSorting: false,
          label: stringGetter({ key: STRING_KEYS.MARKET }),
          renderCell: ({ asset, effectiveInitialMarginFraction, initialMarginFraction }) => (
            <AssetTableCell
              stacked
              asset={asset}
              configs={{ effectiveInitialMarginFraction, initialMarginFraction }}
            />
          ),
        },
        {
          columnKey: 'oraclePrice',
          allowsSorting: false,
          label: stringGetter({ key: STRING_KEYS.ORACLE_PRICE }),
          renderCell: ({
            oraclePrice,
            priceChange24H,
            priceChange24HPercent,
            tickSizeDecimals,
          }) => (
            <TableCell stacked>
              <Output
                withBaseFont
                withSubscript
                type={OutputType.Fiat}
                value={oraclePrice}
                fractionDigits={tickSizeDecimals}
                tw="text-color-text-1 font-small-medium"
              />
              <$TabletPriceChange>
                {!priceChange24H ? (
                  <Output type={OutputType.Fiat} value={null} />
                ) : (
                  <>
                    {priceChange24H > 0 && (
                      <TriangleIndicator value={MustBigNumber(priceChange24H)} />
                    )}
                    <$Output
                      type={OutputType.Percent}
                      value={MustBigNumber(priceChange24HPercent).abs()}
                      isPositive={MustBigNumber(priceChange24HPercent).gt(0)}
                      isNegative={MustBigNumber(priceChange24HPercent).isNegative()}
                    />
                  </>
                )}
              </$TabletPriceChange>
            </TableCell>
          ),
        },
        sorting === MarketSorting.HIGHEST_CLOB_PAIR_ID
          ? {
              columnKey: 'listing',
              allowsSorting: false,
              label: undefined,
              renderCell: ({ isNew }) => (
                <$DetailsCell>
                  {isNew && (
                    <$RecentlyListed>
                      <NewTag>{stringGetter({ key: STRING_KEYS.NEW })}</NewTag>
                    </$RecentlyListed>
                  )}
                  <Icon iconName={IconName.ChevronRight} />
                </$DetailsCell>
              ),
            }
          : {
              columnKey: 'openInterest',
              allowsSorting: false,
              label: stringGetter({ key: STRING_KEYS.OPEN_INTEREST }),
              renderCell: ({ asset, openInterestUSDC, openInterest }) => (
                <$DetailsCell>
                  <$RecentlyListed>
                    <Output type={OutputType.CompactFiat} value={openInterestUSDC} />
                    <Output
                      type={OutputType.CompactNumber}
                      value={openInterest}
                      slotRight={` ${asset.id}`}
                      tw="text-color-text-0 font-mini-medium"
                    />
                  </$RecentlyListed>
                  <Icon iconName={IconName.ChevronRight} />
                </$DetailsCell>
              ),
            },
      ] satisfies ColumnDef<MarketData>[],
    [stringGetter, isTablet]
  );

  const sortedMarkets = useMemo(() => {
    if (sorting === MarketSorting.HIGHEST_CLOB_PAIR_ID) {
      return filteredMarkets.sort((a, b) => b.clobPairId - a.clobPairId);
    }

    if (sorting === MarketSorting.GAINERS || sorting === MarketSorting.LOSERS) {
      const sortingFunction = (marketA: MarketData, marketB: MarketData) => {
        if (marketA.priceChange24HPercent == null && marketB.priceChange24HPercent == null) {
          return 0;
        }

        if (marketA.priceChange24HPercent == null) {
          return 1;
        }

        if (marketB.priceChange24HPercent == null) {
          return -1;
        }

        return sorting === MarketSorting.GAINERS
          ? marketB.priceChange24HPercent - marketA.priceChange24HPercent
          : marketA.priceChange24HPercent - marketB.priceChange24HPercent;
      };

      return filteredMarkets.sort(sortingFunction);
    }

    return filteredMarkets;
  }, [sorting, filteredMarkets]);

  return (
    <$Table
      withInnerBorders
      data={sortedMarkets.slice(0, 3)}
      getRowKey={(row) => row.market ?? ''}
      label="Markets"
      onRowAction={(market: Key) =>
        navigate(`${AppRoute.Trade}/${market}`, { state: { from: AppRoute.Markets } })
      }
      columns={columns}
      className={className}
      slotEmpty={
        <$MarketNotFound>
          {filters === MarketFilters.NEW ? (
            <p>{stringGetter({ key: STRING_KEYS.NO_RECENTLY_LISTED_MARKETS })}</p>
          ) : (
            <LoadingSpace id="compact-markets-table" />
          )}
        </$MarketNotFound>
      }
      initialPageSize={5}
    />
  );
};

const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
  --tableCell-padding: 0.625rem 1.25rem;
  --tableRow-backgroundColor: var(--color-layer-3);
  --tableHeader-backgroundColor: var(--color-layer-3);
  border-bottom-right-radius: 0.625rem;
  border-bottom-left-radius: 0.625rem;

  thead {
    display: none;
  }

  & table {
    --stickyArea1-background: var(--color-layer-5);
  }

  & tr:last-child {
    box-shadow: none;
  }

  & tbody:after {
    content: none;
  }

  & > div {
    padding: 1rem;
  }

  @media ${breakpoints.desktopSmall} {
    --tableCell-padding: 0.5rem 0.5rem;

    & tr > td:nth-child(1) {
      --tableCell-padding: 0.5rem 0.5rem;
    }

    & tr > td:nth-child(2) {
      --tableCell-padding: 0.5rem 0;
    }

    & tr > td:nth-child(3) {
      --tableCell-padding: 0.5rem 0.5rem;
    }
  }

  @media ${breakpoints.tablet} {
    table {
      max-width: 100vw;
    }

    & tr > td:nth-child(1) {
      --tableCell-padding: 0.5rem 0.625rem 0.5rem 1rem;
    }

    & tr > td:nth-child(2) {
      --tableCell-padding: 0.5rem 0;
    }

    & tr > td:nth-child(3) {
      --tableCell-padding: 0.5rem 1rem 0.5rem 0.625rem;
    }
  }
` as typeof Table;
const $TabletPriceChange = styled.div`
  ${layoutMixins.inlineRow}

  & output {
    font: var(--font-mini-medium);
  }
`;

const $Output = styled(Output)<{ isNegative?: boolean; isPositive?: boolean }>`
  color: ${({ isNegative, isPositive }) =>
    isNegative
      ? `var(--color-negative)`
      : isPositive
        ? `var(--color-positive)`
        : `var(--color-text-1)`};
  font: var(--font-base-medium);
`;

const $MarketNotFound = styled.div`
  ${layoutMixins.column}
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0;

  & p {
    color: var(--color-text-0);
    font: var(--font-base-medium);
  }

  & button {
    color: var(--color-accent);
  }
`;

const $DetailsCell = styled(TableCell)`
  ${layoutMixins.row}
  gap: 0.75rem;

  & > svg {
    opacity: 0.4;
  }
`;

const $RecentlyListed = styled.div`
  ${layoutMixins.column}
  gap: 0.125rem;

  & > span,
  & > output {
    text-align: right;
    justify-content: flex-end;
  }
`;
