import { useMemo, useState } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import { useNavigate } from 'react-router-dom';

import { ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters, type MarketData } from '@/constants/markets';
import { FUNDING_DECIMALS, LARGE_TOKEN_DECIMALS } from '@/constants/numbers';
import { AppRoute, MarketsRoute } from '@/constants/routes';

import { useBreakpoints, useStringGetter } from '@/hooks';
import { useMarketsData } from '@/hooks/useMarketsData';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';
import { type ColumnDef, MarketTableCell, Table, TableCell } from '@/components/Table';
import { TriangleIndicator } from '@/components/TriangleIndicator';
import { MarketFilter } from '@/views/MarketFilter';
import { Toolbar } from '@/components/Toolbar';

import { MustBigNumber } from '@/lib/numbers';

export const MarketsTable = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const [filter, setFilter] = useState(MarketFilters.ALL);
  const [searchFilter, setSearchFilter] = useState<string>();
  const navigate = useNavigate();

  const { filteredMarkets, marketFilters } = useMarketsData(filter, searchFilter);
  const { hasPotentialMarketsData } = usePotentialMarkets();

  const columns = useMemo<ColumnDef<MarketData>[]>(
    () =>
      isTablet
        ? ([
            {
              columnKey: 'market',
              getCellValue: (row) => row.market,
              label: stringGetter({ key: STRING_KEYS.MARKET }),
              renderCell: ({ asset, id }) => <Styled.MarketTableCell asset={asset} marketId={id} />,
            },
            {
              columnKey: 'price',
              getCellValue: (row) => row.oraclePrice,
              label: stringGetter({ key: STRING_KEYS.PRICE }),
              renderCell: ({
                oraclePrice,
                priceChange24H,
                priceChange24HPercent,
                tickSizeDecimals,
              }) => (
                <TableCell stacked>
                  <Styled.TabletOutput
                    type={OutputType.Fiat}
                    value={oraclePrice}
                    fractionDigits={tickSizeDecimals}
                    withBaseFont
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
          ] as ColumnDef<MarketData>[])
        : ([
            {
              columnKey: 'market',
              getCellValue: (row) => row.market,
              label: stringGetter({ key: STRING_KEYS.MARKET }),
              renderCell: ({ asset, id }) => <Styled.MarketTableCell asset={asset} marketId={id} />,
            },
            {
              columnKey: 'oraclePrice',
              getCellValue: (row) => row.oraclePrice,
              label: stringGetter({ key: STRING_KEYS.ORACLE_PRICE }),
              renderCell: ({ oraclePrice, tickSizeDecimals }) => (
                <Output
                  type={OutputType.Fiat}
                  value={oraclePrice}
                  fractionDigits={tickSizeDecimals}
                />
              ),
            },
            {
              columnKey: 'priceChange24HPercent',
              getCellValue: (row) => row.priceChange24HPercent,
              label: stringGetter({ key: STRING_KEYS.CHANGE_24H }),
              renderCell: ({ priceChange24H, priceChange24HPercent, tickSizeDecimals }) => (
                <TableCell stacked>
                  <Styled.InlineRow>
                    {!priceChange24HPercent ? (
                      <Output type={OutputType.Text} value={null} />
                    ) : (
                      <Styled.Output
                        type={OutputType.Percent}
                        value={MustBigNumber(priceChange24HPercent).abs()}
                        isPositive={MustBigNumber(priceChange24HPercent).gt(0)}
                        isNegative={MustBigNumber(priceChange24HPercent).isNegative()}
                      />
                    )}
                  </Styled.InlineRow>
                  <Output
                    type={OutputType.Fiat}
                    value={MustBigNumber(priceChange24H).abs()}
                    fractionDigits={tickSizeDecimals}
                  />
                </TableCell>
              ),
            },
            {
              columnKey: 'nextFundingRate',
              getCellValue: (row) => row.nextFundingRate,
              label: stringGetter({ key: STRING_KEYS.FUNDING_RATE_1H_SHORT }),
              renderCell: (row) => (
                <Styled.Output
                  type={OutputType.Percent}
                  fractionDigits={FUNDING_DECIMALS}
                  value={row.nextFundingRate}
                  isPositive={MustBigNumber(row.nextFundingRate).gt(0)}
                  isNegative={MustBigNumber(row.nextFundingRate).isNegative()}
                />
              ),
            },
            {
              columnKey: 'openInterest',
              getCellValue: (row) => row.openInterestUSDC,
              label: stringGetter({ key: STRING_KEYS.OPEN_INTEREST }),
              renderCell: (row) => (
                <TableCell stacked>
                  <Output type={OutputType.Fiat} value={row.openInterestUSDC} />

                  <Output
                    fractionDigits={LARGE_TOKEN_DECIMALS}
                    type={OutputType.Number}
                    value={row.openInterest}
                    tag={row.asset?.id}
                  />
                </TableCell>
              ),
            },
            {
              columnKey: 'volume24H',
              getCellValue: (row) => row.volume24H,
              label: stringGetter({ key: STRING_KEYS.VOLUME_24H }),
              renderCell: (row) => <Output type={OutputType.Fiat} value={row.volume24H} />,
            },
            {
              columnKey: 'trades24H',
              getCellValue: (row) => row.trades24H,
              label: stringGetter({ key: STRING_KEYS.TRADES_24H }),
              renderCell: (row) => <Output type={OutputType.Number} value={row.trades24H} />,
            },
          ] as ColumnDef<MarketData>[]),
    [stringGetter, isTablet]
  );

  return (
    <>
      <Toolbar>
        <MarketFilter
          selectedFilter={filter}
          filters={marketFilters as MarketFilters[]}
          onChangeFilter={setFilter}
          onSearchTextChange={setSearchFilter}
        />
      </Toolbar>

      <Styled.Table
        withInnerBorders
        withOuterBorder={!isTablet}
        data={filteredMarkets}
        getRowKey={(row: MarketData) => row.market}
        label="Markets"
        onRowAction={(market: string) =>
          navigate(`/trade/${market}`, { state: { from: AppRoute.Markets } })
        }
        defaultSortDescriptor={{
          column: 'volume24H',
          direction: 'descending',
        }}
        columns={columns}
        className={className}
        slotEmpty={
          <Styled.MarketNotFound>
            {filter === MarketFilters.NEW && !searchFilter ? (
              <>
                <h2>
                  {stringGetter({
                    key: STRING_KEYS.QUERY_NOT_FOUND,
                    params: { QUERY: stringGetter({ key: STRING_KEYS.NEW }) },
                  })}
                </h2>
                {hasPotentialMarketsData && (
                  <p>{stringGetter({ key: STRING_KEYS.ADD_DETAILS_TO_LAUNCH_MARKET })}</p>
                )}
              </>
            ) : (
              <>
                <h2>
                  {stringGetter({
                    key: STRING_KEYS.QUERY_NOT_FOUND,
                    params: { QUERY: searchFilter ?? '' },
                  })}
                </h2>
                <p>{stringGetter({ key: STRING_KEYS.MARKET_SEARCH_DOES_NOT_EXIST_YET })}</p>
              </>
            )}

            {hasPotentialMarketsData && (
              <div>
                <Button
                  onClick={() => navigate(`${AppRoute.Markets}/${MarketsRoute.New}`)}
                  size={ButtonSize.Small}
                >
                  {stringGetter({ key: STRING_KEYS.PROPOSE_NEW_MARKET })}
                </Button>
              </div>
            )}
          </Styled.MarketNotFound>
        }
      />
    </>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}

  @media ${breakpoints.tablet} {
    table {
      max-width: 100vw;
    }
  }
`;

Styled.MarketTableCell = styled(MarketTableCell)`
  @media ${breakpoints.tablet} {
    span:first-child {
      font: var(--font-medium-book);
    }
    span:last-child {
      font: var(--font-mini-regular);
    }
  }
`;

Styled.TabletOutput = styled(Output)`
  @media ${breakpoints.tablet} {
    font: var(--font-medium-book);
    color: var(--color-text-2);
  }
`;

Styled.InlineRow = styled.div`
  ${layoutMixins.inlineRow}
`;

Styled.TabletPriceChange = styled(Styled.InlineRow)`
  font: var(--font-small-book);
`;

Styled.Output = styled(Output)<{ isNegative?: boolean; isPositive?: boolean }>`
  color: ${({ isNegative, isPositive }) =>
    isNegative
      ? `var(--color-negative)`
      : isPositive
      ? `var(--color-positive)`
      : `var(--color-text-1)`};
`;

Styled.MarketNotFound = styled.div`
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
