import { Key, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { AppRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { Table, type ColumnDef } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';
import { SparklineChart } from '@/components/visx/SparklineChart';

import { useAppSelector } from '@/state/appTypes';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';
import { getVaultDetails } from '@/state/vaultSelectors';

import { getNumberSign } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

type VaultTableRow = ReturnType<typeof getVaultDetails>['positions'][number];

const VAULT_PAGE_SIZE = 50 as const;
export const VaultPositionsTable = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();

  const vaultsData = useAppSelector(getVaultDetails)?.positions;
  const marketsData = orEmptyObj(useAppSelector(getPerpetualMarkets));

  const columns = useMemo<ColumnDef<VaultTableRow>[]>(
    () =>
      [
        {
          columnKey: 'market',
          getCellValue: (row) => row.asset?.id,
          label: stringGetter({ key: STRING_KEYS.MARKET }),
          renderCell: ({ asset, currentLeverageMultiple, currentPosition }) => (
            <TableCell stacked slotLeft={<$AssetIcon symbol={asset.id} />}>
              {asset.name}
              <$CellRow>
                <$OutputSigned
                  value={
                    currentPosition.asset < 0
                      ? stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT })
                      : stringGetter({ key: STRING_KEYS.LONG_POSITION_SHORT })
                  }
                  sign={getNumberSign(currentPosition.asset)}
                  type={OutputType.Text}
                />
                @
                <Output type={OutputType.Multiple} value={currentLeverageMultiple} />
              </$CellRow>
            </TableCell>
          ),
        },
        {
          columnKey: 'size',
          getCellValue: (row) => row.currentPosition.usdc,
          label: stringGetter({ key: STRING_KEYS.SIZE }),
          renderCell: ({ currentPosition, marketId, asset }) => (
            <TableCell stacked>
              <Output value={currentPosition.usdc} type={OutputType.Fiat} fractionDigits={0} />
              <Output
                value={currentPosition.asset}
                type={OutputType.Asset}
                tag={asset.id}
                fractionDigits={marketsData[marketId]?.configs?.stepSizeDecimals}
              />
            </TableCell>
          ),
        },
        {
          columnKey: 'pnl',
          getCellValue: (row) => row.thirtyDayPnl.absolute,
          label: stringGetter({ key: STRING_KEYS.VAULT_THIRTY_DAY_PNL }),
          renderCell: ({ thirtyDayPnl }) => (
            <TableCell
              stacked
              slotRight={
                <$Sparklines style={{ width: 50, height: 50 }}>
                  <SparklineChart
                    data={thirtyDayPnl.sparklinePoints.map((elem, index) => ({
                      x: index + 1,
                      y: elem,
                    }))}
                    xAccessor={(datum) => datum.x}
                    yAccessor={(datum) => datum.y}
                    positive={thirtyDayPnl.absolute > 0}
                  />
                </$Sparklines>
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
          ),
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
    [marketsData, stringGetter]
  );

  return (
    <$Table
      withInnerBorders
      withOuterBorder
      data={vaultsData}
      getRowKey={(row) => row.marketId}
      label={stringGetter({ key: STRING_KEYS.VAULT })}
      onRowAction={(marketId: Key) =>
        navigate(`${AppRoute.Trade}/${marketId}`, { state: { from: AppRoute.Vault } })
      }
      defaultSortDescriptor={{
        column: 'size',
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

const $AssetIcon = styled(AssetIcon)`
  height: 2.5em;
`;
const $CellRow = styled.div`
  ${layoutMixins.row}
  gap: 0.25rem;
`;
const $Sparklines = styled.div`
  margin-left: 0.5rem;
`;
