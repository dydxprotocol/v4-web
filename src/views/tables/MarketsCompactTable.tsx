import { PropsWithChildren, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';
import styled, { type AnyStyledComponent } from 'styled-components';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters, type MarketData } from '@/constants/markets';
import { AppRoute, MarketsRoute } from '@/constants/routes';

import { useBreakpoints, useStringGetter } from '@/hooks';
import { useMarketsData } from '@/hooks/useMarketsData';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { type ColumnDef, AssetTableCell, Table, TableCell } from '@/components/Table';
import { TriangleIndicator } from '@/components/TriangleIndicator';

import { MustBigNumber } from '@/lib/numbers';

interface MarketsCompactTableProps {
  className?: string;
  filters?: MarketFilters;
}

export const MarketsCompactTable = (props: PropsWithChildren<MarketsCompactTableProps>) => {
  const { className, filters } = props;
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
          renderCell: ({ asset }) => <AssetTableCell stacked asset={asset} />,
        },
        {
          columnKey: 'price',
          getCellValue: (row) => row.oraclePrice,
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
        filters === MarketFilters.NEW
          ? {
              columnKey: 'listing',
              getCellValue: (row) => row.isNew,
              renderCell: ({ asset }) => (
                <Styled.DetailsCell>
                  <Styled.RecentlyListed>
                    <span>Listed</span>
                    <span>14 hrs ago</span>
                  </Styled.RecentlyListed>
                  <Icon iconName={IconName.ChevronRight} />
                </Styled.DetailsCell>
              ),
            }
          : {
              columnKey: 'openInterest',
              getCellValue: (row) => row.isNew,
              renderCell: ({ asset, openInterestUSDC, openInterest }) => (
                <Styled.DetailsCell>
                  <Styled.RecentlyListed>
                    <Styled.NumberOutput type={OutputType.CompactFiat} value={openInterestUSDC} />
                    <Styled.NumberOutput
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

  return (
    <Styled.Table
      withInnerBorders
      hideHeader
      data={filteredMarkets.slice(0, 5)}
      getRowKey={(row: MarketData) => row.market}
      label="Markets"
      onRowAction={(market: string) =>
        navigate(`${AppRoute.Trade}/${market}`, { state: { from: AppRoute.Markets } })
      }
      defaultSortDescriptor={{
        column: 'volume24H',
        direction: 'descending',
      }}
      columns={columns}
      className={className}
      slotEmpty={
        <Styled.MarketNotFound>
          <p>No recently listed markets</p>
          <Button
            onClick={() => navigate(`${AppRoute.Markets}/${MarketsRoute.New}`)}
            size={ButtonSize.Small}
            action={ButtonAction.Navigation}
          >
            {stringGetter({ key: STRING_KEYS.ADD_A_MARKET })}
          </Button>
        </Styled.MarketNotFound>
      }
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
  --tableCell-padding: 0.625rem 1.5rem;
  --tableRow-backgroundColor: var(--color-layer-3);
  --tableHeader-backgroundColor: var(--color-layer-3);
  border-radius: 0.625rem;

  & tr:last-child {
    box-shadow: none;
  }

  & tbody:after {
    content: none;
  }

  & > div {
    padding: 1rem;
  }

  @media ${breakpoints.tablet} {
    table {
      max-width: 100vw;
    }
  }
`;

Styled.TabletOutput = styled(Output)`
  font: var(--font-small-medium);
  color: var(--color-text-1);
`;

Styled.InlineRow = styled.div`
  ${layoutMixins.inlineRow}
`;

Styled.TabletPriceChange = styled(Styled.InlineRow)`
  & output {
    font: var(--font-mini-medium);
  }
`;

Styled.NumberOutput = styled(Output)`
  font: var(--font-base-medium);
  color: var(--color-text-2);
`;

Styled.Output = styled(Output)<{ isNegative?: boolean; isPositive?: boolean }>`
  color: ${({ isNegative, isPositive }) =>
    isNegative
      ? `var(--color-negative)`
      : isPositive
      ? `var(--color-positive)`
      : `var(--color-text-1)`};
  font: var(--font-base-medium);
`;

Styled.MarketNotFound = styled.div`
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

Styled.DetailsCell = styled(TableCell)`
  ${layoutMixins.row}
  gap: 0.75rem;

  & > svg {
    opacity: 0.4;
  }
`;

Styled.RecentlyListed = styled.div`
  ${layoutMixins.column}
  gap: 0.125rem;

  & > span,
  & > output {
    text-align: right;
    justify-content: flex-end;
  }

  & > span:first-child,
  & > output:last-child {
    color: var(--color-text-0);
    font: var(--font-mini-medium);
  }

  & > span:last-child,
  & > output:first-child {
    color: var(--color-text-1);
    font: var(--font-small-medium);
  }
`;
