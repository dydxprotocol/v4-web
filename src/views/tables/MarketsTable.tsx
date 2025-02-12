import { ForwardedRef, forwardRef, Key, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters, type MarketData } from '@/constants/markets';
import { FUNDING_DECIMALS } from '@/constants/numbers';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useMarketsData } from '@/hooks/useMarketsData';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { Table, type ColumnDef } from '@/components/Table';
import { AssetTableCell } from '@/components/Table/AssetTableCell';
import { TableCell } from '@/components/Table/TableCell';
import { Toolbar } from '@/components/Toolbar';
import { TriangleIndicator } from '@/components/TriangleIndicator';
import { SparklineChart } from '@/components/visx/SparklineChart';
import { MarketFilter } from '@/views/MarketFilter';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setMarketFilter } from '@/state/perpetuals';
import { getMarketFilter } from '@/state/perpetualsSelectors';

import { MustBigNumber } from '@/lib/numbers';

import { FavoriteButton } from './MarketsTable/FavoriteButton';

export const MarketsTable = forwardRef(
  ({ className }: { className?: string }, ref: ForwardedRef<HTMLDivElement>) => {
    const stringGetter = useStringGetter();
    const { isTablet } = useBreakpoints();
    const dispatch = useAppDispatch();
    const filter: MarketFilters = useAppSelector(getMarketFilter);
    const [searchFilter, setSearchFilter] = useState<string>();
    const navigate = useNavigate();

    const { filteredMarkets, marketFilters, hasMarketIds } = useMarketsData({
      filter,
      searchFilter,
    });

    const columns = useMemo<ColumnDef<MarketData>[]>(
      () =>
        isTablet
          ? ([
              {
                columnKey: 'marketAndVolume',
                getCellValue: (row) => row.volume24h,
                label: stringGetter({ key: STRING_KEYS.MARKET }),
                renderCell: ({
                  id,
                  assetId,
                  effectiveInitialMarginFraction,
                  logo,
                  initialMarginFraction,
                  name,
                  isUnlaunched,
                  volume24h,
                }) => (
                  <div tw="flex items-center gap-0.25 mobile:max-w-[50vw] mobile:overflow-hidden">
                    <FavoriteButton marketId={id} tw="ml-[-0.5rem]" />
                    <AssetTableCell
                      tw="overflow-auto"
                      configs={{
                        effectiveInitialMarginFraction,
                        logo,
                        initialMarginFraction,
                        isUnlaunched,
                      }}
                      name={name}
                      symbol={assetId}
                    >
                      <Output
                        type={OutputType.CompactFiat}
                        value={volume24h ?? undefined}
                        tw="text-color-text-0 font-mini-medium"
                      />
                    </AssetTableCell>
                  </div>
                ),
              },
              {
                columnKey: 'price',
                getCellValue: (row) => row.oraclePrice,
                label: stringGetter({ key: STRING_KEYS.PRICE }),
                renderCell: ({
                  oraclePrice,
                  priceChange24h,
                  percentChange24h,
                  tickSizeDecimals,
                }) => (
                  <TableCell stacked tw="max-w-8">
                    <$TabletOutput
                      withSubscript
                      type={OutputType.Fiat}
                      value={oraclePrice}
                      fractionDigits={tickSizeDecimals}
                      withBaseFont
                    />
                    <$InlineRow tw="font-small-book">
                      {!priceChange24h ? (
                        <Output type={OutputType.Fiat} value={null} />
                      ) : (
                        <>
                          {priceChange24h > 0 && (
                            <TriangleIndicator value={MustBigNumber(priceChange24h)} />
                          )}
                          <$Output
                            type={OutputType.Percent}
                            value={MustBigNumber(percentChange24h).abs()}
                            isPositive={MustBigNumber(percentChange24h).gt(0)}
                            isNegative={MustBigNumber(percentChange24h).isNegative()}
                          />
                        </>
                      )}
                    </$InlineRow>
                  </TableCell>
                ),
              },
            ] satisfies ColumnDef<MarketData>[])
          : ([
              {
                columnKey: 'market',
                getCellValue: (row) => row.id,
                label: stringGetter({ key: STRING_KEYS.MARKET }),

                renderCell: ({
                  id,
                  assetId,
                  effectiveInitialMarginFraction,
                  logo,
                  initialMarginFraction,
                  name,
                  isUnlaunched,
                }) => (
                  <div tw="flex items-center gap-0.25">
                    <FavoriteButton marketId={id} />
                    <AssetTableCell
                      configs={{
                        effectiveInitialMarginFraction,
                        logo,
                        initialMarginFraction,
                        isUnlaunched,
                      }}
                      name={name}
                      symbol={assetId}
                    />
                  </div>
                ),
              },
              {
                columnKey: 'oraclePrice',
                getCellValue: (row) => row.oraclePrice,
                label: stringGetter({ key: STRING_KEYS.ORACLE_PRICE }),
                renderCell: ({ oraclePrice, tickSizeDecimals }) => (
                  <$TabletOutput
                    withSubscript
                    type={OutputType.Fiat}
                    value={oraclePrice}
                    fractionDigits={tickSizeDecimals}
                  />
                ),
              },
              {
                columnKey: 'priceChange24HChart',
                label: stringGetter({ key: STRING_KEYS.LAST_24H }),
                renderCell: ({ sparkline24h, percentChange24h }) => (
                  <div tw="h-2 w-3">
                    <SparklineChart
                      data={(sparkline24h ?? []).map((datum, index) => ({
                        x: index + 1,
                        y: parseFloat(datum.toString()),
                      }))}
                      xAccessor={(datum) => datum?.x ?? 0}
                      yAccessor={(datum) => datum?.y ?? 0}
                      positive={MustBigNumber(percentChange24h).gt(0)}
                    />
                  </div>
                ),
                allowsSorting: false,
              },
              {
                columnKey: 'priceChange24HPercent',
                getCellValue: (row) => row.percentChange24h,
                label: stringGetter({ key: STRING_KEYS.CHANGE_24H }),
                renderCell: ({ percentChange24h }) => (
                  <TableCell stacked>
                    <$InlineRow>
                      {!percentChange24h ? (
                        <Output type={OutputType.Text} value={null} />
                      ) : (
                        <$Output
                          type={OutputType.Percent}
                          value={MustBigNumber(percentChange24h).abs()}
                          isPositive={MustBigNumber(percentChange24h).gt(0)}
                          isNegative={MustBigNumber(percentChange24h).isNegative()}
                        />
                      )}
                    </$InlineRow>
                  </TableCell>
                ),
              },
              {
                columnKey: 'volume24H',
                getCellValue: (row) => row.volume24h,
                label: stringGetter({ key: STRING_KEYS.VOLUME_24H }),
                renderCell: (row) => (
                  <$NumberOutput type={OutputType.CompactFiat} value={row.volume24h} />
                ),
              },
              {
                columnKey: 'spotVolume24H',
                getCellValue: (row) => row.spotVolume24h,
                label: stringGetter({ key: STRING_KEYS.SPOT_VOLUME_24H }),
                renderCell: (row) => (
                  <$NumberOutput type={OutputType.CompactFiat} value={row.spotVolume24h} />
                ),
              },
              {
                columnKey: 'market-cap',
                getCellValue: (row) => row.marketCap,
                label: stringGetter({ key: STRING_KEYS.MARKET_CAP }),
                renderCell: (row) => (
                  <$NumberOutput type={OutputType.CompactFiat} value={row.marketCap} />
                ),
              },
              {
                columnKey: 'trades24H',
                getCellValue: (row) => row.trades24h,
                label: stringGetter({ key: STRING_KEYS.TRADES }),
                renderCell: (row) => (
                  <$NumberOutput type={OutputType.CompactNumber} value={row.trades24h} />
                ),
              },
              {
                columnKey: 'openInterest',
                getCellValue: (row) => row.openInterestUSDC,
                label: stringGetter({ key: STRING_KEYS.OPEN_INTEREST }),
                renderCell: (row) => (
                  <$NumberOutput type={OutputType.CompactFiat} value={row.openInterestUSDC} />
                ),
              },
              {
                columnKey: 'nextFundingRate',
                getCellValue: (row) => row.nextFundingRate,
                label: stringGetter({ key: STRING_KEYS.FUNDING_RATE_1H_SHORT }),
                renderCell: (row) => (
                  <$Output
                    type={OutputType.Percent}
                    fractionDigits={FUNDING_DECIMALS}
                    value={row.nextFundingRate}
                    isPositive={MustBigNumber(row.nextFundingRate).gt(0)}
                    isNegative={MustBigNumber(row.nextFundingRate).isNegative()}
                  />
                ),
              },
            ] satisfies ColumnDef<MarketData>[]),
      [stringGetter, isTablet]
    );

    const setFilter = (newFilter: MarketFilters) => {
      dispatch(setMarketFilter(newFilter));
    };

    return (
      <>
        <$Toolbar>
          <MarketFilter
            ref={ref}
            compactLayout
            searchPlaceholderKey={STRING_KEYS.SEARCH_MARKETS}
            selectedFilter={filter}
            filters={marketFilters}
            onChangeFilter={setFilter}
            onSearchTextChange={setSearchFilter}
          />
        </$Toolbar>

        <$Table
          withInnerBorders
          data={hasMarketIds ? filteredMarkets : []}
          tableId="markets-main"
          getRowKey={(row: MarketData) => row.id}
          getIsRowPinned={(row: MarketData) => row.isFavorite}
          label="Markets"
          onRowAction={(market: Key) =>
            navigate(`${AppRoute.Trade}/${market}`, { state: { from: AppRoute.Markets } })
          }
          defaultSortDescriptor={{
            column: isTablet ? 'marketAndVolume' : 'volume24H',
            direction: 'descending',
          }}
          columns={columns}
          initialPageSize={50}
          paginationBehavior="paginate"
          shouldResetOnTotalRowsChange
          className={className}
          slotEmpty={
            <$MarketNotFound>
              {(filter === MarketFilters.NEW || filter === MarketFilters.FAVORITE) &&
              !searchFilter ? (
                <h2>
                  {stringGetter({
                    key: STRING_KEYS.QUERY_NOT_FOUND,
                    params: {
                      QUERY:
                        filter === MarketFilters.FAVORITE
                          ? stringGetter({ key: STRING_KEYS.FAVORITES })
                          : stringGetter({ key: STRING_KEYS.NEW }),
                    },
                  })}
                </h2>
              ) : searchFilter ? (
                <>
                  <h2>
                    {stringGetter({
                      key: STRING_KEYS.QUERY_NOT_FOUND,
                      params: { QUERY: searchFilter },
                    })}
                  </h2>
                  <p>{stringGetter({ key: STRING_KEYS.MARKET_SEARCH_DOES_NOT_EXIST_YET })}</p>
                </>
              ) : (
                <LoadingSpace id="markets-table" />
              )}
            </$MarketNotFound>
          }
        />
      </>
    );
  }
);

const $Toolbar = styled(Toolbar)`
  max-width: 100vw;
  overflow: hidden;
  margin-bottom: 0.625rem;
  padding-left: 0.375rem;
  padding-right: 0;

  @media ${breakpoints.desktopSmall} {
    padding-right: 0.375rem;
  }

  @media ${breakpoints.tablet} {
    padding-left: 1rem;
    padding-right: 1rem;
  }
`;

const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
  tbody {
    --tableCell-padding: 1rem 0;
  }

  @media ${breakpoints.tablet} {
    table {
      max-width: 100vw;
    }

    thead {
      display: none;
    }
  }
` as typeof Table;

const $TabletOutput = tw(Output)`font-base-book text-color-text-2`;

const $InlineRow = tw.div`inlineRow`;
const $NumberOutput = tw(Output)`font-base-medium text-color-text-2`;

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
  gap: 1rem;
  padding: 2rem 1.5rem;

  h2 {
    font: var(--font-medium-book);
    font-weight: 500;
  }
`;
