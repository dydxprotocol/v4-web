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
import { ColumnDef, Table } from '@/components/Table';
import { AssetTableCell } from '@/components/Table/AssetTableCell';
import { TableCell } from '@/components/Table/TableCell';
import { NewTag } from '@/components/Tag';
import { TriangleIndicator } from '@/components/TriangleIndicator';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';

interface MarketsCompactTableProps {
  className?: string;
  sorting?: MarketSorting;
}

export const MarketsCompactTable = ({
  className,
  sorting,
}: PropsWithChildren<MarketsCompactTableProps>) => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoints();

  const { filteredMarkets } = useMarketsData({
    filter: sorting === MarketSorting.RECENTLY_LISTED ? MarketFilters.NEW : MarketFilters.ALL,
    forceHideUnlaunchedMarkets: true,
  });

  const columns = useMemo(() => {
    return sorting === MarketSorting.RECENTLY_LISTED
      ? [
          {
            columnKey: 'market',
            allowsSorting: false,
            label: stringGetter({ key: STRING_KEYS.MARKET }),
            renderCell: ({
              assetId,
              effectiveInitialMarginFraction,
              logo,
              initialMarginFraction,
              name,
            }: MarketData) => (
              <AssetTableCell
                configs={{ logo, effectiveInitialMarginFraction, initialMarginFraction }}
                name={name}
                symbol={assetId}
                truncateAssetName
              />
            ),
          },
          {
            columnKey: 'oraclePrice',
            allowsSorting: false,
            label: stringGetter({ key: STRING_KEYS.ORACLE_PRICE }),
            renderCell: ({
              oraclePrice,
              priceChange24h,
              percentChange24h,
              tickSizeDecimals,
            }: MarketData) => (
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
                </$TabletPriceChange>
              </TableCell>
            ),
          },
          !isMobile && {
            columnKey: 'listing',
            allowsSorting: false,
            label: undefined,
            renderCell: ({ isNew }: MarketData) => (
              <$DetailsCell>
                {isNew && (
                  <$RecentlyListed>
                    <NewTag>{stringGetter({ key: STRING_KEYS.NEW })}</NewTag>
                  </$RecentlyListed>
                )}
                <Icon iconName={IconName.ChevronRight} />
              </$DetailsCell>
            ),
          },
        ].filter(isTruthy)
      : [
          {
            columnKey: 'market',
            allowsSorting: false,
            label: stringGetter({ key: STRING_KEYS.MARKET }),
            renderCell: ({
              assetId,
              effectiveInitialMarginFraction,
              logo,
              initialMarginFraction,
              name,
            }: MarketData) => (
              <AssetTableCell
                configs={{ logo, effectiveInitialMarginFraction, initialMarginFraction }}
                name={name}
                symbol={assetId}
                truncateAssetName
              />
            ),
          },
          {
            columnKey: 'oraclePrice',
            allowsSorting: false,
            label: stringGetter({ key: STRING_KEYS.ORACLE_PRICE }),
            renderCell: ({
              oraclePrice,
              priceChange24h,
              percentChange24h,
              tickSizeDecimals,
            }: MarketData) => (
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
                  {!percentChange24h ? (
                    <Output type={OutputType.Fiat} value={null} />
                  ) : (
                    <>
                      {percentChange24h > 0 && (
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
                </$TabletPriceChange>
              </TableCell>
            ),
          },
          !isMobile && {
            columnKey: 'openInterest',
            allowsSorting: false,
            label: stringGetter({ key: STRING_KEYS.OPEN_INTEREST }),
            renderCell: ({ assetId, openInterestUSDC, openInterest }: MarketData) => (
              <$DetailsCell>
                <$RecentlyListed>
                  <Output type={OutputType.CompactFiat} value={openInterestUSDC} />
                  <Output
                    type={OutputType.CompactNumber}
                    value={openInterest}
                    slotRight={` ${getDisplayableAssetFromBaseAsset(assetId)}`}
                    tw="text-color-text-0 font-mini-medium"
                  />
                </$RecentlyListed>
                <Icon iconName={IconName.ChevronRight} />
              </$DetailsCell>
            ),
          },
        ].filter(isTruthy);
  }, [isMobile, stringGetter, sorting]) as ColumnDef<MarketData>[];

  const sortedMarkets = useMemo(() => {
    if (sorting === MarketSorting.RECENTLY_LISTED) {
      return filteredMarkets.sort(
        (a, b) => (a.sparkline24h?.length ?? 0) - (b.sparkline24h?.length ?? 0)
      );
    }

    if (sorting === MarketSorting.GAINERS || sorting === MarketSorting.LOSERS) {
      const sortingFunction = (marketA: MarketData, marketB: MarketData) => {
        if (marketA.percentChange24h == null && marketB.percentChange24h == null) {
          return 0;
        }

        if (marketA.percentChange24h == null) {
          return 1;
        }

        if (marketB.percentChange24h == null) {
          return -1;
        }

        return sorting === MarketSorting.GAINERS
          ? marketB.percentChange24h - marketA.percentChange24h
          : marketA.percentChange24h - marketB.percentChange24h;
      };

      return filteredMarkets.sort(sortingFunction);
    }

    return filteredMarkets;
  }, [sorting, filteredMarkets]);

  return (
    <$Table
      withInnerBorders
      data={sortedMarkets.slice(0, 3)}
      getRowKey={(row) => row.id}
      label="Markets"
      tableId="markets-compact"
      onRowAction={(market: Key) =>
        navigate(`${AppRoute.Trade}/${market}`, { state: { from: AppRoute.Markets } })
      }
      columns={columns}
      className={className}
      slotEmpty={
        <$MarketNotFound>
          <LoadingSpace id="compact-markets-table" />
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
