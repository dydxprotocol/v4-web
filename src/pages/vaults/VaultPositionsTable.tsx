import { useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { VaultPosition } from '@/bonsai/public-calculators/vault';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';
import { useLoadedVaultPositions } from '@/hooks/vaultsHooks';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Output, OutputType } from '@/components/Output';
import { Table, type ColumnDef } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';
import { SparklineChart } from '@/components/visx/SparklineChart';

import { useAppSelector } from '@/state/appTypes';

import { getDisplayableAssetFromTicker } from '@/lib/assetUtils';
import { isTruthy } from '@/lib/isTruthy';
import { getNumberSign, MustNumber } from '@/lib/numbers';
import { orEmptyRecord } from '@/lib/typeUtils';

type VaultTableRow = VaultPosition;

const VAULT_PAGE_SIZE = 20 as const;
// bonsai adds a special line for unallocated usdc just for vaults, this isn't really done anywhere else so
// happy to special case it just here
const USDC_MARKET_HARDCODED = 'UNALLOCATEDUSDC-USD';

export const VaultPositionsTable = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();
  const { usdcImage, usdcLabel } = useTokenConfigs();

  const vaultsDataRaw = useLoadedVaultPositions();
  const vaultsData = useMemo(
    () =>
      vaultsDataRaw?.positions?.filter(
        (p) =>
          MustNumber(p.marginUsdc) > 0 ||
          MustNumber(p.equityUsdc) > 0 ||
          MustNumber(p.currentPosition?.asset) > 0
      ) ?? EMPTY_ARR,
    [vaultsDataRaw?.positions]
  );
  const marketsData = orEmptyRecord(useAppSelector(BonsaiCore.markets.markets.data));

  const { isTablet } = useBreakpoints();

  const columns = useMemo<ColumnDef<VaultTableRow>[]>(
    () =>
      (
        [
          {
            columnKey: 'market',
            getCellValue: (row) =>
              row.marketId === USDC_MARKET_HARDCODED ? usdcLabel : row.marketId,
            label: stringGetter({ key: STRING_KEYS.MARKET }),
            renderCell: ({ marketId, currentLeverageMultiple }) => {
              const asset = marketId != null ? marketsData[marketId] : undefined;
              const logoUrl = marketId === USDC_MARKET_HARDCODED ? usdcImage : asset?.logo;

              return (
                // eslint-disable-next-line jsx-a11y/interactive-supports-focus
                <div
                  tw="cursor-pointer rounded-0.5 hover:bg-color-layer-3"
                  role="button"
                  onClick={() =>
                    marketId != null &&
                    marketsData[marketId] != null &&
                    navigate(`${AppRoute.Trade}/${marketId}`, { state: { from: AppRoute.Vault } })
                  }
                >
                  <TableCell
                    stacked
                    slotLeft={
                      <AssetIcon
                        logoUrl={logoUrl}
                        symbol={marketId === USDC_MARKET_HARDCODED ? usdcLabel : asset?.assetId}
                        tw="[--asset-icon-size:2.5em]"
                      />
                    }
                  >
                    {marketId === USDC_MARKET_HARDCODED ? usdcLabel : asset?.name}
                    <div tw="row gap-0.25">
                      {!!currentLeverageMultiple && (
                        <$OutputSigned
                          value={
                            (currentLeverageMultiple ?? 0) < 0
                              ? stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT })
                              : stringGetter({ key: STRING_KEYS.LONG_POSITION_SHORT })
                          }
                          sign={getNumberSign(currentLeverageMultiple ?? 0)}
                          type={OutputType.Text}
                        />
                      )}
                      <Output
                        type={OutputType.Multiple}
                        value={
                          currentLeverageMultiple != null
                            ? Math.abs(currentLeverageMultiple)
                            : undefined
                        }
                      />
                    </div>
                  </TableCell>
                </div>
              );
            },
          },
          {
            columnKey: 'size',
            getCellValue: (row) => row.currentPosition?.usdc ?? 0,
            label: stringGetter({ key: STRING_KEYS.SIZE }),
            renderCell: ({ currentPosition, marketId }) => (
              <TableCell stacked>
                <Output value={currentPosition?.usdc} type={OutputType.Fiat} fractionDigits={0} />
                <Output
                  value={currentPosition?.asset}
                  type={OutputType.Asset}
                  tag={
                    <$Label>
                      {marketId === USDC_MARKET_HARDCODED
                        ? usdcLabel
                        : marketsData[marketId ?? '']?.assetId != null
                          ? marketsData[marketId ?? '']?.displayableAsset
                          : getDisplayableAssetFromTicker(marketId ?? '')}
                    </$Label>
                  }
                  fractionDigits={marketsData[marketId ?? '']?.stepSizeDecimals}
                />
              </TableCell>
            ),
          },
          !isTablet && {
            columnKey: 'pnl-sparkline',
            allowsSorting: false,
            label: stringGetter({ key: STRING_KEYS.PAST_30D }),
            width: 50,
            renderCell: ({ thirtyDayPnl }) => (
              <TableCell>
                <div style={{ width: 50, height: 50 }} tw="ml-0.5">
                  {thirtyDayPnl?.sparklinePoints != null && (
                    <SparklineChart
                      data={thirtyDayPnl.sparklinePoints.map((elem, index) => ({
                        x: index + 1,
                        y: elem,
                      }))}
                      xAccessor={(datum) => datum?.x ?? 0}
                      yAccessor={(datum) => datum?.y ?? 0}
                      positive={(thirtyDayPnl.absolute ?? 0) > 0}
                    />
                  )}
                </div>
              </TableCell>
            ),
          },
          !isTablet && {
            columnKey: 'pnl',
            getCellValue: (row) => row.thirtyDayPnl?.absolute ?? 0,
            label: stringGetter({ key: STRING_KEYS.VAULT_THIRTY_DAY_PNL }),
            renderCell: ({ thirtyDayPnl: thirtyDayPnlRaw }) => {
              const thirtyDayPnl = thirtyDayPnlRaw ?? {
                absolute: 0,
                percent: 0,
                sparklinePoints: undefined,
              };
              return (
                <TableCell>
                  <$OutputSigned
                    tw="w-5"
                    sign={getNumberSign(thirtyDayPnl.absolute)}
                    value={thirtyDayPnl.absolute}
                    type={OutputType.Fiat}
                    fractionDigits={0}
                  />
                </TableCell>
              );
            },
          },
          {
            columnKey: 'margin',
            getCellValue: (row) => row.marginUsdc,
            label: stringGetter({ key: STRING_KEYS.EQUITY }),
            renderCell: ({ marginUsdc }) => (
              <TableCell>
                <Output value={marginUsdc} type={OutputType.Fiat} fractionDigits={0} />
              </TableCell>
            ),
          },
        ] satisfies Array<ColumnDef<VaultTableRow> | false>
      ).filter(isTruthy),
    [isTablet, marketsData, navigate, stringGetter, usdcImage, usdcLabel]
  );

  return (
    <$Table
      withInnerBorders
      withOuterBorder
      data={vaultsData}
      tableId="vault-positions"
      getRowKey={(row) => row.marketId ?? ''}
      label={stringGetter({ key: STRING_KEYS.MEGAVAULT })}
      defaultSortDescriptor={{
        column: 'margin',
        direction: 'descending',
      }}
      columns={columns}
      paginationBehavior={vaultsData.length <= VAULT_PAGE_SIZE ? 'showAll' : 'paginate'}
      initialPageSize={VAULT_PAGE_SIZE}
      className={className}
    />
  );
};

const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}

  @media ${breakpoints.tablet} {
    table {
      max-width: 100vw;
    }
  }
` as typeof Table;

const $OutputSigned = styled(Output)<{ sign: NumberSign }>`
  color: ${({ sign }) =>
    ({
      [NumberSign.Positive]: `var(--color-positive)`,
      [NumberSign.Negative]: `var(--color-negative)`,
      [NumberSign.Neutral]: `var(--color-text-2)`,
    })[sign]};
`;

const $Label = styled.div`
  max-width: 6rem;
  ${layoutMixins.textTruncate}
`;
