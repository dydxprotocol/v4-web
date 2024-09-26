import { Key, useMemo } from 'react';

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

const VAULT_PAGE_SIZE = 50 as const;
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
              <TableCell stacked slotLeft={<AssetIcon symbol={asset?.id} tw="h-[2.5em]" />}>
                {asset?.name}
                <div tw="row gap-0.25">
                  <$OutputSigned
                    value={
                      (currentLeverageMultiple ?? 0) < 0
                        ? stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT })
                        : stringGetter({ key: STRING_KEYS.LONG_POSITION_SHORT })
                    }
                    sign={getNumberSign(currentLeverageMultiple ?? 0)}
                    type={OutputType.Text}
                  />
                  @
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
              <TableCell
                stacked
                slotRight={
                  <div style={{ width: 50, height: 50 }} tw="ml-0.5">
                    {thirtyDayPnl.sparklinePoints != null && (
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
                }
              >
                <$OutputSigned
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
          label: stringGetter({ key: STRING_KEYS.MARGIN }),
          renderCell: ({ marginUsdc }) => (
            <TableCell stacked>
              <Output value={marginUsdc} type={OutputType.Fiat} fractionDigits={0} />
              <Output value={stringGetter({ key: STRING_KEYS.ISOLATED })} type={OutputType.Text} />
            </TableCell>
          ),
        },
      ] satisfies ColumnDef<VaultTableRow>[],
    [marketIdToAssetMetadataMap, marketsData, stringGetter]
  );

  return (
    <$Table
      withInnerBorders
      withOuterBorder
      data={vaultsData}
      getRowKey={(row) => row.marketId ?? ''}
      label={stringGetter({ key: STRING_KEYS.MEGAVAULT })}
      onRowAction={(marketId: Key) =>
        navigate(`${AppRoute.Trade}/${marketId}`, { state: { from: AppRoute.Vault } })
      }
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
