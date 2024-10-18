import { useMemo } from 'react';

import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { VaultPosition } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';
import { AppRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useLoadedVaultPositions } from '@/hooks/vaultsHooks';

import breakpoints from '@/styles/breakpoints';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { Table, type ColumnDef } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';
import { SparklineChart } from '@/components/visx/SparklineChart';

import { useAppSelector } from '@/state/appTypes';
import { getMarketIdToAssetMetadataMap, getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { getNumberSign } from '@/lib/numbers';
import { orEmptyRecord } from '@/lib/typeUtils';

type VaultTableRow = VaultPosition;

const VAULT_PAGE_SIZE = 20 as const;
// abacus adds a special line for unallocated usdc just for vaults, this isn't really done anywhere else so
// happy to special case it just here
const USDC_MARKET_HARDCODED = 'USDC-USD';

export const VaultPositionsTable = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();

  const vaultsDataRaw = useLoadedVaultPositions();
  const vaultsData = useMemo(
    () => vaultsDataRaw?.positions?.toArray() ?? EMPTY_ARR,
    [vaultsDataRaw?.positions]
  );
  const marketIdToAssetMetadataMap = useAppSelector(getMarketIdToAssetMetadataMap) ?? EMPTY_ARR;
  const marketsData = orEmptyRecord(useAppSelector(getPerpetualMarkets));

  const columns = useMemo<ColumnDef<VaultTableRow>[]>(
    () =>
      [
        {
          columnKey: 'market',
          getCellValue: (row) => row.marketId,
          label: stringGetter({ key: STRING_KEYS.MARKET }),
          renderCell: ({ marketId, currentLeverageMultiple }) => {
            const asset = marketId != null ? marketIdToAssetMetadataMap[marketId] : undefined;

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
                      symbol={marketId === USDC_MARKET_HARDCODED ? 'USDC' : asset?.id}
                      tw="[--asset-icon-size:2.5em]"
                    />
                  }
                >
                  {marketId === USDC_MARKET_HARDCODED ? 'USDC' : asset?.name}
                  <div tw="row gap-0.25">
                    <Output
                      type={OutputType.Multiple}
                      value={
                        currentLeverageMultiple != null
                          ? Math.abs(currentLeverageMultiple)
                          : undefined
                      }
                    />
                    <$OutputSigned
                      value={
                        (currentLeverageMultiple ?? 0) < 0
                          ? stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT })
                          : stringGetter({ key: STRING_KEYS.LONG_POSITION_SHORT })
                      }
                      sign={getNumberSign(currentLeverageMultiple ?? 0)}
                      type={OutputType.Text}
                    />
                  </div>
                </TableCell>
              </div>
            );
          },
        },
        {
          columnKey: 'size',
          getCellValue: (row) => row.currentPosition?.usdc,
          label: stringGetter({ key: STRING_KEYS.SIZE }),
          renderCell: ({ currentPosition, marketId }) => (
            <TableCell stacked>
              <Output value={currentPosition?.usdc} type={OutputType.Fiat} fractionDigits={0} />
              <Output
                value={currentPosition?.asset}
                type={OutputType.Asset}
                tag={marketsData[marketId ?? '']?.assetId}
                fractionDigits={marketsData[marketId ?? '']?.configs?.stepSizeDecimals}
              />
            </TableCell>
          ),
        },
        {
          columnKey: 'pnl-sparkline',
          allowsSorting: false,
          label: stringGetter({ key: STRING_KEYS.PAST_30D }),
          width: 50,
          renderCell: ({ thirtyDayPnl }) => (
            <TableCell>
              <div style={{ width: 50, height: 50 }} tw="ml-0.5">
                {thirtyDayPnl?.sparklinePoints != null && (
                  <SparklineChart
                    data={thirtyDayPnl.sparklinePoints.toArray().map((elem, index) => ({
                      x: index + 1,
                      y: elem,
                    }))}
                    xAccessor={(datum) => datum.x}
                    yAccessor={(datum) => datum.y}
                    positive={(thirtyDayPnl.absolute ?? 0) > 0}
                  />
                )}
              </div>
            </TableCell>
          ),
        },
        {
          columnKey: 'pnl',
          getCellValue: (row) => row.thirtyDayPnl?.absolute,
          label: stringGetter({ key: STRING_KEYS.VAULT_THIRTY_DAY_PNL }),
          renderCell: ({ thirtyDayPnl: thirtyDayPnlRaw }) => {
            const thirtyDayPnl = thirtyDayPnlRaw ?? {
              absolute: 0,
              percent: 0,
              sparklinePoints: undefined,
            };
            return (
              <TableCell stacked>
                <$OutputSigned
                  tw="w-5"
                  sign={getNumberSign(thirtyDayPnl.absolute)}
                  value={thirtyDayPnl.absolute}
                  type={OutputType.Fiat}
                  fractionDigits={0}
                />
                <Output
                  value={thirtyDayPnl.percent}
                  type={OutputType.Percent}
                  showSign={ShowSign.Both}
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
      ] satisfies ColumnDef<VaultTableRow>[],
    [marketIdToAssetMetadataMap, marketsData, navigate, stringGetter]
  );

  return (
    <$Table
      withInnerBorders
      withOuterBorder
      data={vaultsData}
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
