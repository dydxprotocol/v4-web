import { PropsWithChildren, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';
import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters, MarketSorting, type MarketData } from '@/constants/markets';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints, useStringGetter } from '@/hooks';
import { useMarketsData } from '@/hooks/useMarketsData';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { AssetTableCell, Table, TableCell, type ColumnDef } from '@/components/Table';
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
          getCellValue: (row) => row.market,
          allowsSorting: false,
          label: stringGetter({ key: STRING_KEYS.MARKET }),
          renderCell: ({ asset }) => <AssetTableCell stacked asset={asset} />,
        },
        {
          columnKey: 'oraclePrice',
          getCellValue: (row) => row.oraclePrice,
          allowsSorting: false,
          label: stringGetter({ key: STRING_KEYS.ORACLE_PRICE }),
          renderCell: ({
            oraclePrice,
            priceChange24H,
            priceChange24HPercent,
            tickSizeDecimals,
          }) => (
            <TableCell stacked>
              <Styled.TabletOutput
                withBaseFont
                withSubscript
                type={OutputType.Fiat}
                value={oraclePrice}
                fractionDigits={tickSizeDecimals}
              />
              <Styled.TabletPriceChange>
                {!priceChange24H ? (
                  <Output type={OutputType.Fiat} value={null} />
                ) : (
                  <>
                    {priceChange24H > 0 && (
                      <TriangleIndicator value={MustBigNumber(priceChange24H)} />
                    )}
                    <Styled.Output
                      type={OutputType.Percent}
                      value={MustBigNumber(priceChange24HPercent).abs()}
                      isPositive={MustBigNumber(priceChange24HPercent).gt(0)}
                      isNegative={MustBigNumber(priceChange24HPercent).isNegative()}
                    />
                  </>
                )}
              </Styled.TabletPriceChange>
            </TableCell>
          ),
        },
        filters === MarketFilters.NEW
          ? {
              columnKey: 'listing',
              getCellValue: (row) => row.isNew,
              allowsSorting: false,
              renderCell: ({ listingDate }) => (
                <Styled.DetailsCell>
                  <Styled.RecentlyListed>
                    <span>Listed</span>
                    {listingDate && (
                      <Styled.RelativeTimeOutput
                        type={OutputType.RelativeTime}
                        relativeTimeFormatOptions={{
                          format: 'singleCharacter',
                        }}
                        value={listingDate.getTime()}
                      />
                    )}
                  </Styled.RecentlyListed>
                  <Icon iconName={IconName.ChevronRight} />
                </Styled.DetailsCell>
              ),
            }
          : {
              columnKey: 'openInterest',
              allowsSorting: false,
              getCellValue: (row) => row.openInterestUSDC,
              label: stringGetter({ key: STRING_KEYS.OPEN_INTEREST }),
              renderCell: ({ asset, openInterestUSDC, openInterest }) => (
                <Styled.DetailsCell>
                  <Styled.RecentlyListed>
                    <Output type={OutputType.CompactFiat} value={openInterestUSDC} />
                    <Styled.InterestOutput
                      type={OutputType.CompactNumber}
                      value={openInterest}
                      slotRight={` ${asset.id}`}
                    />
                  </Styled.RecentlyListed>
                  <Icon iconName={IconName.ChevronRight} />
                </Styled.DetailsCell>
              ),
            },
      ] as ColumnDef<MarketData>[],
    [stringGetter, isTablet]
  );

  const sortedMarkets = useMemo(() => {
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

    if (sorting === MarketSorting.LOSERS) {
      return filteredMarkets
        .filter((market) => !!market.priceChange24HPercent && market.priceChange24HPercent < 0)
        .sort(sortingFunction);
    }

    return filteredMarkets.sort(sortingFunction);
  }, [sorting, filteredMarkets]);

  return (
    <Styled.Table
      withInnerBorders
      data={sortedMarkets.slice(0, 5)}
      getRowKey={(row: MarketData) => row.market}
      label="Markets"
      onRowAction={(market: string) =>
        navigate(`${AppRoute.Trade}/${market}`, { state: { from: AppRoute.Markets } })
      }
      columns={columns}
      className={className}
      slotEmpty={
        <Styled.MarketNotFound>
          {filters === MarketFilters.NEW ? (
            <p>{stringGetter({ key: STRING_KEYS.NO_RECENTLY_LISTED_MARKETS })}</p>
          ) : (
            <LoadingSpace id="compact-markets-table" />
          )}
        </Styled.MarketNotFound>
      }
    />
  );
};

const Styled = {
  Table: styled(Table)`
    ${tradeViewMixins.horizontalTable}
    --tableCell-padding: 0.625rem 1.5rem;
    --tableRow-backgroundColor: var(--color-layer-3);
    --tableStickyRow-backgroundColor: var(--color-layer-3);
    border-bottom-right-radius: 0.625rem;
    border-bottom-left-radius: 0.625rem;

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
  ` as AnyStyledComponent, // TODO: Remove cast when Table component is refactored

  TabletOutput: styled(Output)`
    font: var(--font-small-medium);
    color: var(--color-text-1);
  `,

  InlineRow: styled.div`
    ${layoutMixins.inlineRow}
  `,

  TabletPriceChange: styled.div`
    ${layoutMixins.inlineRow}

    & output {
      font: var(--font-mini-medium);
    }
  `,

  Output: styled(Output)<{ isNegative?: boolean; isPositive?: boolean }>`
    color: ${({ isNegative, isPositive }) =>
      isNegative
        ? `var(--color-negative)`
        : isPositive
        ? `var(--color-positive)`
        : `var(--color-text-1)`};
    font: var(--font-base-medium);
  `,

  MarketNotFound: styled.div`
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
  `,

  DetailsCell: styled(TableCell)`
    ${layoutMixins.row}
    gap: 0.75rem;

    & > svg {
      opacity: 0.4;
    }
  `,

  RecentlyListed: styled.div`
    ${layoutMixins.column}
    gap: 0.125rem;

    & > span,
    & > output {
      text-align: right;
      justify-content: flex-end;
    }

    & > span:first-child {
      color: var(--color-text-0);
      font: var(--font-mini-medium);
    }

    & > span:last-child,
    & > output:first-child {
      color: var(--color-text-1);
      font: var(--font-small-medium);
    }
  `,

  InterestOutput: styled(Output)`
    color: var(--color-text-0);
    font: var(--font-mini-medium);
  `,

  RelativeTimeOutput: styled(Output)`
    color: var(--color-text-1);
    font: var(--font-small-medium);
  `,
};
